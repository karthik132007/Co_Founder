"""Gmail API client (agent side).

Thin, dependency-free wrapper over the Gmail REST API
(`https://gmail.googleapis.com/gmail/v1/users/me`) for the tools in
`gmail_tools.py`. Tokens come from the shared Google grant
(`Google_Connection_Manager.get_access_token`) — refreshed automatically — and
never leave the server.

Scope: the read paths (profile, search, message, thread, labels) plus
`drafts.create`. There is deliberately **no send tool**: the connector is
scoped for reading and drafting, so nothing can leave the founder's mailbox
without them opening Gmail themselves.

Reference: https://developers.google.com/workspace/gmail/api/reference/rest
"""

from __future__ import annotations

import asyncio
import base64
import logging
from email.message import EmailMessage
from typing import Any

import httpx

from connections.google.google_connection_manager import Google_Connection_Manager

logger = logging.getLogger(__name__)

GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

# Bodies are truncated before they ever reach a model prompt: a single HTML
# newsletter can be hundreds of KB (≈100k tokens) and would blow the context
# window. Agents get the beginning of the message, which is what they need.
_MAX_BODY_CHARS = 4000
_THREAD_BODY_CHARS = 2000
_MAX_SEARCH_RESULTS = 25
_MAX_ATTACHMENTS_LISTED = 10
_MAX_THREAD_MESSAGES = 10


