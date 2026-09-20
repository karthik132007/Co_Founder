"""Google Calendar API client (agent side).

Thin, dependency-free wrapper over the Calendar REST API
(`https://www.googleapis.com/calendar/v3`) for the tools in
`calendar_tools.py`. Tokens come from the shared Google grant
(`Google_Connection_Manager.get_access_token`) — refreshed automatically — and
never leave the server.

Scope note: the connector asks for `.../auth/calendar.events` (read + write
events), which is the narrowest scope that supports the whole tool set.
`calendarList` is a *different* resource with a *different* scope
(`calendar.readonly` / `calendar`), so `list_calendars` is best-effort: with a
narrow grant it raises a message naming the scope instead of a bare 403, and the
agent falls back to `calendar_id="primary"`.

Free/busy is computed from `events.list` rather than the `freeBusy` endpoint for
the same reason — `freeBusy` needs the wider read scope, while listing events
works with `calendar.events`.

Timezones: Calendar returns the calendar's own `timeZone` in every list/get
response, which the tools pass through so the model can reuse it. A value
without an UTC offset is rejected unless a `time_zone` is supplied — silently
assuming UTC is how agents book meetings at the wrong hour.

Reference: https://developers.google.com/workspace/calendar/api/v3/reference
"""

from __future__ import annotations

import logging
import urllib.parse
from datetime import date, datetime, time, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx

from connections.google.google_connection_manager import (
    Google_Connection_Manager,
    connector_is_connected,
)

logger = logging.getLogger(__name__)

CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"

CONNECTION_ID = "google_calendar"
# Kept in sync with google_connection_manager.CONNECTOR_SCOPES["google_calendar"].
CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"
# Only needed for `calendarList` (and the `freeBusy` endpoint). Used to explain a
# 403 instead of leaving the model guessing.
CALENDAR_READ_SCOPES = (
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar",
)

DEFAULT_CALENDAR = "primary"

_MAX_EVENTS_RETURNED = 100
_MAX_ATTENDEES_LISTED = 20
_MAX_DESCRIPTION_CHARS = 800
_MAX_EVENT_PAGES = 2  # one page of 250 is plenty; two covers a busy week

_WEEKDAYS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")


