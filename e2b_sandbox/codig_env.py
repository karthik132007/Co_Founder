import os
from e2b_code_interpreter import Sandbox

api_key = os.getenv("E2B_API_KEY")

# Lazily-created singleton sandbox. Created on first use, not at import time.
_sandbox: Sandbox | None = None


def get_sandbox() -> Sandbox:
    """Return the shared sandbox, creating it on first use."""
    global _sandbox
    if _sandbox is None:
        _sandbox = Sandbox.create(api_key=api_key)
    return _sandbox


def kill_sandbox():
    """Destroy the sandbox if it exists, to avoid e2b overusage charges."""
    global _sandbox
    if _sandbox is not None:
        try:
            _sandbox.kill()
        except Exception as e:
            print(f"Error killing sandbox: {e}")
        finally:
            _sandbox = None


def run_python_code(code):

    execution = get_sandbox().run_code(code=code)

    return {
        "std_out":execution.logs.stdout,
        "std_err":execution.logs.stderr,
        "text":execution.text,
        "results":execution.results
    }


def upload_file_to_sandbox(file_name: str, content: bytes, path: str = "/home/user/data"):
    """Upload file bytes into the sandbox filesystem (in-sandbox only, never local disk).
    Returns the full path of the file inside the sandbox, or None on failure."""
    try:
        get_sandbox().files.write(f"{path}/{file_name}", content)
        return f"{path}/{file_name}"
    except Exception as e:
        print(f"Error uploading file to sandbox: {e}")
        return None

