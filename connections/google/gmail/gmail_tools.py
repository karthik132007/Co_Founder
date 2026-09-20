"""Gmail tools registered on the connection ToolManager.

Read the founder's own phrasing, not Gmail's: the search tool accepts Gmail's
search syntax (`from:`, `newer_than:7d`, `is:unread`, `has:attachment`, …) so
the model can answer "what did Acme send us last week?" without a query DSL of
our own.

Safety model: every tool here is **read-only except `gmail.create_draft`**,
which writes a draft and never sends. There is intentionally no send tool —
outbound email stays a human action, so the founder reviews every draft in
Gmail themselves.
"""

from connections.tool_manager import ToolManager

CONNECTION = "gmail"


def register_gmail_tools(tools: ToolManager, client=None) -> None:
    """Add every Gmail tool to ``tools``.

    ``client`` is injectable for tests; it defaults to the real connection
    manager. ``company_id`` is server-injected so the model never passes it.
    """
    if client is None:
        from connections.google.gmail.gmail_connection_manager import gmail_manager

        client = gmail_manager

    tools.add(
        f"{CONNECTION}.get_profile",
        "Get the connected Gmail mailbox profile (email address, total messages and threads). "
        "Use it to confirm which inbox is connected before reporting email numbers.",
        func=client.get_profile,
        context=["company_id"],
    )

    tools.add(
        f"{CONNECTION}.search",
        "Search the connected Gmail inbox and get back matching messages with sender, subject, "
        "date, snippet and attachment names (bodies are NOT included — fetch one with gmail.get_message). "
        "Accepts Gmail search syntax in `query`, e.g. 'from:acme.com newer_than:7d', 'is:unread', "
        "'subject:invoice has:attachment'. Use this for \"find/check/search my inbox\", "
        "and to find the message a reply should be drafted for.",
        func=client.search_messages,
        context=["company_id"],
        params={
            "query": {
                "type": "string",
                "description": "Gmail search query (e.g. 'from:acme.com newer_than:7d'). Empty returns the newest messages.",
                "default": "",
            },
            "max_results": {
                "type": "integer",
                "description": "How many messages to return (1-25).",
                "default": 10,
            },
            "label_ids": {
                "type": "array",
                "description": "Optional label filter, e.g. ['INBOX', 'UNREAD'] (see gmail.list_labels).",
                "default": [],
            },
            "include_spam_trash": {
                "type": "boolean",
                "description": "Also search Spam and Trash.",
                "default": False,
            },
        },
    )

    tools.add(
        f"{CONNECTION}.get_message",
        "Read one Gmail message in full: recipients, date, decoded body text and attachment names. "
        "ALWAYS call gmail.search first and pass the exact 'id' from its results verbatim — "
        "never invent, guess, truncate, or reuse an id from earlier turns or other tools.",
        func=client.get_message,
        context=["company_id"],
        params={
            "message_id": {
                "type": "string",
                "description": "Exact message id returned by gmail.search (copy verbatim).",
            },
        },
    )

    tools.add(
        f"{CONNECTION}.get_thread",
        "Read a whole email conversation, oldest message first (use it to summarise a back-and-forth). "
        "ALWAYS call gmail.search first and pass the exact 'thread_id' from its results verbatim — "
        "never invent or guess ids.",
        func=client.get_thread,
        context=["company_id"],
        params={
            "thread_id": {
                "type": "string",
                "description": "Exact thread id returned by gmail.search (copy verbatim).",
            },
            "max_messages": {
                "type": "integer",
                "description": "Maximum messages to read from the thread (1-10).",
                "default": 10,
            },
        },
    )

    tools.add(
        f"{CONNECTION}.list_labels",
        "List the labels/folders in the connected Gmail mailbox. Useful before filtering a search by label.",
        func=client.list_labels,
        context=["company_id"],
    )

    tools.add(
        f"{CONNECTION}.create_draft",
        "Write a draft email into the connected Gmail inbox. The founder reviews and sends it in Gmail — "
        "nothing is ever sent from here, and this is the ONLY way you touch the mailbox. Ask the founder "
        "to confirm the recipient and content (ask_mcq_for_user) before calling it. To answer an existing "
        "email, pass `in_reply_to_message_id` so the draft lands inside that conversation with correct "
        "reply headers; the previous message's subject can be reused as-is.",
        func=client.create_draft,
        context=["company_id"],
        params={
            "to": {"type": "string", "description": "Recipient email address (or \"Name <email>\")."},
            "subject": {"type": "string", "description": "Subject line; reuse the original subject for a reply."},
            "body": {"type": "string", "description": "Plain-text body of the email."},
            "cc": {
                "type": "string",
                "description": "Optional Cc recipient(s), comma-separated.",
                "default": "",
            },
            "in_reply_to_message_id": {
                "type": "string",
                "description": "Message id being replied to (from gmail.search) — threads the draft correctly.",
                "default": "",
            },
        },
    )
