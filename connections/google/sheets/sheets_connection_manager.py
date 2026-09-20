"""Google Sheets API client (agent side).

Thin, dependency-free wrapper over the Sheets REST API
(`https://sheets.googleapis.com/v4/spreadsheets`) for the tools in
`sheets_tools.py`. Tokens come from the shared Google grant
(`Google_Connection_Manager.get_access_token`) — refreshed automatically — and
never leave the server.

Scope note: the connector asks only for
`https://www.googleapis.com/auth/spreadsheets`, which covers reading and
writing a spreadsheet **by id**, creating spreadsheets and adding sheets.
*Listing* the founder's spreadsheets (or finding one by name) is a Drive API
concern and is deliberately out of scope: the founder hands over the sheet's
URL or id, and `_spreadsheet_id()` accepts either form.

Safety model: every read tool is safe to call. The write tools mutate the
founder's own file, so the prompts require an explicit request plus a
confirmation before any of them runs (see the CONNECTED APPS section of the CEO
prompt and docs/Agents_rules.md). `clear_range` is the destructive one.

Reference: https://developers.google.com/workspace/sheets/api/reference/rest
"""

from __future__ import annotations

import logging
import re
import urllib.parse
from typing import Any

import httpx

from connections.google.google_connection_manager import (
    Google_Connection_Manager,
    connector_is_connected,
)

logger = logging.getLogger(__name__)

SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets"

CONNECTION_ID = "google_sheets"
# Scope the connector needs. Kept in sync with
# google_connection_manager.CONNECTOR_SCOPES["google_sheets"].
SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"

# A sheet is unbounded — one `read_range` on a 50k-row export would blow the
# context window, so reads are truncated (and say so) before reaching a prompt.
_MAX_ROWS_RETURNED = 500
_MAX_CELLS_RETURNED = 6000
_MAX_RANGES_PER_CALL = 10
_MAX_CELLS_WRITTEN = 5000
_MAX_SHEETS_IN_METADATA = 50

# `read_range` / `write_range` accept a spreadsheet id or a full browser URL.
_SPREADSHEET_URL_RE = re.compile(r"/spreadsheets/d/([A-Za-z0-9-_]+)")
_SPREADSHEET_ID_RE = re.compile(r"^[A-Za-z0-9-_]{20,}$")
_GID_RE = re.compile(r"[#&?]gid=(\d+)")

# A1 notation: `A1`, `A1:D10`, `Sheet1!A1:D10`, `'My Sheet'!A1`.
_A1_ONLY_RE = re.compile(r"^[A-Za-z]{1,3}\d{1,7}(:[A-Za-z]{1,3}\d{1,7})?$")
_PLAIN_SHEET_NAME_RE = re.compile(r"^[A-Za-z0-9_]+$")

_VALUE_RENDER_OPTIONS = {"FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"}
_VALUE_INPUT_OPTIONS = {"USER_ENTERED", "RAW"}

# Metadata fields we actually use — keeps a `spreadsheets.get` payload small
# (the full resource embeds every sheet's full grid properties and charts).
_METADATA_FIELDS = (
    "spreadsheetId,properties(title,locale,timeZone),"
    "sheets(properties(sheetId,title,index,sheetType,hidden,"
    "gridProperties(rowCount,columnCount)))"
)