class Gmail_Connection_Manager(Google_Connection_Manager):
    """Read the founder's mailbox and create drafts, on behalf of a company."""

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
        """Call the Gmail API with the company's (auto-refreshed) token."""
        try:
            token = await self.get_access_token(company_id)
        except RuntimeError as exc:
            # Surface the actionable part to the model: the founder has to
            # reconnect, there is nothing the agent can do about it.
            raise RuntimeError(
                f"Gmail is not connected for this company ({exc}). "
                "Ask the founder to connect Gmail from the Plugins page."
            ) from exc

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method,
                f"{GMAIL_API_BASE}{path}",
                params=params,
                json=json_body,
                headers={"Authorization": f"Bearer {token}"},
            )

        if response.status_code >= 400:
            raise RuntimeError(_error_message(response))

        if not response.content:
            return {}
        return response.json()

    # ------------------------------------------------------------------
    # read
    # ------------------------------------------------------------------

    async def get_profile(self, company_id: int) -> dict[str, Any]:
        """Mailbox profile: address, total messages/threads, history id."""
        return await self._request(company_id, "GET", "/profile")

    async def list_labels(self, company_id: int) -> dict[str, Any]:
        """Every label in the mailbox (system + user), for search filters."""
        data = await self._request(company_id, "GET", "/labels")
        labels = [
            {
                "id": label.get("id"),
                "name": label.get("name"),
                "type": label.get("type"),
            }
            for label in data.get("labels") or []
        ]
        return {"count": len(labels), "labels": labels}

    async def search_messages(
        self,
        company_id: int,
        query: str = "",
        max_results: int = 10,
        label_ids: list[str] | None = None,
        include_spam_trash: bool = False,
    ) -> dict[str, Any]:
        """Search the mailbox and return hydrated summaries.

        Uses Gmail's own search syntax in `query` (`from:`, `newer_than:7d`,
        `is:unread`, `has:attachment`, …), so the model never needs a custom
        query language. Each hit is hydrated with `format=metadata` (headers +
        snippet, no body) **concurrently**, because the list endpoint only
        returns ids.
        """
        try:
            limit = int(max_results)
        except (TypeError, ValueError):
            limit = 10
        limit = max(1, min(limit, _MAX_SEARCH_RESULTS))

        params: dict[str, Any] = {
            "maxResults": limit,
            "includeSpamTrash": "true" if include_spam_trash else "false",
        }
        if query:
            params["q"] = query
        if label_ids:
            params["labelIds"] = list(label_ids)

        data = await self._request(company_id, "GET", "/messages", params=params)
        refs = data.get("messages") or []
        if not refs:
            return {
                "count": 0,
                "result_size_estimate": data.get("resultSizeEstimate", 0),
                "results": [],
            }

        hydrated = await asyncio.gather(
            *(self._message_summary(company_id, ref["id"]) for ref in refs),
            return_exceptions=True,
        )

        results: list[dict[str, Any]] = []
        for ref, summary in zip(refs, hydrated):
            if isinstance(summary, BaseException):
                # One unreadable message must not fail the whole search.
                logger.warning(
                    "Gmail search: could not read message %s: %s", ref.get("id"), summary
                )
                results.append(
                    {
                        "id": ref.get("id"),
                        "thread_id": ref.get("threadId"),
                        "error": str(summary),
                    }
                )
            else:
                results.append(summary)

        return {
            "count": len(results),
            "result_size_estimate": data.get("resultSizeEstimate", 0),
            "results": results,
        }

    async def get_message(self, company_id: int, message_id: str) -> dict[str, Any]:
        """One full message: headers, decoded body (truncated), attachments."""
        data = await self._request(
            company_id, "GET", f"/messages/{message_id}", params={"format": "full"}
        )
        return _summarize_message(data, include_body=True, max_body_chars=_MAX_BODY_CHARS)

    async def get_thread(
        self, company_id: int, thread_id: str, max_messages: int = _MAX_THREAD_MESSAGES
    ) -> dict[str, Any]:
        """A conversation, oldest message first (bodies truncated per message)."""
        data = await self._request(
            company_id, "GET", f"/threads/{thread_id}", params={"format": "full"}
        )
        try:
            limit = int(max_messages)
        except (TypeError, ValueError):
            limit = _MAX_THREAD_MESSAGES
        limit = max(1, min(limit, _MAX_THREAD_MESSAGES))

        raw_messages = data.get("messages") or []
        messages = [
            _summarize_message(
                message, include_body=True, max_body_chars=_THREAD_BODY_CHARS
            )
            for message in raw_messages[:limit]
        ]
        return {
            "thread_id": data.get("id") or thread_id,
            "message_count": len(raw_messages),
            "returned_messages": len(messages),
            "messages": messages,
        }

    # ------------------------------------------------------------------
    # write (draft only — no send)
    # ------------------------------------------------------------------

    async def create_draft(
        self,
        company_id: int,
        to: str,
        subject: str,
        body: str,
        cc: str | None = None,
        in_reply_to_message_id: str | None = None,
    ) -> dict[str, Any]:
        """Create a draft in the mailbox. Nothing is sent.

        Passing `in_reply_to_message_id` makes it a proper reply: the thread,
        `In-Reply-To` and `References` headers are taken from the original
        message, so the draft appears inside the existing conversation.
        """
        message = EmailMessage()
        message["To"] = to
        if cc:
            message["Cc"] = cc
        message["Subject"] = subject

        thread_id: str | None = None
        if in_reply_to_message_id:
            original = await self._message_headers(company_id, in_reply_to_message_id)
            original_message_id = original.get("message-id")
            thread_id = original.get("thread_id")
            if original_message_id:
                message["In-Reply-To"] = original_message_id
                references = original.get("references")
                message["References"] = (
                    f"{references} {original_message_id}".strip()
                    if references
                    else original_message_id
                )

        message.set_content(body)
        encoded = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")

        payload: dict[str, Any] = {"message": {"raw": encoded}}
        if thread_id:
            payload["message"]["threadId"] = thread_id

        data = await self._request(company_id, "POST", "/drafts", json_body=payload)
        draft_message = data.get("message") or {}

        logger.info(
            "Created Gmail draft for company_id=%s (thread_id=%s, reply=%s)",
            company_id,
            thread_id,
            bool(in_reply_to_message_id),
        )
        return {
            "draft_id": data.get("id"),
            "message_id": draft_message.get("id"),
            "thread_id": draft_message.get("threadId") or thread_id,
            "to": to,
            "subject": subject,
            "status": "draft_created_not_sent",
        }

    # ------------------------------------------------------------------
    # internal helpers
    # ------------------------------------------------------------------

    async def _message_summary(self, company_id: int, message_id: str) -> dict[str, Any]:
        """Headers + snippet for one message (`format=metadata`, no body)."""
        data = await self._request(
            company_id, "GET", f"/messages/{message_id}", params={"format": "metadata"}
        )
        return _summarize_message(data, include_body=False)

    async def _message_headers(self, company_id: int, message_id: str) -> dict[str, Any]:
        """Raw header dict + thread id, for building replies."""
        data = await self._request(
            company_id, "GET", f"/messages/{message_id}", params={"format": "metadata"}
        )
        headers = _headers_to_dict(data.get("payload") or {})
        headers["thread_id"] = data.get("threadId")
        return headers


