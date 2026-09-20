"""Google Calendar tools registered on the connection ToolManager.

Built for the questions a founder actually asks: *what's on my calendar*, *find
me time with X*, *move my 3pm*, *put this on my calendar*.

Design notes that matter for the model's behaviour:

  * **Timezone discipline.** Every tool refuses a date/time that has no UTC
    offset unless a ``time_zone`` is supplied. Booking at the wrong hour because
    an agent assumed UTC is worse than an error message, so the descriptions
    tell the model to read the ``time_zone`` returned by ``list_events`` /
    ``get_event`` first and reuse it.
  * **`calendar_id` defaults to `primary`.** Listing the founder's *other*
    calendars needs a wider Google scope than the connector asks for, so
    `list_calendars` may report a missing scope — that is expected, not a bug,
    and `primary` still works for everything else.
  * **Free/busy is computed from the day's events** rather than the `freeBusy`
    endpoint, so it needs no extra scope. It only sees this calendar.
  * **Safety model.** Reads are always safe. Creating, changing and deleting
    events all mutate the founder's real schedule: the prompt rules require an
    explicit request plus a confirmation before any of them, and attendees are
    never emailed unless the founder asked for it (`notify_attendees`).
"""

from connections.tool_manager import ToolManager

CONNECTION = "google_calendar"

_CALENDAR_PARAM = {
    "type": "string",
    "description": (
        "Which calendar to use: 'primary' (default — the founder's main calendar) "
        "or a calendar id/email from google_calendar.list_calendars."
    ),
    "default": "primary",
}

_TIME_ZONE_PARAM = {
    "type": "string",
    "description": (
        "IANA timezone (e.g. 'Asia/Kolkata') used to interpret a date or a "
        "timestamp without an offset. Reuse the `time_zone` returned by "
        "google_calendar.list_events — never guess it."
    ),
    "default": "",
}


