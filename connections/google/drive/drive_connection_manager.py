"""Google Drive API client for the agent connector.

Uses the shared Google OAuth grant and the Drive REST API. The connector asks
for the full Drive scope so agents can search and read the founder's existing
files, not only files created by this app. Returned file content is bounded
before it reaches a model prompt.
"""

from __future__ import annotations

import base64
import io
import logging
import mimetypes
import urllib.parse
from typing import Any

import httpx

from connections.google.google_connection_manager import (
    Google_Connection_Manager,
    connector_is_connected,
)

logger = logging.getLogger(__name__)

DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
CONNECTION_ID = "google_drive"
DRIVE_SCOPE = "https://www.googleapis.com/auth/drive"

_MAX_FILES = 100
_MAX_CONTENT_CHARS = 20_000
_MAX_UPLOAD_BYTES = 10 * 1024 * 1024

_TEXT_MIME_TYPES = {
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/json",
    "application/xml",
}
_EXPORT_MIME_TYPES = {
    "application/vnd.google-apps.document": "text/plain",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
}


class Drive_Connection_Manager(Google_Connection_Manager):
    """Search and manage the founder's Google Drive files."""

    async def _access_token(self, company_id: int) -> str:
        row = self.get_connection(company_id)
        if not row:
            raise RuntimeError(
                "Google Drive is not connected for this company. Ask the founder "
                "to connect Google Drive from the Plugins page."
            )
        if not connector_is_connected(row.get("scopes"), CONNECTION_ID):
            raise RuntimeError(
                "Google Drive access has not been granted yet. Ask the founder "
                "to connect Google Drive from the Plugins page."
            )
        try:
            return await self.get_access_token(company_id)
        except RuntimeError as exc:
            raise RuntimeError(
                f"Google Drive is not usable right now ({exc}). Ask the founder "
                "to reconnect Google Drive from the Plugins page."
            ) from exc

    async def _request(
        self,
        company_id: int,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
        content: bytes | None = None,
        headers: dict[str, str] | None = None,
    ) -> httpx.Response:
        token = await self._access_token(company_id)
        request_headers = {"Authorization": f"Bearer {token}"}
        request_headers.update(headers or {})
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.request(
                method,
                f"https://www.googleapis.com{path}",
                params=params,
                json=json_body,
                content=content,
                headers=request_headers,
            )
        if response.status_code >= 400:
            raise RuntimeError(_error_message(response))
        return response

    async def search_files(
        self,
        company_id: int,
        query: str = "",
        mime_type: str = "",
        folder_id: str = "",
        max_results: int = 25,
        include_trashed: bool = False,
    ) -> dict[str, Any]:
        """Search Drive by name/full-text, optionally within a folder."""
        try:
            limit = max(1, min(int(max_results), _MAX_FILES))
        except (TypeError, ValueError):
            limit = 25

        clauses = ["trashed = true" if include_trashed else "trashed = false"]
        if query.strip():
            escaped = query.replace("'", "\\'")
            clauses.append(f"(name contains '{escaped}' or fullText contains '{escaped}')")
        if mime_type.strip():
            clauses.append(f"mimeType = '{mime_type.strip()}'")
        if folder_id.strip():
            escaped_folder = folder_id.strip().replace("'", "\\'")
            clauses.append(f"'{escaped_folder}' in parents")

        response = await self._request(
            company_id,
            "GET",
            "/drive/v3/files",
            params={
                "q": " and ".join(clauses),
                "pageSize": limit,
                "orderBy": "modifiedTime desc",
                "fields": "nextPageToken,files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,parents,description,trashed)",
                "spaces": "drive",
            },
        )
        data = response.json()
        files = [_summarize_file(item) for item in data.get("files") or []]
        return {
            "count": len(files),
            "truncated": bool(data.get("nextPageToken")),
            "files": files,
        }

    async def get_file(self, company_id: int, file_id: str) -> dict[str, Any]:
        """Get metadata for one Drive file."""
        response = await self._request(
            company_id,
            "GET",
            f"/drive/v3/files/{_path_id(file_id)}",
            params={
                "fields": "id,name,mimeType,size,modifiedTime,createdTime,webViewLink,parents,description,trashed,capabilities"
            },
        )
        return _summarize_file(response.json())

    async def read_file(self, company_id: int, file_id: str) -> dict[str, Any]:
        """Read text or export a Google Workspace file as bounded text."""
        metadata = await self.get_file(company_id, file_id)
        mime_type = metadata.get("mime_type") or ""
        export_type = _EXPORT_MIME_TYPES.get(mime_type)
        if export_type:
            response = await self._request(
                company_id,
                "GET",
                f"/drive/v3/files/{_path_id(file_id)}/export",
                params={"mimeType": export_type},
            )
        elif mime_type in _TEXT_MIME_TYPES:
            response = await self._request(
                company_id,
                "GET",
                f"/drive/v3/files/{_path_id(file_id)}",
                params={"alt": "media"},
            )
        else:
            return {
                "file": metadata,
                "readable": False,
                "note": "This binary file cannot be returned as text. Use download_file for its bytes.",
            }

        text = response.content.decode("utf-8", errors="replace")
        truncated = len(text) > _MAX_CONTENT_CHARS
        return {
            "file": metadata,
            "readable": True,
            "mime_type": export_type or mime_type,
            "truncated": truncated,
            "content": text[:_MAX_CONTENT_CHARS],
        }

    async def download_file(self, company_id: int, file_id: str) -> dict[str, Any]:
        """Download a binary file as base64, bounded to 10 MB."""
        metadata = await self.get_file(company_id, file_id)
        mime_type = metadata.get("mime_type") or "application/octet-stream"
        export_type = _EXPORT_MIME_TYPES.get(mime_type)
        path = f"/drive/v3/files/{_path_id(file_id)}/export" if export_type else f"/drive/v3/files/{_path_id(file_id)}"
        params = {"mimeType": export_type} if export_type else {"alt": "media"}
        response = await self._request(company_id, "GET", path, params=params)
        if len(response.content) > _MAX_UPLOAD_BYTES:
            raise ValueError("That file is larger than the 10 MB agent download limit.")
        return {
            "file": metadata,
            "mime_type": export_type or mime_type,
            "size_bytes": len(response.content),
            "base64": base64.b64encode(response.content).decode("ascii"),
        }

    async def upload_file(
        self,
        company_id: int,
        name: str,
        content_base64: str,
        mime_type: str = "application/octet-stream",
        folder_id: str = "",
        description: str = "",
    ) -> dict[str, Any]:
        """Upload a base64 file to Drive (confirmation required by tool policy)."""
        clean_name = (name or "").strip()
        if not clean_name:
            raise ValueError("upload_file needs a file `name`.")
        try:
            raw = base64.b64decode(content_base64, validate=True)
        except Exception as exc:
            raise ValueError("content_base64 is not valid base64.") from exc
        if len(raw) > _MAX_UPLOAD_BYTES:
            raise ValueError("Uploads are limited to 10 MB.")

        metadata: dict[str, Any] = {"name": clean_name}
        if folder_id.strip():
            metadata["parents"] = [folder_id.strip()]
        if description:
            metadata["description"] = description[:1000]

        boundary = "cofounder-drive-boundary"
        multipart = (
            f"--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"
            f"{_json(metadata)}\r\n"
            f"--{boundary}\r\nContent-Type: {mime_type}\r\n\r\n"
        ).encode() + raw + f"\r\n--{boundary}--\r\n".encode()
        response = await self._request(
            company_id,
            "POST",
            "/upload/drive/v3/files",
            params={"uploadType": "multipart", "fields": "id,name,mimeType,size,webViewLink,parents,modifiedTime"},
            content=multipart,
            headers={"Content-Type": f"multipart/related; boundary={boundary}"},
        )
        return {"file": _summarize_file(response.json()), "status": "uploaded"}

    async def create_folder(
        self, company_id: int, name: str, parent_folder_id: str = ""
    ) -> dict[str, Any]:
        """Create a Drive folder (confirmation required by tool policy)."""
        clean_name = (name or "").strip()
        if not clean_name:
            raise ValueError("create_folder needs a folder `name`.")
        body: dict[str, Any] = {"name": clean_name, "mimeType": "application/vnd.google-apps.folder"}
        if parent_folder_id.strip():
            body["parents"] = [parent_folder_id.strip()]
        response = await self._request(
            company_id,
            "POST",
            "/drive/v3/files",
            params={"fields": "id,name,mimeType,parents,webViewLink,createdTime"},
            json_body=body,
        )
        return {"file": _summarize_file(response.json()), "status": "folder_created"}


