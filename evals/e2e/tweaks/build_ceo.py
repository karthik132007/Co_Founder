"""
Global test-CEO builder for the e2e tweaks harness.

Builds a CEO agent that mirrors the production one (agents/CEO/CEO.py) but
WITHOUT the interactive ``ask_mcq_for_user`` tool (can't be answered in an
automated harness). The production CEO in agents/ is never touched.

A tweak is loaded from ``evals/e2e/tweaks/<name>.py`` — each file defines a
``TWEAK`` string (e.g. ``TWEAK = \"\"\"...\"\"\"``). The tweak is returned to
the caller so it can be injected as a separate system message placed RIGHT
BEFORE the user query (high-attention position — NOT appended to the end of
the system prompt where it would get less attention).

Tweaks: normal (no tweak), cot_n_shot, explicit_planning, reflection,
Verification-first, tight_budget ...

CLI testing: call new_session() to create a Redis-backed session (no DB).
The tight_budget tweak is applied by passing tight=True to new_session().
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from langchain.agents import create_agent

from agents.CEO.ceo_agent_tools import _build_ceo_tools
from agents.CEO.ceo_prompts import get_ceo_system_prompt, get_ceo_system_prompt_flash
from agents.helpers.choose_llm import Task, get_best_llm
from backend.db.get_from_sql import get_company_data

EXCLUDED_TOOL = "ask_mcq_for_user"
TWEAKS_DIR = Path(__file__).resolve().parent


def _load_tweak(name: str) -> str:
    """Read the ``TWEAK`` string from tweaks/<name>.py, or '' if none."""
    if not name or name == "normal":
        return ""
    path = TWEAKS_DIR / f"{name}.py"
    if not path.exists():
        raise FileNotFoundError(f"Tweak file not found: {path}")
    namespace: dict = {}
    exec(compile(path.read_text(encoding="utf-8"), str(path), "exec"), namespace)
    return str(namespace.get("TWEAK", "")).strip()


def build_test_ceo(company_id: int = 1, effort: str = "flash", tweak: str = "normal"):
    """Build the test CEO agent (no ask_mcq_for_user) for the given tweak.

    Returns (agent, tweak_prompt). Inject tweak_prompt as a system message
    immediately before the user query:

        messages = ([{"role": "system", "content": tweak_prompt}] if tweak_prompt else [])
        messages.append({"role": "user", "content": query})
        result = agent.invoke({"messages": messages})
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

    tools = [
        t for t in _build_ceo_tools(company_id)
        if getattr(t, "name", "") != EXCLUDED_TOOL
    ]

    agent = create_agent(
        name=f"test_ceo_{effort}",
        model=get_best_llm([Task.PLANNING, Task.RESEARCH, Task.WRITING], effort=effort),
        system_prompt=system_prompt,
        tools=tools,
    )
    return agent, _load_tweak(tweak)


def run_agent(agent, query: str, tweak_prompt: str = "") -> str:
    """Invoke a test CEO agent with a single query and optional tweak prompt.

    The tweak is injected as a system message right before the user query so
    it gets maximal attention instead of being buried at the prompt tail.
    """
    messages = ([{"role": "system", "content": tweak_prompt}] if tweak_prompt else [])
    messages.append({"role": "user", "content": query})
    result = agent.invoke({"messages": messages})
    return result["messages"][-1].content


def new_session(effort: str = "flash", tight: bool = False) -> str:
    """Create a Redis-backed test session for CLI runs (no DB involved).

    Generates a fresh session_id locally, initializes the resource budget in
    Redis, and registers it as the current request so the CEO's tools can
    consume resources. Returns the session_id.

    tight=True also applies the reduced tight_budget limits.
    """
    import uuid

    from agents.CEO import ceo_state
    from agents.CEO.ceo_resources import init_session_resources

    if effort not in ("flash", "mid", "max"):
        effort = "flash"
    session_id = uuid.uuid4().hex
    init_session_resources(session_id, effort)
    ceo_state.init_request_state(session_id, effort)
    if tight:
        from evals.e2e.tweaks.tight_budget import apply_tight_budget

        apply_tight_budget(session_id, effort)
    return session_id
