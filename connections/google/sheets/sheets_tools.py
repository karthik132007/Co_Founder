"""Google Sheets tools registered on the connection ToolManager.

Design notes that matter for the model's behaviour:

  * **No "list my spreadsheets" tool.** The connector holds only the
    `spreadsheets` scope (no Drive), and asking for Drive just to enumerate
    files would be a much wider permission. Every tool therefore takes a
    ``spreadsheet`` argument that accepts a full Sheets URL *or* an id, so the
    founder can simply paste the link.
  * **No `drive`-style search, no live cell formatting, no charts.** These are
    the operations a founder actually asks an agent for (read a table, write
    rows, create a sheet, append a record).
  * **Safety model.** Reads are always safe. The write tools change the
    founder's own file: `write_range` overwrites a range, `append_rows` only
    adds, and `clear_range` deletes content. The prompt rules require an
    explicit request plus a confirmation before any write, and `clear_range`
    is the one to be most careful with.

Reads are truncated (`max_rows`, cell cap) inside the connection manager before
the result can reach a prompt — see `sheets_connection_manager.py`.
"""

from connections.tool_manager import ToolManager

CONNECTION = "google_sheets"

_SPREADSHEET_PARAM = {
    "type": "string",
    "description": (
        "The spreadsheet to act on: paste the full link from the browser "
        "(https://docs.google.com/spreadsheets/d/…/edit#gid=0) or its id."
    ),
}


