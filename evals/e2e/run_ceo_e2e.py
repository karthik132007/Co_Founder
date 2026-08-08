"""Run CEO end-to-end prompt-tweak evaluations with an auditable trace.

Examples:
    # Run every dataset task once for the normal and reflection variants.
    python -m evals.e2e.run_ceo_e2e --tweaks normal reflection --overwrite

    # Run one case while iterating on a prompt tweak.
    python -m evals.e2e.run_ceo_e2e --task-id CEO_026 --tweaks explicit_planning

The output is deliberately compact for analytics and LLM judging: final
answer, CEO tool decisions, delegated tasks, timings, token totals and resource
use. It does not retain raw transcripts, tool outputs, provider metadata or
hidden model chain-of-thought.
"""

from __future__ import annotations

import argparse
import json
import signal
import time
import uuid
from collections import defaultdict
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from langchain_core.callbacks import BaseCallbackHandler

from agents.CEO.ceo_resources import format_resources_for_prompt, get_session_resources
from evals.e2e.tweaks.build_ceo import build_test_ceo, new_session


DEFAULT_DATASET = Path("evals/e2e/ceo_only_e2e.json")
DEFAULT_OUTPUT = Path("evals/e2e/ceo_answers.json")
DEFAULT_TWEAKS = [
    "normal",
    "cot_n_shot",
    "explicit_planning",
    "reflection",
    "Verification-first",
    "tight_budget",
]
SUBAGENT_TOOLS = {
    "research_request",
    "writing_request",
    "marketing_request",
    "data_analysis_request",
    "graphic_design_request",
}
MAX_VISIBLE_TEXT = 1_500
DEFAULT_SUBAGENT_RESULT_CHARS = 4_000

# Per-effort wall-clock caps for a single eval case. A case that exceeds its
# cap is recorded as status="timeout" and the harness moves on (resumable with
# --retry-errors). These are safety rails against hung LLM/e2b calls, not
# quality gates — recorded averages are flash ~33s, mid ~98s, max ~324s.
DEFAULT_TIMEOUTS = {"flash": 120, "mid": 420, "max": 900}
# Expected seconds per effort used only for the startup duration estimate
# (from recorded run data, not a guarantee).
_ESTIMATED_AVG_SECONDS = {"flash": 35, "mid": 100, "max": 330}


class CaseTimeout(Exception):
    """Raised when a single eval case exceeds its wall-clock budget."""


@contextmanager
def _timeout(seconds: float):
    """Bound a block of code with SIGALRM (POSIX). No-op where unavailable."""
    if not (seconds and seconds > 0 and hasattr(signal, "SIGALRM")):
        yield
        return

    def _handler(_signum: int, _frame: Any) -> None:  # noqa: ARG001
        raise CaseTimeout(f"case exceeded {seconds:.0f}s")

    old_handler = signal.signal(signal.SIGALRM, _handler)
    signal.alarm(int(seconds))
    try:
        yield
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, old_handler)


def _json_safe(value: Any) -> Any:
    """Convert LangChain/provider objects to values JSON can persist."""
    try:
        return json.loads(json.dumps(value, default=str))
    except (TypeError, ValueError):
        return str(value)


def _content_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    return json.dumps(_json_safe(content), ensure_ascii=False)


def _short_text(value: Any, limit: int = MAX_VISIBLE_TEXT) -> str:
    """Keep a useful preview without letting a trace dominate the dataset."""
    text = _content_text(value)
    return text if limit == 0 or len(text) <= limit else text[:limit] + "… [truncated]"


