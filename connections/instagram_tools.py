"""Instagram tools registered on the connection ToolManager."""

from connections.tool_manager import ToolManager

CONNECTION = "instagram"


def register_instagram_tools(tools: ToolManager, client=None) -> None:
    """Add every Instagram tool to ``tools``.

    ``client`` is injectable for tests; it defaults to the real connection
    manager. ``company_id`` is server-injected so the model never passes it.
    """
    if client is None:
        from connections.instagram_connection_manager import instagram_manager

        client = instagram_manager

    tools.add(
        f"{CONNECTION}.get_details",
        "Get the connected Instagram account's profile (username, account type, media count).",
        func=client.get_instagram_details,
        context=["company_id"],
    )

    tools.add(
        f"{CONNECTION}.get_recent_activity",
        "Get recent Instagram posts (caption, media type, image URL, permalink, date) from the last n_days.",
        func=client.get_instagram_recent_activity,
        context=["company_id"],
        params={
            "n_days": {
                "type": "integer",
                "description": "Look-back window in days.",
                "default": 7,
            },
            "include_image_descriptions": {
                "type": "boolean",
                "description": "Also describe each image (slower).",
                "default": False,
            },
        },
    )

    tools.add(
        f"{CONNECTION}.post_content",
        "Publish one image post to Instagram. Needs a public image URL because Instagram downloads it.",
        func=client.post_instagram_content,
        context=["company_id"],
        params={
            "content": {
                "type": "object",
                "description": "Post payload: {'image_url': public https URL, 'caption': optional text}.",
            },
        },
    )