class Sheets_Connection_Manager(Google_Connection_Manager):
    """Read and write the founder's spreadsheets, on behalf of a company."""

    # ------------------------------------------------------------------
    # transport
    # ------------------------------------------------------------------

    async def _request(
        self,
        company_id: int,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Call the Sheets API with the company's (auto-refreshed) token."""
        token = await self._access_token(company_id)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method,
                f"{SHEETS_API_BASE}{path}",
                params=params,
                json=json_body,
                headers={"Authorization": f"Bearer {token}"},
            )

        if response.status_code >= 400:
            raise RuntimeError(_error_message(response))

        if not response.content:
            return {}
        return response.json()

    async def _access_token(self, company_id: int) -> str:
        """The grant's access token, guarded by a Sheets-specific scope check.

        Google connectors share one grant, so a company that connected only
        Gmail *has* a Google connection but not the Sheets scope. Failing here
        with an actionable message beats a bare 403 from Google.
        """
        row = self.get_connection(company_id)
        if not row:
            raise RuntimeError(
                "Google Sheets is not connected for this company. Ask the founder "
                "to connect Google Sheets from the Plugins page."
            )
        if not connector_is_connected(row.get("scopes"), CONNECTION_ID):
            raise RuntimeError(
                "Google Sheets access has not been granted yet (the company's "
                "Google grant does not include the Sheets scope). Ask the founder "
                "to connect Google Sheets from the Plugins page."
            )

        try:
            return await self.get_access_token(company_id)
        except RuntimeError as exc:
            raise RuntimeError(
                f"Google Sheets is not usable right now ({exc}). Ask the founder to "
                "reconnect Google Sheets from the Plugins page."
            ) from exc

    # ------------------------------------------------------------------
    # read
    # ------------------------------------------------------------------

    async def get_spreadsheet(self, company_id: int, spreadsheet: str) -> dict[str, Any]:
        """Spreadsheet metadata: title, URL and every tab."""
        spreadsheet_id = _spreadsheet_id(spreadsheet)
        data = await self._request(
            company_id, "GET", f"/{spreadsheet_id}", params={"fields": _METADATA_FIELDS}
        )
        return _summarize_spreadsheet(data, spreadsheet_id)

    async def read_range(
        self,
        company_id: int,
        spreadsheet: str,
        range: str = "",
        value_render: str = "FORMATTED_VALUE",
        max_rows: int = _MAX_ROWS_RETURNED,
    ) -> dict[str, Any]:
        """Read one range (or a whole tab) and return the values as rows.

        `range` accepts A1 notation (`Sheet1!A1:D10`), a bare tab name
        (`Sheet1` = the whole tab) or nothing at all, in which case the tab
        referenced by the URL's `gid` (or the first tab) is used.
        """
        spreadsheet_id = _spreadsheet_id(spreadsheet)
        resolved_range = await self._resolve_range(company_id, spreadsheet_id, range, spreadsheet)
        render = _option(value_render, _VALUE_RENDER_OPTIONS, "FORMATTED_VALUE")

        data = await self._request(
            company_id,
            "GET",
            f"/{spreadsheet_id}/values/{urllib.parse.quote(resolved_range, safe='')}",
            params={
                "valueRenderOption": render,
                "majorDimension": "ROWS",
                "dateTimeRenderOption": "FORMATTED_STRING",
            },
        )
        return _summarize_values(data, spreadsheet_id, resolved_range, max_rows)

    async def read_multiple_ranges(
        self,
        company_id: int,
        spreadsheet: str,
        ranges: list[str],
        value_render: str = "FORMATTED_VALUE",
        max_rows: int = _MAX_ROWS_RETURNED,
    ) -> dict[str, Any]:
        """Read several ranges in one round trip (one request, N ranges)."""
        spreadsheet_id = _spreadsheet_id(spreadsheet)
        requested = [r for r in (ranges or []) if str(r).strip()]
        if not requested:
            raise ValueError(
                "read_multiple_ranges needs `ranges`, e.g. ['Summary!A1:D10', 'Data!A:F']."
            )
        if len(requested) > _MAX_RANGES_PER_CALL:
            requested = requested[:_MAX_RANGES_PER_CALL]

        render = _option(value_render, _VALUE_RENDER_OPTIONS, "FORMATTED_VALUE")
        # httpx repeats the key for a list value → `?ranges=A&ranges=B`, which is
        # how the Sheets endpoint takes multiple ranges.
        params = {
            "valueRenderOption": render,
            "ranges": [_normalize_range(r) for r in requested],
        }

        data = await self._request(
            company_id, "GET", f"/{spreadsheet_id}/values:batchGet", params=params
        )

        value_ranges = data.get("valueRanges") or []
        results = [
            _summarize_values(
                value_range,
                spreadsheet_id,
                value_range.get("range") or "",
                max_rows,
                include_spreadsheet_id=False,
            )
            for value_range in value_ranges
        ]
        return {
            "spreadsheet_id": spreadsheet_id,
            "spreadsheet_url": _spreadsheet_url(spreadsheet_id),
            "requested_count": len(requested),
            "returned_count": len(results),
            "ranges": results,
        }

    # ------------------------------------------------------------------
    # write
    # ------------------------------------------------------------------

    async def write_range(
        self,
        company_id: int,
        spreadsheet: str,
        range: str,
        values: list[list[Any]],
        value_input: str = "USER_ENTERED",
    ) -> dict[str, Any]:
        """Overwrite a range with `values` (rows of cells). Existing cells in the
        range are replaced; anything outside the range is untouched."""
        spreadsheet_id = _spreadsheet_id(spreadsheet)
        rows = _normalize_values(values)
        _check_write_size(rows)

        resolved_range = _normalize_range(range)
        if not resolved_range:
            raise ValueError(
                "write_range needs an explicit `range` (e.g. 'Sheet1!B2:D5') — refusing "
                "to guess where to write."
            )
        input_option = _option(value_input, _VALUE_INPUT_OPTIONS, "USER_ENTERED")

        data = await self._request(
            company_id,
            "PUT",
            f"/{spreadsheet_id}/values/{urllib.parse.quote(resolved_range, safe='')}",
            params={"valueInputOption": input_option},
            json_body={"range": resolved_range, "majorDimension": "ROWS", "values": rows},
        )
        logger.info(
            "Sheets write — company_id=%s, spreadsheet=%s, range=%s, rows=%s",
            company_id, spreadsheet_id, resolved_range, len(rows),
        )
        return {
            "spreadsheet_id": spreadsheet_id,
            "spreadsheet_url": _spreadsheet_url(spreadsheet_id),
            "range": data.get("updatedRange") or resolved_range,
            "rows_written": len(rows),
            "rows_updated": data.get("updatedRows"),
            "cells_updated": data.get("updatedCells"),
            "status": "written_not_verified",
            "note": "Returned by the Sheets API — call read_range to see the stored values.",
        }

    async def append_rows(
        self,
        company_id: int,
        spreadsheet: str,
        range: str,
        values: list[list[Any]],
        value_input: str = "USER_ENTERED",
        insert_new_rows: bool = True,
    ) -> dict[str, Any]:
        """Append `values` after the last row of the range's table.

        This is the safe "add a record" write: nothing existing is overwritten.
        """
        spreadsheet_id = _spreadsheet_id(spreadsheet)
        rows = _normalize_values(values)
        _check_write_size(rows)

        resolved_range = _normalize_range(range)
        if not resolved_range:
            raise ValueError(
                "append_rows needs an explicit `range` (e.g. 'Leads!A1:F1') — refusing "
                "to guess which table to append to."
            )
        input_option = _option(value_input, _VALUE_INPUT_OPTIONS, "USER_ENTERED")

        data = await self._request(
            company_id,
            "POST",
            f"/{spreadsheet_id}/values/{urllib.parse.quote(resolved_range, safe='')}:append",
            params={
                "valueInputOption": input_option,
                "insertDataOption": "INSERT_ROWS" if insert_new_rows else "OVERWRITE",
            },
            json_body={"range": resolved_range, "majorDimension": "ROWS", "values": rows},
        )
        updates = data.get("updates") or {}
        logger.info(
            "Sheets append — company_id=%s, spreadsheet=%s, range=%s, rows=%s",
            company_id, spreadsheet_id, resolved_range, len(rows),
        )
        return {
            "spreadsheet_id": spreadsheet_id,
            "spreadsheet_url": _spreadsheet_url(spreadsheet_id),
            "range": updates.get("updatedRange") or resolved_range,
            "rows_appended": len(rows),
            "cells_appended": updates.get("updatedCells"),
            "status": "appended_not_verified",
            "note": "Returned by the Sheets API — call read_range to see the stored values.",
        }

    async def clear_range(
        self,
        company_id: int,
        spreadsheet: str,
        range: str,
    ) -> dict[str, Any]:
        """Delete the values in a range (the cells stay, the content goes).

        Destructive and not undoable through this connector: the prompt rules
        require an explicit founder request naming the range.
        """
        spreadsheet_id = _spreadsheet_id(spreadsheet)
        resolved_range = _normalize_range(range)
        if not resolved_range:
            raise ValueError("clear_range needs an explicit `range`.")

        data = await self._request(
            company_id,
            "POST",
            f"/{spreadsheet_id}/values/{urllib.parse.quote(resolved_range, safe='')}:clear",
            json_body={},
        )
        logger.info(
            "Sheets clear — company_id=%s, spreadsheet=%s, range=%s",
            company_id, spreadsheet_id, resolved_range,
        )
        return {
            "spreadsheet_id": spreadsheet_id,
            "spreadsheet_url": _spreadsheet_url(spreadsheet_id),
            "range_cleared": data.get("clearedRange") or resolved_range,
            "status": "cleared",
        }

    async def create_spreadsheet(
        self,
        company_id: int,
        title: str,
        sheet_names: list[str] | None = None,
    ) -> dict[str, Any]:
        """Create a new spreadsheet in the founder's Drive and return its id/URL."""
        clean_title = (title or "").strip()
        if not clean_title:
            raise ValueError("create_spreadsheet needs a `title`.")

        names = [str(name).strip() for name in (sheet_names or []) if str(name).strip()]
        body: dict[str, Any] = {"properties": {"title": clean_title}}
        if names:
            body["sheets"] = [{"properties": {"title": name}} for name in names]

        data = await self._request(company_id, "POST", "", json_body=body)
        spreadsheet_id = data.get("spreadsheetId") or ""
        logger.info(
            "Sheets create — company_id=%s, spreadsheet=%s, tabs=%s",
            company_id, spreadsheet_id, len(names),
        )
        summary = _summarize_spreadsheet(data, spreadsheet_id)
        summary["status"] = "created"
        return summary

    async def add_sheet(
        self,
        company_id: int,
        spreadsheet: str,
        title: str,
    ) -> dict[str, Any]:
        """Add a new tab to an existing spreadsheet (nothing else is changed)."""
        spreadsheet_id = _spreadsheet_id(spreadsheet)
        clean_title = (title or "").strip()
        if not clean_title:
            raise ValueError("add_sheet needs the new tab's `title`.")

        data = await self._request(
            company_id,
            "POST",
            f"/{spreadsheet_id}:batchUpdate",
            json_body={"requests": [{"addSheet": {"properties": {"title": clean_title}}}]},
        )
        added = (
            ((data.get("replies") or [{}])[0].get("addSheet") or {}).get("properties") or {}
        )
        logger.info(
            "Sheets add_sheet — company_id=%s, spreadsheet=%s, title=%s",
            company_id, spreadsheet_id, clean_title,
        )
        return {
            "spreadsheet_id": spreadsheet_id,
            "spreadsheet_url": _spreadsheet_url(spreadsheet_id),
            "sheet_title": added.get("title") or clean_title,
            "sheet_id": added.get("sheetId"),
            "status": "sheet_added",
        }

    # ------------------------------------------------------------------
    # internal helpers
    # ------------------------------------------------------------------

    async def _resolve_range(
        self,
        company_id: int,
        spreadsheet_id: str,
        range: str,
        raw_reference: str = "",
    ) -> str:
        """Work out which range to read.

        Priority: the explicit `range` → the tab referenced by the URL's `gid`
        → the first visible tab. A founder pasting
        `…/spreadsheets/d/<id>/edit#gid=1234` gets that exact tab without having
        to know its name, which is the common real-world case.
        """
        explicit = _normalize_range(range)
        if explicit:
            return explicit

        gid = _extract_gid(raw_reference)
        names = await self._sheet_names(company_id, spreadsheet_id)
        if not names:
            raise RuntimeError(
                "That spreadsheet has no visible sheets to read — check the link or id."
            )
        if gid is not None:
            titled = next((name for name, sheet_id in names if str(sheet_id) == gid), None)
            if titled:
                return _quote_sheet_name(titled)
        return _quote_sheet_name(names[0][0])

    async def _sheet_names(
        self, company_id: int, spreadsheet_id: str
    ) -> list[tuple[str, Any]]:
        """Visible (title, sheet id) pairs, in tab order."""
        data = await self._request(
            company_id, "GET", f"/{spreadsheet_id}", params={"fields": _METADATA_FIELDS}
        )
        return _visible_sheets(data)


