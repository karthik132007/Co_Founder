"""Convert verbose v1 CEO eval records to the compact v2 schema.

Usage:
    python -m evals.e2e.compact_ceo_answers --in-place
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


DEFAULT_FILE = Path("evals/e2e/ceo_answers.json")
MAX_VISIBLE_TEXT = 1_500


def _short(value: Any) -> str:
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, default=str)
    return text if len(text) <= MAX_VISIBLE_TEXT else text[:MAX_VISIBLE_TEXT] + "… [truncated]"


def _compact_tool_calls(calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {"name": call.get("name"), "args": call.get("args", {})}
        for call in calls
        if isinstance(call, dict)
    ]


def compact(record: dict[str, Any]) -> dict[str, Any]:
    if record.get("schema_version") == 2:
        # Keep the current compact schema forward-compatible when new fields
        # are added; previously discarded payloads cannot be reconstructed.
        record.setdefault("subagent_results", [])
        return record

    visible_steps = []
    for message in record.get("ceo_visible_reasoning", []):
        if not isinstance(message, dict):
            continue
        content = message.get("content", "")
        tool_calls = _compact_tool_calls(message.get("tool_calls", []))
        if content or tool_calls:
            step: dict[str, Any] = {}
            if content:
                step["text"] = _short(content)
            if tool_calls:
                step["tool_calls"] = tool_calls
            visible_steps.append(step)

    old_metrics = record.get("metrics", {})
    old_tools = old_metrics.get("tool_calls", [])
    compact_tools = [
        {
            key: item[key]
            for key in ("name", "duration_ms", "status", "error")
            if key in item
        }
        for item in old_tools
        if isinstance(item, dict)
    ]
    old_tokens = old_metrics.get("tokens", {})
    tokens = old_tokens.get("totals", old_tokens) if isinstance(old_tokens, dict) else {}
    old_config = record.get("configuration", {})

    return {
        "schema_version": 2,
        "run_id": record.get("run_id"),
        "recorded_at": record.get("finished_at") or record.get("started_at"),
        "task": {
            "id": record.get("task_id"),
            "query": record.get("query"),
            "category": record.get("category"),
            "difficulty": record.get("difficulty"),
            "expected_tools": record.get("expected_tools", []),
        },
        "variant": {
            "effort": old_config.get("effort"),
            "tweak": old_config.get("tweak"),
            "repetition": old_config.get("repetition"),
        },
        "response": record.get("response"),
        "ceo_trace": visible_steps,
        "subagent_prompts": [
            {"tool": item.get("tool"), "subagent_prompt": item.get("subagent_prompt")}
            for item in record.get("subagent_prompts", [])
            if isinstance(item, dict)
        ],
        # v1's raw tool results are converted when available.  Existing files
        # already compacted to v2 cannot recover discarded tool output.
        "subagent_results": [
            {
                "tool": item.get("name"),
                "tool_call_id": None,
                "response": _short(item.get("output", "")),
                "truncated": len(str(item.get("output", ""))) > MAX_VISIBLE_TEXT,
            }
            for item in old_tools
            if isinstance(item, dict) and item.get("name") in {
                "research_request",
                "writing_request",
                "marketing_request",
                "data_analysis_request",
                "graphic_design_request",
            }
        ],
        "metrics": {
            "status": old_metrics.get("status"),
            "error": old_metrics.get("error"),
            "total_ms": old_metrics.get("wall_clock_ms"),
            "llm": {
                "count": old_metrics.get("llm_call_count", len(old_metrics.get("llm_calls", []))),
                "total_ms": old_metrics.get("llm_total_ms"),
            },
            "tools": compact_tools,
            "tokens": tokens,
            "resources": old_metrics.get("session_resources"),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, default=DEFAULT_FILE)
    parser.add_argument("--in-place", action="store_true", help="Replace the supplied JSON file.")
    args = parser.parse_args()
    if not args.in_place:
        parser.error("Pass --in-place to replace the verbose records")

    data = json.loads(args.file.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        parser.error("Expected a JSON array")
    compacted = [compact(record) for record in data if isinstance(record, dict)]
    temporary = args.file.with_suffix(args.file.suffix + ".tmp")
    temporary.write_text(json.dumps(compacted, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(args.file)
    print(f"Compacted {len(compacted)} records in {args.file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
