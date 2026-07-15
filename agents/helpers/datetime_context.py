from datetime import datetime


def get_datetime_context() -> str:
    now = datetime.now().astimezone()
    return f"Current datetime: {now.strftime('%Y-%m-%d %H:%M:%S %Z%z')}"