def register_sheets_tools(tools: ToolManager, client=None) -> None:
    """Add every Google Sheets tool to ``tools``.

    ``client`` is injectable for tests; it defaults to the real connection
    manager. ``company_id`` is server-injected so the model never passes it.
    """
    if client is None:
        from connections.google.sheets.sheets_connection_manager import sheets_manager

        client = sheets_manager

    tools.add(
        f"{CONNECTION}.get_spreadsheet",
        "Describe a Google Sheet: its title, link and every tab (tab name, sheet id, "
        "row/column count, whether it is hidden). Use this FIRST when the founder shares "
        "a spreadsheet so you know which tabs exist before reading a range, and to get the "
        "tab id needed for a gid link.",
        func=client.get_spreadsheet,
        context=["company_id"],
        params={"spreadsheet": _SPREADSHEET_PARAM},
    )

    tools.add(
        f"{CONNECTION}.read_range",
        "Read cells from a Google Sheet and get them back as rows of values. "
        "Use for any question about the contents of a sheet ('what were last month's "
        "sales?', 'summarise this table', 'is X in the list?'). Pass `range` in A1 "
        "notation ('Sheet1!A1:F50') or as a bare tab name to read the whole tab; "
        "leave `range` empty to read the tab the founder's link points at. Call "
        "google_sheets.get_spreadsheet first when you don't know the tab names. "
        "Large ranges are truncated — read a narrower range to see more.",
        func=client.read_range,
        context=["company_id"],
        params={
            "spreadsheet": _SPREADSHEET_PARAM,
            "range": {
                "type": "string",
                "description": (
                    "A1 notation ('Sheet1!A1:F50'), a bare tab name ('Sheet1' = the whole "
                    "tab), or empty to use the tab in the link / the first tab."
                ),
                "default": "",
            },
            "value_render": {
                "type": "string",
                "description": (
                    "FORMATTED_VALUE (default — what the founder sees), UNFORMATTED_VALUE "
                    "(raw numbers/dates for maths) or FORMULA (the formulas themselves)."
                ),
                "default": "FORMATTED_VALUE",
            },
            "max_rows": {
                "type": "integer",
                "description": "Maximum rows to return (1-500, default 500).",
                "default": 500,
            },
        },
    )

    tools.add(
        f"{CONNECTION}.read_multiple_ranges",
        "Read several ranges/tabs from ONE spreadsheet in a single call (cheaper than "
        "calling google_sheets.read_range repeatedly when you need, say, the Summary and "
        "the Data tab together).",
        func=client.read_multiple_ranges,
        context=["company_id"],
        params={
            "spreadsheet": _SPREADSHEET_PARAM,
            "ranges": {
                "type": "array",
                "description": (
                    "The ranges to read, e.g. ['Summary!A1:D10', 'Data!A2:F100'] "
                    "(max 10)."
                ),
                "default": [],
            },
            "value_render": {
                "type": "string",
                "description": "FORMATTED_VALUE, UNFORMATTED_VALUE or FORMULA.",
                "default": "FORMATTED_VALUE",
            },
            "max_rows": {
                "type": "integer",
                "description": "Maximum rows to return per range (1-500, default 500).",
                "default": 500,
            },
        },
    )

    tools.add(
        f"{CONNECTION}.write_range",
        "Set the cells of a range to new values — this OVERWRITES whatever is currently "
        "in those cells (anything outside the range is untouched). Use it to fill in a "
        "report, update figures or build a table the founder asked for. Confirm the "
        "spreadsheet, the exact range and the values with the founder (ask_mcq_for_user) "
        "BEFORE calling it, and never write to a range you were not asked to write to.",
        func=client.write_range,
        context=["company_id"],
        params={
            "spreadsheet": _SPREADSHEET_PARAM,
            "range": {
                "type": "string",
                "description": "The exact A1 range to write, e.g. 'Sheet1!B2:D5'.",
            },
            "values": {
                "type": "array",
                "description": (
                    "The rows to write, e.g. [['Product','Sales'],['Widget',120]]. Each "
                    "inner list is one row; cells must be text, numbers or booleans."
                ),
            },
            "value_input": {
                "type": "string",
                "description": (
                    "USER_ENTERED (default — '=SUM(A:F)' and '1,200' are interpreted like "
                    "the founder typing them) or RAW (stored literally, never parsed)."
                ),
                "default": "USER_ENTERED",
            },
        },
    )

    tools.add(
        f"{CONNECTION}.append_rows",
        "Add rows to the END of a table in a Google Sheet without overwriting anything — "
        "the safe write for logging a record (a new lead, a payment, an experiment "
        "result). Confirm the spreadsheet, the tab and the row contents with the founder "
        "(ask_mcq_for_user) before calling it.",
        func=client.append_rows,
        context=["company_id"],
        params={
            "spreadsheet": _SPREADSHEET_PARAM,
            "range": {
                "type": "string",
                "description": (
                    "The table to append to, e.g. 'Leads!A1:F1' (any range on the target "
                    "tab works — the API finds the last row)."
                ),
            },
            "values": {
                "type": "array",
                "description": "The rows to append, e.g. [['2026-09-20','Acme',500]].",
            },
            "value_input": {
                "type": "string",
                "description": "USER_ENTERED (default) or RAW.",
                "default": "USER_ENTERED",
            },
            "insert_new_rows": {
                "type": "boolean",
                "description": "Insert a blank row when the table sits at the bottom of the sheet (default true).",
                "default": True,
            },
        },
    )

    tools.add(
        f"{CONNECTION}.clear_range",
        "DESTRUCTIVE: delete the contents of a range (the cells stay, the values are "
        "gone and this connector cannot restore them). Only call it when the founder "
        "explicitly asks to clear that exact range, after confirming it — never as a "
        "cleanup step of some other task, and never over a whole tab if a narrower range "
        "would do.",
        func=client.clear_range,
        context=["company_id"],
        params={
            "spreadsheet": _SPREADSHEET_PARAM,
            "range": {
                "type": "string",
                "description": "The exact A1 range to clear, e.g. 'Staging!A2:Z1000'.",
            },
        },
    )

    tools.add(
        f"{CONNECTION}.create_spreadsheet",
        "Create a NEW Google Sheet in the founder's Drive (optionally with named tabs) "
        "and return its id and link — use it when the founder asks for a fresh "
        "spreadsheet, tracker or template rather than an existing one. Confirm the title "
        "and the tab names with the founder before creating it.",
        func=client.create_spreadsheet,
        context=["company_id"],
        params={
            "title": {"type": "string", "description": "The spreadsheet's title."},
            "sheet_names": {
                "type": "array",
                "description": (
                    "Optional tab names to create up front, e.g. ['Leads', 'Revenue']. "
                    "Omit for a single default tab."
                ),
                "default": [],
            },
        },
    )

    tools.add(
        f"{CONNECTION}.add_sheet",
        "Add a new tab to an existing Google Sheet (e.g. 'September', 'Experiment log'). "
        "Nothing else in the spreadsheet changes. Confirm the tab name with the founder "
        "before adding it.",
        func=client.add_sheet,
        context=["company_id"],
        params={
            "spreadsheet": _SPREADSHEET_PARAM,
            "title": {"type": "string", "description": "The new tab's name."},
        },
    )