sheets_manager = Sheets_Connection_Manager()


# ── parsing / normalisation helpers ─────────────────────────────────────────


def _summarize_spreadsheet(data: dict[str, Any], spreadsheet_id: str) -> dict[str, Any]:
    """Compact view of a `spreadsheets.get` / `create` resource."""
    properties = data.get("properties") or {}
    sheets = []
    for sheet in (data.get("sheets") or [])[:_MAX_SHEETS_IN_METADATA]:
        sheet_properties = sheet.get("properties") or {}
        grid = sheet_properties.get("gridProperties") or {}
        sheets.append(
            {
                "title": sheet_properties.get("title"),
                "sheet_id": sheet_properties.get("sheetId"),
                "index": sheet_properties.get("index"),
                "hidden": bool(sheet_properties.get("hidden")),
                "sheet_type": sheet_properties.get("sheetType"),
                "row_count": grid.get("rowCount"),
                "column_count": grid.get("columnCount"),
            }
        )
    return {
        "spreadsheet_id": data.get("spreadsheetId") or spreadsheet_id,
        "spreadsheet_url": _spreadsheet_url(data.get("spreadsheetId") or spreadsheet_id),
        "title": properties.get("title"),
        "locale": properties.get("locale"),
        "time_zone": properties.get("timeZone"),
        "sheet_count": len(sheets),
        "sheets": sheets,
    }