class TimingTrace(BaseCallbackHandler):
    """Collect individual LLM and tool latencies without changing execution."""

    raise_error = False

    def __init__(self) -> None:
        self._starts: dict[str, tuple[str, float, dict[str, Any]]] = {}
        self.llm_calls: list[dict[str, Any]] = []
        self.tool_calls: list[dict[str, Any]] = []

    def on_llm_start(self, serialized: dict[str, Any], prompts: list[str], *, run_id: Any, **_: Any) -> None:
        self._starts[str(run_id)] = (
            "llm",
            time.perf_counter(),
            {"name": serialized.get("name") or serialized.get("id", ["unknown"])[-1]},
        )

    def on_llm_end(self, response: Any, *, run_id: Any, **_: Any) -> None:
        self._finish(str(run_id), "llm", output=response)

    def on_llm_error(self, error: BaseException, *, run_id: Any, **_: Any) -> None:
        self._finish(str(run_id), "llm", error=error)

    def on_tool_start(self, serialized: dict[str, Any], input_str: str, *, run_id: Any, **_: Any) -> None:
        self._starts[str(run_id)] = (
            "tool",
            time.perf_counter(),
            {"name": serialized.get("name") or serialized.get("id", ["unknown"])[-1]},
        )

    def on_tool_end(self, output: Any, *, run_id: Any, **_: Any) -> None:
        self._finish(str(run_id), "tool", output=output)

    def on_tool_error(self, error: BaseException, *, run_id: Any, **_: Any) -> None:
        self._finish(str(run_id), "tool", error=error)

    def _finish(self, run_id: str, expected_kind: str, *, output: Any = None, error: BaseException | None = None) -> None:
        started = self._starts.pop(run_id, None)
        if not started:
            return
        kind, started_at, record = started
        if kind != expected_kind:
            return
        record["duration_ms"] = round((time.perf_counter() - started_at) * 1000, 2)
        record["status"] = "error" if error else "ok"
        if error:
            record["error"] = str(error)
        # Inputs are present in the CEO tool-decision trace and final/tool
        # outputs are deliberately excluded: they dwarf the eval data.
        if kind == "tool":
            self.tool_calls.append(record)
        else:
            self.llm_calls.append(record)


def _ceo_tool_trace(messages: list[Any]) -> list[dict[str, Any]]:
    """The small part of the trajectory a judge needs to score routing."""
    steps: list[dict[str, Any]] = []
    for message in messages:
        if getattr(message, "type", "") != "ai":
            continue
        tool_calls = []
        for call in getattr(message, "tool_calls", []) or []:
            tool_calls.append({"name": call.get("name"), "args": _json_safe(call.get("args", {}))})
        content = _content_text(getattr(message, "content", ""))
        if content or tool_calls:
            step: dict[str, Any] = {}
            if content:
                step["text"] = _short_text(content)
            if tool_calls:
                step["tool_calls"] = tool_calls
            steps.append(step)
    return steps


def _token_metrics(messages: list[Any]) -> dict[str, Any]:
    totals: defaultdict[str, int] = defaultdict(int)
    for message in messages:
        usage = getattr(message, "usage_metadata", None)
        if not isinstance(usage, dict):
            continue
        for key in ("input_tokens", "output_tokens", "total_tokens"):
            value = usage.get(key)
            if isinstance(value, (int, float)):
                totals[key] += int(value)
    return dict(totals)


def _delegations(messages: list[Any]) -> list[dict[str, Any]]:
    """Extract the exact task prompt the CEO supplied to every subagent."""
    records: list[dict[str, Any]] = []
    for message in messages:
        for call in getattr(message, "tool_calls", []) or []:
            if call.get("name") not in SUBAGENT_TOOLS:
                continue
            args = call.get("args", {})
            records.append(
                {
                    "tool": call["name"],
                    "subagent_prompt": args.get("task"),
                }
            )
    return records


def _subagent_results(messages: list[Any], limit: int) -> list[dict[str, Any]]:
    """Keep the useful return from delegated agents, not every tool payload."""
    results: list[dict[str, Any]] = []
    for message in messages:
        tool_name = getattr(message, "name", None)
        if getattr(message, "type", "") != "tool" or tool_name not in SUBAGENT_TOOLS:
            continue
        response = _content_text(getattr(message, "content", ""))
        results.append(
            {
                "tool": tool_name,
                "tool_call_id": getattr(message, "tool_call_id", None),
                "response": _short_text(response, limit),
                "truncated": limit != 0 and len(response) > limit,
            }
        )
    return results


def _read_output(path: Path, overwrite: bool) -> list[dict[str, Any]]:
    if overwrite or not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Output file is not valid JSON: {path}") from exc


