import os
from e2b_code_interpreter import Sandbox
api_key = os.getenv("E2B_API_KEY")

sandbox = Sandbox.create(api_key=api_key)

def run_python_code(code):

    execution = sandbox.run_code(code=code)

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
        sandbox.files.write(f"{path}/{file_name}", content)
        return f"{path}/{file_name}"
    except Exception as e:
        print(f"Error uploading file to sandbox: {e}")
        return None