class Calendar_Connection_Manager(Google_Connection_Manager):
    """Read and write the founder's calendar, on behalf of a company."""

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
        """Call the Calendar API with the company's (auto-refreshed) token."""
        token = await self._access_token(company_id)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method,
                f"{CALENDAR_API_BASE}{path}",
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
        """The grant's access token, guarded by a Calendar-specific scope check.

        Google connectors share one grant, so a company that connected only
        Gmail has *a* Google connection but not the Calendar scope. Failing here
        with an actionable message beats a bare 403 from Google.
        """
        row = self.get_connection(company_id)
        if not row:
            raise RuntimeError(
                "Google Calendar is not connected for this company. Ask the founder "
                "to connect Google Calendar from the Plugins page."
            )
        if not connector_is_connected(row.get("scopes"), CONNECTION_ID):
            raise RuntimeError(
                "Google Calendar access has not been granted yet (the company's "
                "Google grant does not include the calendar scope). Ask the founder "
                "to connect Google Calendar from the Plugins page."
            )

        try:
            return await self.get_access_token(company_id)
        except RuntimeError as exc:
            raise RuntimeError(
                f"Google Calendar is not usable right now ({exc}). Ask the founder "
                "to reconnect Google Calendar from the Plugins page."
            ) from exc

    # ------------------------------------------------------------------
    # read
    # ------------------------------------------------------------------

    async def list_calendars(self, company_id: int) -> dict[str, Any]:
        """Every calendar on the founder's calendar list (needs the read scope)."""
        data = await self._request(
            company_id,
            "GET",
            "/users/me/calendarList",
            params={"minAccessRole": "reader", "maxResults": 100},
        )
        calendars = [
            {
                "calendar_id": item.get("id"),
                "summary": item.get("summary"),
                "description": item.get("description"),
                "time_zone": item.get("timeZone"),
                "primary": bool(item.get("primary")),
                "access_role": item.get("accessRole"),
            }
            for item in (data.get("items") or [])
        ]
        return {"count": len(calendars), "calendars": calendars}

    async def list_events(
        self,
        company_id: int,
        calendar_id: str = DEFAULT_CALENDAR,
        time_min: str = "",
        time_max: str = "",
        time_zone: str = "",
        query: str = "",
        max_results: int = 25,
        include_cancelled: bool = False,
    ) -> dict[str, Any]:
        """Events in a window, recurring events expanded to single instances.

        `time_min` / `time_max` accept an RFC3339 timestamp with an offset, a
        plain date (`2026-09-21` = that day in `time_zone`) or a naive datetime
        (which then *requires* `time_zone`). Omitting them asks Google for
        "now onwards", interpreted in the calendar's own timezone.
        """
        calendar = _calendar_id(calendar_id)
        try:
            limit = int(max_results)
        except (TypeError, ValueError):
            limit = 25
        limit = max(1, min(limit, _MAX_EVENTS_RETURNED))

        params: dict[str, Any] = {
            "singleEvents": "true",  # expand recurrence: the model wants instances
            "orderBy": "startTime",
            "maxResults": limit,
            "showDeleted": "true" if include_cancelled else "false",
        }
        window_start = _to_rfc3339(time_min, time_zone, field="time_min") if time_min else None
        window_end = _to_rfc3339(time_max, time_zone, field="time_max") if time_max else None
        if window_start:
            params["timeMin"] = window_start
        if window_end:
            params["timeMax"] = window_end
        if time_zone:
            params["timeZone"] = time_zone
        if query:
            params["q"] = query

        data = await self._request(
            company_id, "GET", f"/calendars/{calendar}/events", params=params
        )
        events = [
            _summarize_event(event)
            for event in (data.get("items") or [])
            if include_cancelled or event.get("status") != "cancelled"
        ]

        return {
            # The id the caller must pass back — the API's `summary` is the display
            # name, not an id, and handing that to the model as `calendar_id` would
            # send it straight into a 404 on the next call.
            "calendar_id": (calendar_id or DEFAULT_CALENDAR),
            "calendar_name": data.get("summary"),
            "time_zone": data.get("timeZone"),
            "window_start": window_start,
            "window_end": window_end,
            "count": len(events),
            "truncated": bool(data.get("nextPageToken")),
            "events": events,
            "note": (
                "Times are RFC3339 with the calendar's offset. Pass the same "
                f"`time_zone` ({data.get('timeZone') or 'unknown'}) on later calls."
            ),
        }

    async def get_event(
        self, company_id: int, event_id: str, calendar_id: str = DEFAULT_CALENDAR
    ) -> dict[str, Any]:
        """One event in full (description, attendees, conference link, …)."""
        calendar = _calendar_id(calendar_id)
        data = await self._request(
            company_id,
            "GET",
            f"/calendars/{calendar}/events/{_path_id(event_id)}",
            params={"singleEvents": "true", "maxAttendees": _MAX_ATTENDEES_LISTED},
        )
        summary = _summarize_event(data, include_description=True)
        summary["time_zone"] = (data.get("start") or {}).get("timeZone")
        summary["organizer"] = (data.get("organizer") or {}).get("email")
        summary["conference_link"] = (data.get("hangoutLink") or None)
        summary["recurrence"] = data.get("recurrence")
        return summary

    async def find_free_slots(
        self,
        company_id: int,
        day: str,
        calendar_id: str = DEFAULT_CALENDAR,
        duration_minutes: int = 30,
        work_start: str = "09:00",
        work_end: str = "18:00",
        time_zone: str = "",
    ) -> dict[str, Any]:
        """Free windows inside working hours, computed from the day's events.

        Deliberately not the `freeBusy` endpoint: that needs the wider
        `calendar.readonly` scope, while `events.list` (which this uses) works
        with `calendar.events`. Events marked "free" (`transparent`) are ignored,
        all-day events block the whole day, and anything outside
        `work_start`-`work_end` is not offered as a slot.
        """
        zone = _resolve_zone(time_zone) if time_zone else None
        day_start = _to_rfc3339(day, time_zone, field="day")
        if not day_start:
            raise ValueError("find_free_slots needs `day` (e.g. '2026-09-21').")

        start = _parse_rfc3339(day_start)
        zone = zone or start.tzinfo or timezone.utc
        window_start = datetime.combine(start.date(), _clock(work_start, "work_start"), tzinfo=zone)
        window_end = datetime.combine(start.date(), _clock(work_end, "work_end"), tzinfo=zone)
        if window_end <= window_start:
            raise ValueError("work_end must be later than work_start on the same day.")

        try:
            minutes = max(5, int(duration_minutes))
        except (TypeError, ValueError):
            minutes = 30

        listing = await self.list_events(
            company_id,
            calendar_id=calendar_id,
            time_min=_iso(window_start),
            time_max=_iso(window_end),
            time_zone=str(zone),
            max_results=_MAX_EVENTS_RETURNED,
            include_cancelled=False,
        )

        busy = _busy_intervals(listing["events"], window_start, window_end)
        free = _free_slots(window_start, window_end, busy, minutes)

        return {
            "calendar_id": listing["calendar_id"],
            "calendar_name": listing.get("calendar_name"),
            "day": start.date().isoformat(),
            "time_zone": str(zone),
            "working_hours": f"{work_start}-{work_end}",
            "duration_minutes": minutes,
            "busy_count": len(busy),
            "free_slots": [
                {
                    "start": _iso(slot_start),
                    "end": _iso(slot_end),
                    "day": slot_start.strftime("%a"),
                    "label": f"{slot_start.strftime('%H:%M')}-{slot_end.strftime('%H:%M')}",
                }
                for slot_start, slot_end in free
            ],
            "based_on": [event.get("summary") for event in listing["events"]],
            "note": (
                "Computed from this calendar's events only (free/busy across other "
                "people's calendars needs the wider Calendar read scope)."
            ),
        }

    # ------------------------------------------------------------------
    # write
    # ------------------------------------------------------------------

    async def create_event(
        self,
        company_id: int,
        summary: str,
        start: str,
        end: str = "",
        calendar_id: str = DEFAULT_CALENDAR,
        time_zone: str = "",
        duration_minutes: int = 30,
        all_day: bool = False,
        description: str = "",
        location: str = "",
        attendees: list[str] | None = None,
        notify_attendees: bool = False,
    ) -> dict[str, Any]:
        """Create one event. `end` defaults to `start` + `duration_minutes`."""
        title = (summary or "").strip()
        if not title:
            raise ValueError("create_event needs a `summary` (the event title).")

        body: dict[str, Any] = {"summary": title}
        start_value = _event_time(start, time_zone, all_day=all_day, field="start")
        end_value = (
            _event_time(end, time_zone, all_day=all_day, field="end")
            if end
            else _derive_end(start_value, all_day=all_day, duration_minutes=duration_minutes)
        )
        body["start"] = start_value
        body["end"] = end_value
        if description:
            body["description"] = description
        if location:
            body["location"] = location
        if attendees:
            body["attendees"] = [{"email": str(email).strip()} for email in attendees if str(email).strip()]

        data = await self._request(
            company_id,
            "POST",
            f"/calendars/{_calendar_id(calendar_id)}/events",
            params={"sendUpdates": "all" if notify_attendees else "none"},
            json_body=body,
        )
        logger.info(
            "Calendar event created — company_id=%s, calendar=%s, start=%s, attendees=%s",
            company_id, calendar_id, body["start"], len(body.get("attendees") or []),
        )
        created = _summarize_event(data, include_description=True)
        created["status_result"] = "created"
        created["attendees_notified"] = bool(notify_attendees)
        return created

    async def quick_add_event(
        self,
        company_id: int,
        text: str,
        calendar_id: str = DEFAULT_CALENDAR,
        notify_attendees: bool = False,
    ) -> dict[str, Any]:
        """Create an event from a sentence ("Lunch with Acme Friday 1pm").

        Google parses the text itself, so this is the fastest path for the
        common "put this on my calendar" request. Vague text produces a vague
        event — confirm the parsed result with the founder.
        """
        clean = (text or "").strip()
        if not clean:
            raise ValueError("quick_add_event needs `text` to parse.")

        data = await self._request(
            company_id,
            "POST",
            f"/calendars/{_calendar_id(calendar_id)}/events/quickAdd",
            params={"text": clean, "sendUpdates": "all" if notify_attendees else "none"},
        )
        logger.info(
            "Calendar quickAdd — company_id=%s, calendar=%s, text=%r",
            company_id, calendar_id, clean[:80],
        )
        created = _summarize_event(data, include_description=True)
        created["status_result"] = "created"
        created["parsed_from"] = clean
        return created

    async def update_event(
        self,
        company_id: int,
        event_id: str,
        calendar_id: str = DEFAULT_CALENDAR,
        summary: str = "",
        start: str = "",
        end: str = "",
        time_zone: str = "",
        description: str = "",
        location: str = "",
        attendees: list[str] | None = None,
        notify_attendees: bool = False,
    ) -> dict[str, Any]:
        """Change only the fields you pass (PATCH semantics — the rest stays)."""
        body: dict[str, Any] = {}
        if summary:
            body["summary"] = summary
        if start:
            body["start"] = _event_time(start, time_zone, all_day=_is_date_only(start), field="start")
        if end:
            body["end"] = _event_time(end, time_zone, all_day=_is_date_only(end), field="end")
        if description:
            body["description"] = description
        if location:
            body["location"] = location
        if attendees is not None and attendees:
            body["attendees"] = [{"email": str(email).strip()} for email in attendees if str(email).strip()]

        if not body:
            raise ValueError(
                "update_event needs at least one field to change (summary, start, "
                "end, description, location or attendees)."
            )

        data = await self._request(
            company_id,
            "PATCH",
            f"/calendars/{_calendar_id(calendar_id)}/events/{_path_id(event_id)}",
            params={"sendUpdates": "all" if notify_attendees else "none"},
            json_body=body,
        )
        logger.info(
            "Calendar event updated — company_id=%s, calendar=%s, fields=%s",
            company_id, calendar_id, sorted(body.keys()),
        )
        updated = _summarize_event(data, include_description=True)
        updated["status_result"] = "updated"
        updated["fields_changed"] = sorted(body.keys())
        return updated

    async def delete_event(
        self,
        company_id: int,
        event_id: str,
        calendar_id: str = DEFAULT_CALENDAR,
        notify_attendees: bool = False,
    ) -> dict[str, Any]:
        """Cancel an event. Destructive: the prompt rules require confirmation."""
        await self._request(
            company_id,
            "DELETE",
            f"/calendars/{_calendar_id(calendar_id)}/events/{_path_id(event_id)}",
            params={"sendUpdates": "all" if notify_attendees else "none"},
        )
        logger.info(
            "Calendar event deleted — company_id=%s, calendar=%s, event=%s",
            company_id, calendar_id, event_id,
        )
        return {
            "event_id": event_id,
            "calendar_id": calendar_id,
            "status": "deleted",
            "attendees_notified": bool(notify_attendees),
            "note": "Cancellation is permanent — the event cannot be restored by this tool.",
        }