def _write_output(path: Path, records: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def _record_identity(record: dict[str, Any]) -> tuple[Any, Any, Any]:
    variant = record.get("variant", record.get("configuration", {}))
    task = record.get("task", {})
    return (
        task.get("id", record.get("task_id")),
        variant.get("tweak"),
        variant.get("repetition"),
    )


def run_case(
    case: dict[str, Any],
    *,
    agent: Any,
    tweak: str,
    tweak_prompt: str,
    effort: str,
    repetition: int,
    subagent_result_chars: int,
    timeout_seconds: float = 0,
) -> dict[str, Any]:
    session_id = new_session(effort=effort, tight=tweak == "tight_budget")
    trace = TimingTrace()
    started = time.perf_counter()
    result: dict[str, Any] | None = None
    failure: str | None = None
    timed_out = False
    try:
        messages = []
        # Match production talk_to_ceo: the CEO must see the per-session
        # limits before it decides which specialists/tools to use.
        resource_prompt = format_resources_for_prompt(session_id)
        if resource_prompt:
            messages.append({"role": "system", "content": resource_prompt})
        if tweak_prompt:
            messages.append({"role": "system", "content": tweak_prompt})
        messages.append({"role": "user", "content": case["query"]})
        with _timeout(timeout_seconds):
            result = agent.invoke({"messages": messages}, config={"callbacks": [trace]})
    except CaseTimeout as exc:  # Don't let one hung case stall the whole run.
        timed_out = True
        failure = f"timeout after {timeout_seconds:.0f}s"
    except Exception as exc:  # Persist failed cases too, so long runs can resume.
        failure = f"{type(exc).__name__}: {exc}"
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    finished_at = datetime.now(UTC)
    final_messages = result.get("messages", []) if result else []
    final_response = _content_text(final_messages[-1].content) if final_messages else None

    return {
        "schema_version": 2,
        "run_id": uuid.uuid4().hex,
        "recorded_at": finished_at.isoformat(),
        "task": {
            "id": case["task_id"],
            "query": case["query"],
            "category": case.get("category"),
            "difficulty": case.get("difficulty"),
            "expected_tools": case.get("requires", []),
        },
        "variant": {
            "effort": effort,
            "tweak": tweak,
            "repetition": repetition,
        },
        "response": final_response,
        "ceo_trace": _ceo_tool_trace(final_messages),
        "subagent_prompts": _delegations(final_messages),
        "subagent_results": _subagent_results(final_messages, subagent_result_chars),
        "metrics": {
            "status": "timeout" if timed_out else ("error" if failure else "ok"),
            "error": failure,
            "total_ms": elapsed_ms,
            "llm": {
                "count": len(trace.llm_calls),
                "total_ms": round(sum(item["duration_ms"] for item in trace.llm_calls), 2),
            },
            "tools": trace.tool_calls,
            "tokens": _token_metrics(final_messages),
            "resources": _json_safe(get_session_resources(session_id)),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--company-id", type=int, default=1)
    parser.add_argument("--tweaks", nargs="+", default=DEFAULT_TWEAKS)
    parser.add_argument("--task-id", action="append", help="Run only this task ID (repeatable).")
    parser.add_argument("--limit", type=int, help="Run only the first N selected cases.")
    parser.add_argument("--effort", choices=["flash", "mid", "max"], help="Override the dataset mode.")
    parser.add_argument("--repeat", type=int, default=1, help="Independent runs per case/tweak.")
    parser.add_argument(
        "--subagent-result-chars",
        type=int,
        default=DEFAULT_SUBAGENT_RESULT_CHARS,
        help="Characters retained per subagent return; use 0 for full returns (default: 4000).",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=None,
        help="Per-case wall-clock timeout in seconds (0 disables). Default per effort: "
        "flash 120 / mid 420 / max 900.",
    )
    parser.add_argument("--overwrite", action="store_true", help="Replace the output file before running.")
    parser.add_argument("--retry-errors", action="store_true", help="Rerun and replace only prior error records.")
    parser.add_argument("--fail-fast", action="store_true")
    args = parser.parse_args()
    if args.repeat < 1:
        parser.error("--repeat must be at least 1")
    if args.subagent_result_chars < 0:
        parser.error("--subagent-result-chars cannot be negative")

    cases = json.loads(args.dataset.read_text(encoding="utf-8"))
    if not isinstance(cases, list):
        parser.error("Dataset must contain a JSON array")
    if args.task_id:
        requested = set(args.task_id)
        cases = [case for case in cases if case.get("task_id") in requested]
        missing = requested - {case.get("task_id") for case in cases}
        if missing:
            parser.error(f"Task IDs not found: {', '.join(sorted(missing))}")
    if args.limit is not None:
        cases = cases[: args.limit]

    records = _read_output(args.output, args.overwrite)
    completed = {
        _record_identity(record)
        for record in records
        if not args.retry_errors or record.get("metrics", {}).get("status") != "error"
    }
    total = len(cases) * len(args.tweaks) * args.repeat
    done = len(completed)
    jobs: list[tuple[dict[str, Any], str, str, int]] = []
    for tweak in args.tweaks:
        for case in cases:
            effort = args.effort or case.get("mode", "flash")
            for repetition in range(1, args.repeat + 1):
                identity = (case["task_id"], tweak, repetition)
                if identity in completed:
                    continue
                jobs.append((case, effort, tweak, repetition))

    effort_counts: dict[str, int] = defaultdict(int)
    for _case, _effort, _tweak, _rep in jobs:
        effort_counts[_effort] += 1
    est_minutes = sum(
        effort_counts.get(effort, 0) * avg
        for effort, avg in _ESTIMATED_AVG_SECONDS.items()
    ) / 60
    timeout_desc = (
        f"{args.timeout}s (all efforts)"
        if args.timeout is not None
        else "effort-based: " + ", ".join(f"{k}={v}s" for k, v in DEFAULT_TIMEOUTS.items())
    )
    print(
        f"Running {len(jobs)} evals sequentially. ",
        f"Estimated wall-clock: ~{est_minutes:.0f} min "
        f"({dict(effort_counts)} jobs by effort; flash ~35s, mid ~100s, max ~330s each). "
        f"Per-case timeout: {timeout_desc}.",
        flush=True,
    )

    def save(record: dict[str, Any]) -> bool:
        nonlocal done
        if args.retry_errors:
            identity = _record_identity(record)
            records[:] = [item for item in records if _record_identity(item) != identity]
        records.append(record)
        _write_output(args.output, records)  # one coordinator writes the JSON file
        done += 1
        task_id = record["task"]["id"]
        status = record["metrics"]["status"]
        print(f"[{done}/{total}] {task_id} | {record['variant']['tweak']} | {status}", flush=True)
        if status in ("error", "timeout"):
            print(f"  {status.upper()}: {record['metrics']['error']}", flush=True)
            return False
        return True

    agents: dict[tuple[str, str], tuple[Any, str]] = {}
    try:
        for job in jobs:
            case, effort, tweak, repetition = job
            print(
                f"[{done + 1}/{total}] starting {case['task_id']} | {effort} | {tweak} | run {repetition}",
                flush=True,
            )
            agent_key = (effort, tweak)
            if agent_key not in agents:
                agents[agent_key] = build_test_ceo(args.company_id, effort=effort, tweak=tweak)
            agent, tweak_prompt = agents[agent_key]
            timeout_seconds = (
                args.timeout if args.timeout is not None else DEFAULT_TIMEOUTS.get(effort, 300)
            )
            record = run_case(
                case,
                agent=agent,
                tweak=tweak,
                tweak_prompt=tweak_prompt,
                effort=effort,
                repetition=repetition,
                subagent_result_chars=args.subagent_result_chars,
                timeout_seconds=timeout_seconds,
            )
            if not save(record) and args.fail_fast:
                return 1
    except KeyboardInterrupt:
        print("Stopped. Completed cases are already saved; rerun this command to resume.", flush=True)
        return 130
    print(f"Saved {len(records)} records to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