def _summarize_values(
    data: dict[str, Any],
    spreadsheet_id: str,
    resolved_range: str,
    max_rows: int,
    *,
    include_spreadsheet_id: bool = True,
) -> dict[str, Any]:
    """Truncate a `values` payload so one read cannot flood the context."""
    values = data.get("values") or []
    try:
        row_limit = int(max_rows)
    except (TypeError, ValueError):
        row_limit = _MAX_ROWS_RETURNED
    row_limit = max(1, min(row_limit, _MAX_ROWS_RETURNED))

    total_rows = len(values)
    truncated = total_rows > row_limit
    rows = values[:row_limit]

    width = max((len(row) for row in rows), default=0)
    returned_cells = sum(len(row) for row in rows)
    if returned_cells > _MAX_CELLS_RETURNED and width:
        keep_columns = max(1, _MAX_CELLS_RETURNED // max(len(rows), 1))
        if keep_columns < width:
            rows = [row[:keep_columns] for row in rows]
            width = keep_columns
            truncated = True

    summary: dict[str, Any] = {
        "range": data.get("range") or resolved_range,
        "row_count": len(rows),
        "column_count": width,
        "truncated": truncated,
        "values": rows,
    }
    if include_spreadsheet_id:
        summary["spreadsheet_id"] = spreadsheet_id
        summary["spreadsheet_url"] = _spreadsheet_url(spreadsheet_id)
    if truncated:
        summary["note"] = (
            f"Only the first {len(rows)} row(s) are shown (the range holds "
            f"{total_rows} row(s) and/or is very wide). Read a narrower range "
            "(e.g. 'Sheet1!A1:F50') to see more."
        )
    return summary


def _error_message(response: httpx.Response) -> str:
    """Turn a Sheets API error into something the model can act on."""
    try:
        body = response.json()
        detail = (body.get("error") or {}).get("message") or body
    except Exception:
        detail = response.text[:300]

    if response.status_code == 401:
        return (
            "Google Sheets authorization expired — ask the founder to reconnect "
            "Google Sheets from the Plugins page."
        )
    if response.status_code == 403:
        return (
            "Google Sheets refused the request (the connection may be missing the "
            f"spreadsheets scope, or the file is not shared with the connected "
            f"account): {detail}"
        )
    if response.status_code == 404:
        return (
            "Google Sheets could not find that spreadsheet, tab or range — check the "
            f"link/id and the exact tab name: {detail}"
        )
    if response.status_code == 429:
        return f"You've hit Google's Sheets rate limit — try again shortly: {detail}"
    return f"Google Sheets API error {response.status_code}: {detail}"


def _spreadsheet_id(reference: str) -> str:
    """Accept a full Sheets URL or a bare id and return the id.

    Founders paste links, not ids, so both are supported everywhere.
    """
    text = (reference or "").strip()
    if not text:
        raise ValueError(
            "A spreadsheet id or URL is required (e.g. the link from the browser)."
        )

    match = _SPREADSHEET_URL_RE.search(text)
    if match:
        return match.group(1)

    # A bare id, optionally with a trailing `#gid=` / `?usp=` fragment.
    bare = re.split(r"[#?]", text, maxsplit=1)[0].strip()
    if _SPREADSHEET_ID_RE.match(bare):
        return bare

    raise ValueError(
        f"{reference!r} does not look like a Google Sheets id or URL. Ask the founder "
        "for the spreadsheet link."
    )


def _extract_gid(reference: str) -> str | None:
    """The `gid` of the tab in a Sheets URL (`…/edit#gid=1234`), if present."""
    match = _GID_RE.search(reference or "")
    return match.group(1) if match else None


def _spreadsheet_url(spreadsheet_id: str) -> str:
    return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit"


def _normalize_range(range_: str) -> str:
    """Make a model-supplied range A1-safe (quote tab names that need it)."""
    text = (range_ or "").strip()
    if not text:
        return ""
    if "!" not in text:
        # A bare `A1:D10` is a cell range on the first tab; anything else is a
        # tab name (`'Q3 Leads'`) that the API needs quoted when it has spaces.
        if _A1_ONLY_RE.match(text):
            return text
        return _quote_sheet_name(text)

    sheet, _, cells = text.partition("!")
    sheet = sheet.strip()
    if len(sheet) > 1 and sheet.startswith("'") and sheet.endswith("'"):
        return text
    if _PLAIN_SHEET_NAME_RE.match(sheet):
        return text
    return f"{_quote_sheet_name(sheet)}!{cells}"


def _quote_sheet_name(name: str) -> str:
    """`Q3 Leads` → `'Q3 Leads'` (single quotes inside are doubled, per A1)."""
    clean = (name or "").strip()
    if _PLAIN_SHEET_NAME_RE.match(clean):
        return clean
    return "'" + clean.replace("'", "''") + "'"


def _visible_sheets(data: dict[str, Any]) -> list[tuple[str, Any]]:
    """(title, sheetId) for every visible tab, in tab order."""
    sheets: list[tuple[str, Any]] = []
    for sheet in data.get("sheets") or []:
        properties = sheet.get("properties") or {}
        if properties.get("hidden"):
            continue
        title = properties.get("title")
        if title:
            sheets.append((str(title), properties.get("sheetId")))
    return sheets


def _option(value: str | None, allowed: set[str], default: str) -> str:
    """Case-insensitive enum coercion with a safe default."""
    candidate = str(value or "").strip().upper()
    return candidate if candidate in allowed else default


def _normalize_values(values: Any) -> list[list[Any]]:
    """Coerce what a model sends into `list[list]` of API-safe cell values.

    Accepts rows of cells (`[[...], [...]]`), a single row (`[...]`), a column
    passed as `[1, 2, 3]`, or a dict of `{header: value}` (→ header row +
    values) — all of which models produce in practice.
    """
    if isinstance(values, dict):
        if not values:
            raise ValueError("No values to write — the row is empty.")
        return [list(values.keys()), [values[key] for key in values]]

    if not isinstance(values, (list, tuple)):
        return [[_cell(value) for value in [values]]]

    rows: list[list[Any]] = []
    for row in values:
        if isinstance(row, dict):
            headers = list(row.keys())
            rows.append([_cell(header) for header in headers])
            rows.append([_cell(row[header]) for header in headers])
        elif isinstance(row, (list, tuple)):
            rows.append([_cell(cell) for cell in row])
        else:
            rows.append([_cell(row)])

    if not rows or all(not row for row in rows):
        raise ValueError("No values to write — pass at least one non-empty row.")
    return rows


def _cell(value: Any) -> Any:
    """Sheets only accepts scalars in a values range (no nested lists/dicts)."""
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def _check_write_size(rows: list[list[Any]]) -> None:
    total = sum(len(row) for row in rows)
    if total > _MAX_CELLS_WRITTEN:
        raise ValueError(
            f"That write has {total} cells (limit {_MAX_CELLS_WRITTEN}). Split it into "
            "smaller ranges."
        )