calendar_manager = Calendar_Connection_Manager()


# ── parsing / formatting helpers ─────────────────────────────────────────────


def _error_message(response: httpx.Response) -> str:
    """Turn a Calendar API error into something the model can act on."""
    try:
        body = response.json()
        detail = (body.get("error") or {}).get("message") or body
    except Exception:
        detail = response.text[:300]

    if response.status_code == 401:
        return (
            "Google Calendar authorization expired — ask the founder to reconnect "
            "Google Calendar from the Plugins page."
        )
    if response.status_code == 403:
        return (
            "Google Calendar refused the request (the connection may be missing a "
            f"required scope, or the calendar is not accessible to this account): {detail}"
        )
    if response.status_code == 404:
        return (
            "Google Calendar could not find that calendar or event (it may have been "
            f"deleted, or the id is wrong): {detail}"
        )
    if response.status_code == 410:
        return "That event was already deleted from the calendar."
    if response.status_code == 429:
        return f"You've hit Google's Calendar rate limit — try again shortly: {detail}"
    return f"Google Calendar API error {response.status_code}: {detail}"


def _calendar_id(value: str | None) -> str:
    """URL-safe calendar id (`primary`, an email, or `…@group.calendar.google.com`)."""
    calendar = (value or DEFAULT_CALENDAR).strip() or DEFAULT_CALENDAR
    # `#` in group-calendar ids would otherwise be read as a URL fragment.
    return urllib.parse.quote(calendar, safe="")


