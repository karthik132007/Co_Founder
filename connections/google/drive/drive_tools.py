"""Google Drive tools for connected agents."""

from connections.tool_manager import ToolManager

CONNECTION = "google_drive"
_FILE_PARAM = {
    "type": "string",
    "description": "Google Drive file or folder id (from search_files), not the app's internal Drive file id.",
}


def register_drive_tools(tools: ToolManager, client=None) -> None:
    if client is None:
        from connections.google.drive.drive_connection_manager import drive_manager

        client = drive_manager

    tools.add(
        f"{CONNECTION}.search_files",
        "Search the founder's Google Drive by file name or full text. Use this before reading a file when you do not have its id. "
        "Results include file ids, types, sizes, modified times and browser links. This is the connected Google Drive, not the app's internal /drive page.",
        func=client.search_files,
        context=["company_id"],
        params={
            "query": {"type": "string", "description": "Name or full-text search phrase.", "default": ""},
            "mime_type": {"type": "string", "description": "Optional MIME type filter, e.g. application/pdf.", "default": ""},
            "folder_id": {"type": "string", "description": "Optional Google Drive folder id to search inside.", "default": ""},
            "max_results": {"type": "integer", "description": "Maximum results (1-100, default 25).", "default": 25},
            "include_trashed": {"type": "boolean", "description": "Include trashed files (default false).", "default": False},
        },
    )

    tools.add(
        f"{CONNECTION}.get_file",
        "Get metadata for one Google Drive file. Use the file id returned by google_drive.search_files.",
        func=client.get_file,
        context=["company_id"],
        params={"file_id": _FILE_PARAM},
    )

    tools.add(
        f"{CONNECTION}.read_file",
        "Read a text file or export a Google Doc, Sheet or Slides file as bounded text. Use search_files first to get the file id. "
        "Binary files need google_drive.download_file instead.",
        func=client.read_file,
        context=["company_id"],
        params={"file_id": _FILE_PARAM},
    )

    tools.add(
        f"{CONNECTION}.download_file",
        "Download a Google Drive file as bounded base64 (maximum 10 MB). Use only when the founder asks to retrieve or inspect a binary file; never paste base64 into the response.",
        func=client.download_file,
        context=["company_id"],
        params={"file_id": _FILE_PARAM},
    )

    tools.add(
        f"{CONNECTION}.upload_file",
        "Upload a file to the founder's Google Drive. This changes their Drive: ask for explicit confirmation of the file name, destination folder and contents before calling it. Maximum 10 MB.",
        func=client.upload_file,
        context=["company_id"],
        params={
            "name": {"type": "string", "description": "Name for the uploaded file."},
            "content_base64": {"type": "string", "description": "The file bytes as base64."},
            "mime_type": {"type": "string", "description": "MIME type of the file.", "default": "application/octet-stream"},
            "folder_id": {"type": "string", "description": "Optional Google Drive destination folder id.", "default": ""},
            "description": {"type": "string", "description": "Optional Drive file description.", "default": ""},
        },
    )

    tools.add(
        f"{CONNECTION}.create_folder",
        "Create a folder in Google Drive. Ask for explicit confirmation of the folder name and parent folder before calling it.",
        func=client.create_folder,
        context=["company_id"],
        params={
            "name": {"type": "string", "description": "New folder name."},
            "parent_folder_id": {"type": "string", "description": "Optional parent folder id.", "default": ""},
        },
    )
