"""Run harness judging over a set of recorded CEO answers.

Reads a JSON array of CEO eval records (the v2 compact schema produced by
``evals/e2e/run_ceo_e2e.py``, e.g. ``evals/e2e/ceo_answers_best5.json``),
runs each recorded answer through the judge models, and persists one record
per (answer, judge) to ``evals/e2e/judges_scores.json``.

Each persisted record stores the judge number, the judge's raw response, and
the ``run_id`` taken from the CEO answer it evaluated.

Usage:
    python -m evals.e2e.run_judging \
        --input evals/e2e/ceo_answers_best5.json \
        --output evals/e2e/judges_scores.json

Examples:
    # Judge only the first answer with the first two judges.
    python -m evals.e2e.run_judging --limit 1 --judges 1 2

    # Start fresh, dropping any previously recorded results.
    python -m evals.e2e.run_judging --overwrite

The script auto-appends and resumes by default: after each judge call it
persists the running results to the output file, so if the run is stopped it
can simply be re-run and will skip answers/judges already completed (only
errored entries are retried).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from langchain.agents import create_agent

from agents.helpers.CreateLLM import create_llm
from evals.e2e.get_harness_judje_prompts import get_harness_judge_prompt

# OpenRouter model ids used as the independent judges. Index + 1 is the
# "judge number" stored in the output (1-based, matches the models list).
JUDGE_MODELS = [
    "~deepseek/deepseek-v4-flash-latest",
    "qwen/qwen3.7-flash",
    "openai/gpt-5.6-luna",
]

DEFAULT_INPUT = Path("evals/e2e/ceo_answers_best5.json")
DEFAULT_OUTPUT = Path("evals/e2e/judges_scores.json")

# The numeric fields every judge must return, in output order.
SCORE_FIELDS = [
    "tool_call_score",
    "trajectory_score",
    "final_answer_score",
    "constraint_adherence_score",
    "groundedness_score",
    "hallucination_score",
    "overall_score",
]

# Keep the prompt bounded; traces are truncated like the harness does.
MAX_TRACE_TEXT = 6_000


def extract_verdict(text: str | None) -> dict[str, Any]:
    """Parse a judge's raw response into a structured verdict dict.

    Tolerates ```json fences, ``` fences, and surrounding prose by locating
    the outermost balanced JSON object. Returns a dict with SCORE_FIELDS,
    strengths, weaknesses, and reasoning (or an empty dict if unparseable).
    """
    if not text:
        return {}
    stripped = str(text).strip()
    # Drop a single markdown code fence if present.
    if stripped.startswith("```"):
        first = stripped.find("\n")
        last = stripped.rfind("```")
        if first != -1 and last > first:
            stripped = stripped[first + 1 : last]
    start = stripped.find("{")
    end = stripped.rfind("}")
    if start == -1 or end <= start:
        return {}
    try:
        data = json.loads(stripped[start : end + 1])
    except json.JSONDecodeError:
        return {}
    if not isinstance(data, dict):
        return {}
    return data


def _score(value: Any) -> float | None:
    """Coerce a judge score to a float in [0, 10], else None."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if 0 <= number <= 10 else None


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _trace_text(record: dict[str, Any]) -> str:
    """Render the CEO trace into the compact prompt form a judge expects."""
    trace = record.get("ceo_trace") or []
    try:
        text = json.dumps(trace, ensure_ascii=False, indent=2, default=str)
    except (TypeError, ValueError):
        text = str(trace)
    return text if len(text) <= MAX_TRACE_TEXT else text[:MAX_TRACE_TEXT] + "\n… [truncated]"


def _build_prompt(record: dict[str, Any]) -> str:
    """Assemble the judge prompt from one recorded CEO answer."""
    task = record.get("task") or {}
    variant = record.get("variant") or {}
    query = task.get("query", "")
    effort = variant.get("effort", "unknown")
    response = record.get("response", "") or ""
    trace = _trace_text(record)

    return f"""User Query:
{query}

Execution Mode:
{effort}

CEO Reasoning Trace / Tool Calls:
{trace}

Final Response:
{response}
"""


def build_judges() -> list[Any]:
    """Instantiate the judge agents from JUDGE_MODELS."""
    # Empty dict (not "") so get_ceo_system_prompt can .get() fields safely.
    system_prompt = get_harness_judge_prompt(company_metadata={})
    return [
        create_agent(model=create_llm(model), system_prompt=system_prompt)
        for model in JUDGE_MODELS
    ]


def _base_entry(record: dict[str, Any]) -> dict[str, Any]:
    """The identity fields shared by every judge record."""
    task = record.get("task") or {}
    return {
        "judge_number": None,
        "response": None,
        "run_id": record.get("run_id"),
        "task_id": task.get("id"),
        "query": task.get("query", ""),
        "error": None,
    }


