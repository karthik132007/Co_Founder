"""
Dummy CEO — an LLM instance that acts like the real CEO in all 3 effort modes
(flash / mid / max) and REPORTS which tool it would call for a query, WITHOUT
actually executing any tools.

It mirrors the real CEO agent construction (agents/CEO/CEO.py):
  - flash  -> get_ceo_system_prompt_flash + flash model
  - mid    -> get_ceo_system_prompt (full) + mid model
  - max    -> get_ceo_system_prompt (full) + max model

The real CEO binds its tools to a LangChain agent; this dummy deliberately does
NOT bind tools. It only asks the model to "say" which tool(s) it would use, so
you can sanity-check tool-selection routing against the dataset
(evals/CEO/ceo_test_data.json).

The tool catalog shown to the model is NOT hand-maintained here — it is dumped
straight from agents/agents.json (the "ceo" agent's `tools` array), the SAME
registry the production CEO reads. This keeps the dummy in lock-step with the
real system prompt: same tool names, descriptions, and args.

Usage:
    python evals/CEO/dummy_ceo.py --company-id 1 --effort flash --query "What is our GST number?"
    python evals/CEO/dummy_ceo.py --company-id 1 --effort max --query "What were our total sales in Q1 2026?"
    python evals/CEO/dummy_ceo.py --dataset evals/CEO/ceo_test_data.json
"""


import json

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from agents.CEO.ceo_prompts import get_ceo_system_prompt, get_ceo_system_prompt_flash
from agents.helpers.choose_llm import Task, get_best_llm
from backend.db.get_from_sql import get_company_data


# ── Tool catalog loaded from the SAME registry the real CEO uses ──────────
# The production CEO's tools are defined in agents/agents.json (the "ceo" agent)
# and bound in agents/CEO/ceo_agent_tools.py. We dump those exact definitions
# (name + description + args) into the prompt instead of hand-maintaining a tool
# list here, so the dummy always sees the same tools as the real system.
AGENTS_FILE = Path(__file__).resolve().parents[2] / "agents" / "agents.json"
CEO_AGENT_ID = "ceo"


def load_ceo_tools() -> list[dict]:
    """Return the CEO agent's tool definitions straight from agents/agents.json."""
    with open(AGENTS_FILE, "r", encoding="utf-8") as f:
        registry = json.load(f)
    for agent in registry.get("agents", []):
        if agent.get("id") == CEO_AGENT_ID:
            return [
                {
                    "name": tool["name"],
                    "description": tool.get("description", ""),
                    "args": tool.get("args", {}),
                }
                for tool in agent.get("tools", [])
            ]
    raise RuntimeError(f"Agent '{CEO_AGENT_ID}' not found in {AGENTS_FILE}")


# Catalog of CEO tool names (from agents.json) used for parsing the reply.
CEO_TOOL_CATALOG = load_ceo_tools()
CEO_TOOL_NAMES = [tool["name"] for tool in CEO_TOOL_CATALOG]

TOOL_SELECTION_INSTRUCTION = """\
You are in tool-selection mode. Do NOT call any tool — you have no working tools.
For the founder's request below, decide which tool(s) from the catalog you WOULD call.
Return ONLY a JSON object, e.g. {"tools": ["knowledge_request"]} or {"tools": []} if none.

Routing rules (from your CEO system prompt):
- Company DATA/CSV/Excel/sales questions -> data_analysis_request
- External/web/market/competitor research -> research_request
- Writing content -> writing_request
- Marketing strategy/growth -> marketing_request
- Visual assets/logos/graphics -> graphic_design_request
- Search company documents -> knowledge_request (fast & free)
- If you can answer directly without company data or a specialist -> no tool
"""


def build_dummy_ceo(company_id: int, effort: str = "flash"):
    """Build the CEO LLM + system prompt for the given effort (flash/mid/max). No tools bound.

    Mirrors the real CEO: flash uses the flash system prompt, mid/max use the
    full system prompt; the model is picked per effort.
    """
    if effort not in ("flash", "mid", "max"):
        effort = "flash"

    company_data = get_company_data(company_id)
    if not company_data:
        raise ValueError(f"No company data found for company_id={company_id}")

    system_prompt = (
        get_ceo_system_prompt_flash(company_data)
        if effort == "flash"
        else get_ceo_system_prompt(company_data)
    )
    llm = get_best_llm([Task.PLANNING, Task.RESEARCH, Task.WRITING], effort=effort)
    return llm, system_prompt


def _parse_tools(content: str) -> list[str]:
    """Extract a list of tool names from the model's JSON reply."""
    text = content.strip()
    # Strip markdown code fences (```json ... ```) if the model wraps output.
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) >= 2 else text
        text = text.strip()

    try:
        data = json.loads(text)
        tools = data.get("tools", [])
        if isinstance(tools, list):
            return [str(tool) for tool in tools]
    except (json.JSONDecodeError, AttributeError):
        pass

    # Fallback: scan the raw text for any known tool name.
    return [name for name in CEO_TOOL_NAMES if name in text]


def predict_tools(query: str, company_id: int = 1, effort: str = "flash") -> list[str]:
    """Ask the dummy CEO which tool(s) it would call. Tools are NOT executed.

    Returns a list of tool names parsed from the model's JSON reply,
    e.g. ["knowledge_request"] or [].
    """
    llm, system_prompt = build_dummy_ceo(company_id, effort=effort)
    # Fresh dump of agents/agents.json (CEO tool definitions) into the prompt,
    # so the model sees the exact same tool catalog as the production CEO.
    tool_catalog = load_ceo_tools()
    user_prompt = (
        f"{TOOL_SELECTION_INSTRUCTION}\n\n"
        f"Tool catalog (from agents.json):\n{json.dumps(tool_catalog, indent=2)}\n\n"
        f"Founder's request: {query}"
    )
    response = llm.invoke(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )
    content = response.content if hasattr(response, "content") else str(response)
    if not isinstance(content, str):
        content = str(content)
    return _parse_tools(content)