def _json(value: dict[str, Any]) -> str:
    import json

    return json.dumps(value, separators=(",", ":"))


def _path_id(value: str) -> str:
    clean = (value or "").strip()
    if not clean:
        raise ValueError("A Drive file id is required.")
    return urllib.parse.quote(clean, safe="")


def _summarize_file(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "file_id": item.get("id"),
        "name": item.get("name"),
        "mime_type": item.get("mimeType"),
        "size_bytes": item.get("size"),
        "created_time": item.get("createdTime"),
        "modified_time": item.get("modifiedTime"),
        "web_link": item.get("webViewLink"),
        "parents": item.get("parents") or [],
        "description": item.get("description"),
        "trashed": bool(item.get("trashed")),
    }


def _error_message(response: httpx.Response) -> str:
    try:
        detail = (response.json().get("error") or {}).get("message") or response.text[:300]
    except Exception:
        detail = response.text[:300]
    if response.status_code == 401:
        return "Google Drive authorization expired — reconnect Google Drive from the Plugins page."
    if response.status_code == 403:
        return f"Google Drive refused the request (missing scope or file permission): {detail}"
    if response.status_code == 404:
        return f"Google Drive could not find that file or folder: {detail}"
    if response.status_code == 429:
        return f"Google Drive rate limit reached — try again shortly: {detail}"
    return f"Google Drive API error {response.status_code}: {detail}"


drive_manager = Drive_Connection_Manager()