def _path_id(value: str) -> str:
    event_id = (value or "").strip()
    if not event_id:
        raise ValueError("An event_id is required (get it from list_events).")
    return urllib.parse.quote(event_id, safe="")


def _resolve_zone(name: str) -> ZoneInfo:
    try:
        return ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ValueError(
            f"Unknown time_zone {name!r}. Pass an IANA zone like 'Asia/Kolkata' or an "
            "offset in the timestamp ('2026-09-21T15:00+05:30')."
        ) from exc


def _clock(value: str, field: str) -> time:
    """`'09:00'` / `'09:00:00'` → `time`."""
    try:
        return time.fromisoformat(str(value).strip())
    except ValueError as exc:
        raise ValueError(f"{field} must look like '09:00' (got {value!r}).") from exc


def _is_date_only(value: str) -> bool:
    return bool(value) and "T" not in value and " " not in value.strip()


def _to_rfc3339(value: str, time_zone: str, *, field: str) -> str:
    """Timestamp or date → RFC3339, refusing to guess a timezone.

    A plain date expands to midnight **in `time_zone`**, which is only knowable
    when one is supplied — assuming UTC (or the server's zone) is how an agent
    silently books the wrong hour.
    """
    text = (value or "").strip()
    if not text:
        return ""

    if _is_date_only(text):
        if not time_zone:
            raise ValueError(
                f"{field}={text!r} is a date, so I need `time_zone` to know which "
                "midnight you mean (e.g. 'Asia/Kolkata', or pass "
                f"'{text}T00:00:00+05:30')."
            )
        zone = _resolve_zone(time_zone)
        parsed = datetime.combine(date.fromisoformat(text), time(0, 0), tzinfo=zone)
        return _iso(parsed)

    parsed = _parse_rfc3339(text)
    if parsed.tzinfo is None:
        if not time_zone:
            raise ValueError(
                f"{field}={text!r} has no UTC offset. Either pass an offset "
                f"('{text}+05:30') or a `time_zone` like 'Asia/Kolkata'."
            )
        parsed = parsed.replace(tzinfo=_resolve_zone(time_zone))
    return _iso(parsed)