def _apply_verdict(entry: dict[str, Any], verdict: dict[str, Any]) -> dict[str, Any]:
    """Flatten the parsed verdict into the entry as first-class fields."""
    scores: dict[str, float] = {}
    for field in SCORE_FIELDS:
        parsed = _score(verdict.get(field))
        if parsed is not None:
            scores[field] = parsed
    entry["scores"] = scores
    entry["strengths"] = _string_list(verdict.get("strengths"))
    entry["weaknesses"] = _string_list(verdict.get("weaknesses"))
    entry["reasoning"] = str(verdict.get("reasoning") or "").strip()
    if not entry["response"] and verdict:
        entry["response"] = json.dumps(verdict, ensure_ascii=False, indent=2)
    return entry


def judge_one(judge_number: int, agent: Any, record: dict[str, Any]) -> dict[str, Any]:
    """Run a single judge against one CEO answer and extract the verdict.

    Returns one record with judge_number, run_id, the raw response, and the
    extracted fields: scores (dict), strengths, weaknesses, reasoning.
    """
    prompt = _build_prompt(record)
    entry = _base_entry(record)
    entry["judge_number"] = judge_number
    try:
        response = agent.invoke({"messages": [{"role": "user", "content": prompt}]})
        raw = response["messages"][-1].content
        entry["response"] = raw
        _apply_verdict(entry, extract_verdict(raw))
        if not entry["scores"]:
            entry["error"] = "Judge response did not contain parseable scores"
    except Exception as exc:  # Don't let one judge failure drop the answer.
        entry["error"] = f"{type(exc).__name__}: {exc}"
    return entry


def reparse_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Offline: extract structured fields from raw ``response`` strings.

    Useful for upgrading an existing judges_scores.json without re-calling
    the LLM. Entries with no parseable scores keep their raw response.
    """
    repaired: list[dict[str, Any]] = []
    for entry in entries:
        verdict = extract_verdict(entry.get("response"))
        if verdict:
            _apply_verdict(entry, verdict)
        repaired.append(entry)
    return repaired


def _load_records(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise RuntimeError(f"Expected a JSON array of CEO answers in {path}")
    return data


def _read_existing(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def _persist(path: Path, records: list[dict[str, Any]]) -> None:
    """Atomically write all judge records to disk (tmp file + replace)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Path to the CEO answers JSON.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Path to write judge scores to.")
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Only judge the first N answers (0 = all). Useful for spot checks.",
    )
    parser.add_argument(
        "--judges",
        type=int,
        nargs="*",
        default=None,
        help="1-based judge numbers to run (default: all).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Start fresh: ignore existing output and drop previously completed records.",
    )
    parser.add_argument(
        "--reparse",
        action="store_true",
        help="Offline: extract structured fields from raw responses already in the output file (no LLM calls).",
    )
    args = parser.parse_args()

    if args.reparse:
        existing = _read_existing(args.output)
        repaired = reparse_entries(existing)
        _persist(args.output, repaired)
        parsed = sum(1 for e in repaired if e.get("scores"))
        print(f"Reparsed {parsed}/{len(repaired)} records from {args.output}")
        return

    records = _load_records(args.input)
    if args.limit:
        records = records[: args.limit]
    if not records:
        print(f"No CEO answers found in {args.input}")
        return

    # Keep (original 1-based judge_number, agent) so resumed numbers stay stable.
    judges = build_judges()
    if args.judges:
        judge_pairs = [
            (number, judges[number - 1])
            for number in args.judges
            if 1 <= number <= len(judges)
        ]
        if not judge_pairs:
            print(f"No valid judge numbers in {args.judges}; expected 1..{len(judges)}")
            return
    else:
        judge_pairs = list(enumerate(judges, start=1))

    # Auto-append/resume: keep completed entries, drop errored ones (so they
    # get retried), and skip (run_id, judge_number) pairs already recorded.
    all_results: list[dict[str, Any]] = [] if args.overwrite else _read_existing(args.output)
    if not args.overwrite:
        all_results = [entry for entry in all_results if entry.get("error") is None]
    done: set[tuple[Any, int]] = {
        (entry.get("run_id"), entry.get("judge_number"))
        for entry in all_results
        if entry.get("judge_number") is not None
    }

    print(f"Judging {len(records)} answers with {len(judge_pairs)} judge(s)…")
    for index, record in enumerate(records, start=1):
        run_id = record.get("run_id")
        for judge_number, agent in judge_pairs:
            if not args.overwrite and (run_id, judge_number) in done:
                print(f"  [{index}/{len(records)}] run_id={run_id} "
                      f"judge={judge_number} skipped (already done)")
                continue
            entry = judge_one(judge_number, agent, record)
            all_results.append(entry)
            # Persist after every judge call so a stopped run keeps progress.
            _persist(args.output, all_results)
            status = "error" if entry["error"] else "ok"
            print(f"  [{index}/{len(records)}] run_id={run_id} "
                  f"judge={judge_number} status={status}")

    print(f"Wrote {len(all_results)} records to {args.output}")


if __name__ == "__main__":
    main()