# ── parsing helpers ─────────────────────────────────────────────────────────


def _error_message(response: httpx.Response) -> str:
    """Turn a Gmail API error into something the model can act on."""
    try:
        body = response.json()
        detail = (body.get("error") or {}).get("message") or body
    except Exception:
        detail = response.text[:300]

    if response.status_code == 401:
        return (
            "Gmail authorization expired — ask the founder to reconnect Gmail "
            "from the Plugins page."
        )
    if response.status_code == 403:
        return (
            "Gmail refused the request (the connection may be missing the required "
            f"scope, or the quota is exhausted): {detail}"
        )
    if response.status_code == 404:
        return f"Gmail could not find that message or thread: {detail}"
    if response.status_code == 429:
        return f"Gmail rate limit reached — try again shortly: {detail}"
    return f"Gmail API error {response.status_code}: {detail}"


def _decode_b64url(data: str) -> str:
    """Decode Gmail's URL-safe base64 (padding often omitted)."""
    padded = data + "=" * (-len(data) % 4)
    try:
        return base64.urlsafe_b64decode(padded).decode("utf-8", errors="replace")
    except Exception:
        return ""


def _headers_to_dict(payload: dict[str, Any]) -> dict[str, str]:
    """`payload.headers` (a list of {name, value}) → lowercase-keyed dict."""
    headers: dict[str, str] = {}
    for header in payload.get("headers") or []:
        name = header.get("name")
        if name:
            headers[str(name).lower()] = header.get("value") or ""
    return headers


def _walk_parts(payload: dict[str, Any]):
    """Yield the payload and every nested part (MIME trees are recursive)."""
    yield payload
    for part in payload.get("parts") or []:
        yield from _walk_parts(part)


def _extract_body(payload: dict[str, Any], max_chars: int) -> tuple[str, bool]:
    """Best-effort body text from a MIME tree, truncated to `max_chars`.

    Prefers `text/plain`; falls back to the raw `text/html` only when the
    message has no plain-text alternative (no HTML sanitising happens here —
    that is the model's problem, not the mailbox's).
    """
    plain: list[str] = []
    html: list[str] = []

    for part in _walk_parts(payload):
        mime_type = part.get("mimeType")
        if mime_type not in ("text/plain", "text/html"):
            continue
        data = (part.get("body") or {}).get("data")
        if not data:
            continue
        decoded = _decode_b64url(data)
        (plain if mime_type == "text/plain" else html).append(decoded)

    text = "\n\n".join(plain).strip() or "\n\n".join(html).strip()
    if len(text) > max_chars:
        return text[:max_chars], True
    return text, False


def _collect_attachments(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Attachment metadata (no bytes — attachments can be huge)."""
    attachments: list[dict[str, Any]] = []
    for part in _walk_parts(payload):
        filename = part.get("filename")
        if not filename:
            continue
        body = part.get("body") or {}
        attachments.append(
            {
                "filename": filename,
                "mime_type": part.get("mimeType"),
                "size_bytes": body.get("size"),
            }
        )
        if len(attachments) >= _MAX_ATTACHMENTS_LISTED:
            break
    return attachments


def _summarize_message(
    message: dict[str, Any],
    *,
    include_body: bool,
    max_body_chars: int = _MAX_BODY_CHARS,
) -> dict[str, Any]:
    """Compact, model-friendly view of a Gmail message resource."""
    payload = message.get("payload") or {}
    headers = _headers_to_dict(payload)

    summary: dict[str, Any] = {
        "id": message.get("id"),
        "thread_id": message.get("threadId"),
        "from": headers.get("from"),
        "to": headers.get("to"),
        "cc": headers.get("cc"),
        "subject": headers.get("subject"),
        "date": headers.get("date"),
        "labels": message.get("labelIds") or [],
        "snippet": message.get("snippet"),
        "attachments": _collect_attachments(payload),
    }

    if include_body:
        body, truncated = _extract_body(payload, max_body_chars)
        summary["body"] = body
        if truncated:
            summary["body_truncated"] = True

    return summary


gmail_manager = Gmail_Connection_Manager()