def _parse_rfc3339(value: str) -> datetime:
    text = str(value).strip()
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(
            f"{value!r} is not a valid date/time. Use RFC3339 "
            "('2026-09-21T15:00:00+05:30') or a date ('2026-09-21')."
        ) from exc


def _iso(moment: datetime) -> str:
    return moment.isoformat(timespec="seconds")


def _event_time(value: str, time_zone: str, *, all_day: bool, field: str) -> dict[str, str]:
    """Build the Calendar `start` / `end` object, date-based for all-day events."""
    text = (value or "").strip()
    if not text:
        raise ValueError(f"{field} is required.")

    if all_day or _is_date_only(text):
        day = date.fromisoformat(text if _is_date_only(text) else text[:10])
        return {"date": day.isoformat()}

    return {"dateTime": _to_rfc3339(text, time_zone, field=field)}


def _derive_end(start_value: dict[str, str], *, all_day: bool, duration_minutes: int) -> dict[str, str]:
    """`end` defaults to `start` + duration (one day for all-day events)."""
    if "date" in start_value:
        return {"date": (date.fromisoformat(start_value["date"]) + timedelta(days=1)).isoformat()}

    try:
        minutes = max(5, int(duration_minutes))
    except (TypeError, ValueError):
        minutes = 30
    start = _parse_rfc3339(start_value["dateTime"])
    return {"dateTime": _iso(start + timedelta(minutes=minutes))}


