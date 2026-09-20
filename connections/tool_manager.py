"""Simple MCP-style tool registry: register -> list -> call.

    tools = ToolManager()

    tools.add(
        "instagram.post_content",
        "Publish one image post to Instagram.",
        func=instagram_manager.post_instagram_content,
        params={"content": {"type": "object", "description": "image_url + caption"}},
        context=["company_id"],          # injected server-side, hidden from the model
    )

    tools.list_tools()                        # what an agent can see
    tools.call_tool("instagram.post_content", {"content": {...}}, company_id=1)
    tools.as_langchain_tools(company_id=1)    # hand to create_agent(tools=[...])
"""

from __future__ import annotations

import asyncio
import inspect
import json
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Any, Callable

_PY_TYPES: dict[str, Any] = {
    "string": str,
    "integer": int,
    "number": float,
    "boolean": bool,
    "object": dict,
    "array": list,
}


@dataclass
class Tool:
    """A tool an agent can call."""

    name: str
    description: str
    func: Callable[..., Any]
    params: dict[str, dict[str, Any]] = field(default_factory=dict)
    context: list[str] = field(default_factory=list)

    @property
    def input_schema(self) -> dict[str, Any]:
        """JSON Schema of the arguments the model is allowed to pass."""
        required = [name for name, spec in self.params.items() if "default" not in spec]
        schema: dict[str, Any] = {
            "type": "object",
            "properties": {
                name: {k: v for k, v in spec.items() if k != "default"}
                for name, spec in self.params.items()
            },
        }
        if required:
            schema["required"] = required
        return schema

    def manifest(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }


class ToolManager:
    """Holds tools and lets an agent list and call them."""

    def __init__(self) -> None:
        self.tools: dict[str, Tool] = {}

    def add(
        self,
        name: str,
        description: str,
        func: Callable[..., Any] | None = None,
        params: dict[str, dict[str, Any]] | None = None,
        context: list[str] | None = None,
    ):
        """Register a tool.

        Used directly::

            tools.add("x", "does x", func=fn, params={"q": {"description": "query"}})

        or as a decorator::

            @tools.add("x", "does x")
            def x(q: str):
                ...

        ``params`` is only needed to add descriptions; otherwise the argument
        types and defaults are read from the function signature.
        """

        def register(fn: Callable[..., Any]) -> Callable[..., Any]:
            tool_params = (
                params
                if params is not None
                else _params_from_signature(fn, context or [])
            )
            self.tools[name] = Tool(
                name, description, fn, tool_params, list(context or [])
            )
            return fn

        return register if func is None else register(func)

    def list_tools(self) -> list[dict[str, Any]]:
        """Everything an agent can see: name, description, input_schema."""
        return [tool.manifest() for tool in self.tools.values()]

    def call_tool(
        self, name: str, arguments: dict[str, Any] | None = None, **context: Any
    ) -> Any:
        """Run one tool. ``context`` (e.g. company_id) always wins over arguments."""
        if name not in self.tools:
            raise KeyError(f"Unknown tool: {name}")
        tool = self.tools[name]
        injected = {k: v for k, v in context.items() if k in tool.context}
        result = tool.func(**{**(arguments or {}), **injected})
        return _run(result) if inspect.isawaitable(result) else result

    def as_langchain_tools(self, **context: Any) -> list[Any]:
        """Turn every tool into a LangChain tool for create_agent()."""
        from langchain_core.tools import StructuredTool

        tools: list[Any] = []
        for tool in self.tools.values():

            def _call(
                _tool: Tool = tool,
                _context: dict[str, Any] = context,
                **kwargs: Any,
            ) -> str:
                # A single bad tool call (bad id, expired token, rate
                # limit, …) must come back as text the model can recover
                # from — never as an exception that kills the whole
                # LangGraph run and surfaces as HTTP 500.
                try:
                    return _stringify(self.call_tool(_tool.name, kwargs, **_context))
                except Exception as exc:
                    return (
                        f"Tool '{_tool.name}' failed: {exc}. "
                        f"Tell the user what happened in plain language and, "
                        f"if an id was involved, call the matching search/list "
                        f"tool first and retry with an exact id from its results. "
                        f"Never invent ids."
                    )

            tools.append(
                StructuredTool.from_function(
                    func=_call,
                    name=tool.name.replace(".", "_"),
                    description=tool.description,
                    args_schema=_args_schema(tool),
                    handle_tool_error=True,
                )
            )
        return tools


def _args_schema(tool: Tool):
    from pydantic import Field, create_model

    fields: dict[str, Any] = {}
    for name, spec in tool.params.items():
        if "default" in spec:
            field = Field(spec["default"], description=spec.get("description", ""))
        else:
            field = Field(..., description=spec.get("description", ""))
        fields[name] = (_PY_TYPES.get(spec.get("type", "string"), Any), field)
    return create_model(f"{tool.name.replace('.', '_')}_args", **fields)


def _params_from_signature(
    func: Callable[..., Any], context: list[str]
) -> dict[str, dict[str, Any]]:
    """Read a tool's arguments (type + default) from its function signature."""
    params: dict[str, dict[str, Any]] = {}
    for name, parameter in inspect.signature(func).parameters.items():
        if name in context or parameter.kind in (
            inspect.Parameter.VAR_POSITIONAL,
            inspect.Parameter.VAR_KEYWORD,
        ):
            continue
        spec: dict[str, Any] = {"type": _json_type(parameter.annotation)}
        if parameter.default is not inspect.Parameter.empty:
            spec["default"] = parameter.default
        params[name] = spec
    return params


def _json_type(annotation: Any) -> str:
    for json_type, python_type in _PY_TYPES.items():
        if annotation is python_type:
            return json_type
    return "string"


def _stringify(result: Any) -> str:
    return result if isinstance(result, str) else json.dumps(result, default=str)


def _run(coro: Any) -> Any:
    """Run a coroutine from sync code (safe inside a running event loop)."""
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    with ThreadPoolExecutor(max_workers=1) as pool:
        return pool.submit(asyncio.run, coro).result()