def register_calendar_tools(tools: ToolManager, client=None) -> None:
    """Add every Google Calendar tool to ``tools``.

    ``client`` is injectable for tests; it defaults to the real connection
    manager. ``company_id`` is server-injected so the model never passes it.
    """
    if client is None:
        from connections.google.calendar.calendar_connection_manager import (
            calendar_manager,
        )

        client = calendar_manager

    tools.add(
        f"{CONNECTION}.list_calendars",
        "List the calendars on the founder's calendar list (main calendar, shared "
        "team calendars, holidays) with each one's timezone. Use it when the founder "
        "mentions a calendar by name, before listing events. NOTE: this needs a wider "
        "Google permission than the connector normally holds — if it returns a "
        "'missing scope' error, keep using calendar_id='primary' instead of retrying.",
        func=client.list_calendars,
        context=["company_id"],
    )

    tools.add(
        f"{CONNECTION}.list_events",
        "Read the founder's calendar for a time window and get back the events "
        "(title, start/end, location, attendees, link). Use it for 'what's on my "
        "calendar', 'am I free Friday', 'did I meet X', checking for clashes before "
        "booking, and to find an event's id before changing it. Recurring events come "
        "back expanded as single occurrences with `singleEvents`. Leave `time_min` "
        "empty for 'now onwards'. Returns the calendar's `time_zone` — reuse it in "
        "later calls rather than guessing.",
        func=client.list_events,
        context=["company_id"],
        params={
            "calendar_id": _CALENDAR_PARAM,
            "time_min": {
                "type": "string",
                "description": (
                    "Start of the window: RFC3339 with offset "
                    "('2026-09-21T00:00:00+05:30') or a plain date ('2026-09-21', "
                    "which then needs time_zone). Empty = now."
                ),
                "default": "",
            },
            "time_max": {
                "type": "string",
                "description": "End of the window, same formats as `time_min`. Empty = no end.",
                "default": "",
            },
            "time_zone": _TIME_ZONE_PARAM,
            "query": {
                "type": "string",
                "description": "Free-text search inside the window (e.g. 'Acme', 'standup').",
                "default": "",
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum events to return (1-100, default 25).",
                "default": 25,
            },
            "include_cancelled": {
                "type": "boolean",
                "description": "Also return cancelled events (default false).",
                "default": False,
            },
        },
    )

    tools.add(
        f"{CONNECTION}.get_event",
        "Read one calendar event in full: description, attendees with their replies, "
        "conference link and recurrence. Needs an event_id from "
        "google_calendar.list_events — use it before editing or cancelling an event.",
        func=client.get_event,
        context=["company_id"],
        params={
            "event_id": {
                "type": "string",
                "description": "Event id returned by google_calendar.list_events.",
            },
            "calendar_id": _CALENDAR_PARAM,
        },
    )

    tools.add(
        f"{CONNECTION}.find_free_slots",
        "Work out when the founder is free on a given day: returns the open windows "
        "inside their working hours, based on that day's events. Use it for 'when can I "
        "fit in 90 minutes tomorrow' or before proposing a meeting time. Only looks at "
        "this one calendar, and an all-day event (leave, holiday) marks the whole day "
        "busy.",
        func=client.find_free_slots,
        context=["company_id"],
        params={
            "day": {
                "type": "string",
                "description": "The day to check: 'YYYY-MM-DD' (needs time_zone) or a full timestamp with offset.",
            },
            "calendar_id": _CALENDAR_PARAM,
            "duration_minutes": {
                "type": "integer",
                "description": "How long the meeting needing a slot is, in minutes (default 30).",
                "default": 30,
            },
            "work_start": {
                "type": "string",
                "description": "Start of the founder's working day, 'HH:MM' local (default 09:00).",
                "default": "09:00",
            },
            "work_end": {
                "type": "string",
                "description": "End of the founder's working day, 'HH:MM' local (default 18:00).",
                "default": "18:00",
            },
            "time_zone": _TIME_ZONE_PARAM,
        },
    )

    tools.add(
        f"{CONNECTION}.create_event",
        "Put a new event on the founder's calendar. Confirm the title, date, start/end "
        "time and timezone with the founder (ask_mcq_for_user) BEFORE calling it, then "
        "report back the created event's time and link. `end` is optional (defaults to "
        "start + duration_minutes). Times inside Google Calendar need a real timezone: "
        "pass an offset in the timestamp or a `time_zone`, never assume UTC. Attendees "
        "are only invited by email when `notify_attendees` is true — set it only when "
        "the founder asked to invite them.",
        func=client.create_event,
        context=["company_id"],
        params={
            "summary": {"type": "string", "description": "Event title, e.g. 'Investor call with Acme'."},
            "start": {
                "type": "string",
                "description": (
                    "Start: RFC3339 with offset ('2026-09-21T15:00:00+05:30'), a naive "
                    "datetime plus time_zone, or 'YYYY-MM-DD' for an all-day event."
                ),
            },
            "end": {
                "type": "string",
                "description": "End, same formats as `start`. Empty = start + duration_minutes.",
                "default": "",
            },
            "calendar_id": _CALENDAR_PARAM,
            "time_zone": _TIME_ZONE_PARAM,
            "duration_minutes": {
                "type": "integer",
                "description": "Length used when `end` is omitted (default 30).",
                "default": 30,
            },
            "all_day": {
                "type": "boolean",
                "description": "Create an all-day event (dates only, default false).",
                "default": False,
            },
            "description": {
                "type": "string",
                "description": "Optional agenda/notes for the event.",
                "default": "",
            },
            "location": {
                "type": "string",
                "description": "Optional location or address.",
                "default": "",
            },
            "attendees": {
                "type": "array",
                "description": "Optional guest email addresses, e.g. ['a@acme.com'].",
                "default": [],
            },
            "notify_attendees": {
                "type": "boolean",
                "description": "Email the attendees an invitation (default false).",
                "default": False,
            },
        },
    )

    tools.add(
        f"{CONNECTION}.quick_add_event",
        "Create an event from a plain sentence — Google parses the date/time itself "
        "(e.g. 'Lunch with Acme tomorrow 1pm', 'Board meeting Fri 10:00-11:00'). This is "
        "the fastest way to handle 'put this on my calendar'. Confirm the wording with "
        "the founder first, and confirm the parsed event (its returned start/end) "
        "afterwards so a wrong guess is caught immediately.",
        func=client.quick_add_event,
        context=["company_id"],
        params={
            "text": {
                "type": "string",
                "description": "The natural-language event, ideally including a date and time.",
            },
            "calendar_id": _CALENDAR_PARAM,
            "notify_attendees": {
                "type": "boolean",
                "description": "Email any guest in the parsed event (default false).",
                "default": False,
            },
        },
    )

    tools.add(
        f"{CONNECTION}.update_event",
        "Change an existing event — reschedule it, fix the title, add a location or "
        "guests. Only the fields you pass are changed; everything else stays as it was. "
        "Get the event_id from google_calendar.list_events and confirm the new details "
        "with the founder (ask_mcq_for_user) before calling it, especially for a "
        "reschedule that other people have accepted.",
        func=client.update_event,
        context=["company_id"],
        params={
            "event_id": {
                "type": "string",
                "description": "Event id to change (from google_calendar.list_events).",
            },
            "calendar_id": _CALENDAR_PARAM,
            "summary": {"type": "string", "description": "New title (empty = leave unchanged).", "default": ""},
            "start": {
                "type": "string",
                "description": "New start (empty = leave unchanged), same formats as create_event.",
                "default": "",
            },
            "end": {"type": "string", "description": "New end (empty = leave unchanged).", "default": ""},
            "time_zone": _TIME_ZONE_PARAM,
            "description": {"type": "string", "description": "New notes (empty = leave unchanged).", "default": ""},
            "location": {"type": "string", "description": "New location (empty = leave unchanged).", "default": ""},
            "attendees": {
                "type": "array",
                "description": (
                    "Replace the guest list with these emails (empty/omitted = leave the "
                    "guest list alone)."
                ),
                "default": [],
            },
            "notify_attendees": {
                "type": "boolean",
                "description": "Email guests about the change (default false).",
                "default": False,
            },
        },
    )

    tools.add(
        f"{CONNECTION}.delete_event",
        "DESTRUCTIVE: cancel an event on the founder's calendar. It disappears for "
        "everyone invited and this connector cannot restore it. Only call it when the "
        "founder explicitly asks to cancel that event (name it back to them and confirm "
        "with ask_mcq_for_user first) — never as part of tidying up or rescheduling.",
        func=client.delete_event,
        context=["company_id"],
        params={
            "event_id": {
                "type": "string",
                "description": "Event id to cancel (from google_calendar.list_events).",
            },
            "calendar_id": _CALENDAR_PARAM,
            "notify_attendees": {
                "type": "boolean",
                "description": "Email guests the cancellation (default false).",
                "default": False,
            },
        },
    )