def _summarize_event(event: dict[str, Any], *, include_description: bool = False) -> dict[str, Any]:
    """Compact, model-friendly view of a Calendar event resource."""
    start = event.get("start") or {}
    end = event.get("end") or {}
    attendees = event.get("attendees") or []

    summary: dict[str, Any] = {
        "event_id": event.get("id"),
        "summary": event.get("summary") or "(no title)",
        "start": start.get("dateTime") or start.get("date"),
        "end": end.get("dateTime") or end.get("date"),
        "all_day": "date" in start and "dateTime" not in start,
        "time_zone": start.get("timeZone") or end.get("timeZone"),
        "location": event.get("location"),
        "status": event.get("status"),
        "html_link": event.get("htmlLink"),
        "attendee_count": len(attendees),
        "attendees": [
            {
                "email": person.get("email"),
                "name": person.get("displayName"),
                "response": person.get("responseStatus"),
            }
            for person in attendees[:_MAX_ATTENDEES_LISTED]
        ],
        "recurring_event_id": event.get("recurringEventId"),
    }
    if include_description and event.get("description"):
        text = str(event["description"])
        summary["description"] = (
            text[:_MAX_DESCRIPTION_CHARS] + "…"
            if len(text) > _MAX_DESCRIPTION_CHARS
            else text
        )
    return {key: value for key, value in summary.items() if value not in (None, [], "")}


def _busy_intervals(
    events: list[dict[str, Any]], window_start: datetime, window_end: datetime
) -> list[tuple[datetime, datetime]]:
    """Merge the events that actually occupy time inside the window.

    `transparent` ("free") events and cancellations are ignored; an all-day
    event blocks the whole day, which is the honest reading of a holiday or
    leave entry.
    """
    intervals: list[tuple[datetime, datetime]] = []
    for event in events:
        if event.get("status") in ("cancelled", "free"):
            continue

        start_raw = event.get("start")
        end_raw = event.get("end") or start_raw
        if not start_raw:
            continue

        if event.get("all_day"):
            start = window_start
            end = window_end
        else:
            start = max(_parse_rfc3339(start_raw), window_start)
            end = min(_parse_rfc3339(end_raw or start_raw), window_end)

        if end > start:
            intervals.append((start, end))

    intervals.sort()
    merged: list[tuple[datetime, datetime]] = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged


def _free_slots(
    window_start: datetime,
    window_end: datetime,
    busy: list[tuple[datetime, datetime]],
    duration_minutes: int,
) -> list[tuple[datetime, datetime]]:
    """Gaps between busy blocks that are long enough to matter."""
    slots: list[tuple[datetime, datetime]] = []
    cursor = window_start
    for start, end in busy:
        if start - cursor >= timedelta(minutes=duration_minutes):
            slots.append((cursor, start))
        cursor = max(cursor, end)
    if window_end - cursor >= timedelta(minutes=duration_minutes):
        slots.append((cursor, window_end))
    return slots
