"""One place that holds every connection's tools.

    from connections.global_connection_manager import connections

    connections.list_tools()                       # what agents can see
    connections.call_tool("instagram.get_details", company_id=1)
    connections.connection_tools_for(1)            # LangChain tools for create_agent()
"""

from connections.tool_manager import ToolManager
from connections.instagram_tools import register_instagram_tools


class Global_Connection_Manager:
    """Registry of every tool a connected integration exposes."""

    def __init__(self):
        self.tools = ToolManager()
        register_instagram_tools(self.tools)

    def list_tools(self):
        """Every tool from every connection."""
        return self.tools.list_tools()

    def call_tool(self, name, arguments=None, **context):
        """Run one connection tool. Pass company_id as context."""
        return self.tools.call_tool(name, arguments, **context)

    def connection_tools_for(self, company_id):
        """LangChain tools for an agent, with company_id already injected."""
        return self.tools.as_langchain_tools(company_id=company_id)

    def list_connections(self):
        """{connection: {tool_name: description}}"""
        catalog = {}
        for tool in self.list_tools():
            connection, _, name = tool["name"].partition(".")
            catalog.setdefault(connection, {})[name] = tool["description"]
        return catalog


connections = Global_Connection_Manager()
