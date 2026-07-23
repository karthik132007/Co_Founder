import logging
import os
from e2b_code_interpreter import Sandbox

logger = logging.getLogger(__name__)

api_key = os.getenv("E2B_API_KEY")

# Lazily-created singleton sandbox. Created on first use, not at import time.
_sandbox: Sandbox | None = None


def get_sandbox() -> Sandbox:
    global _sandbox
    if _sandbox is None:
        logger.info("Creating new E2B sandbox")
        _sandbox = Sandbox.create(api_key=api_key)
        logger.info("E2B sandbox created successfully")
    return _sandbox


def kill_sandbox():
    global _sandbox
    if _sandbox is not None:
        try:
            _sandbox.kill()
            logger.info("Sandbox killed successfully")
        except Exception as e:
            logger.error("Error killing sandbox: %s", e)
        finally:
            _sandbox = None
    else:
        logger.debug("No sandbox to kill")


def run_python_code(code):
    logger.info("Running Python code in sandbox (length=%d)", len(code) if code else 0)
    try:
        execution = get_sandbox().run_code(code=code)
        stdout_len = len(execution.logs.stdout) if execution.logs.stdout else 0
        stderr_len = len(execution.logs.stderr) if execution.logs.stderr else 0
        logger.info("Code execution complete: stdout=%d lines, stderr=%d lines, text=%s",
                    stdout_len, stderr_len, bool(execution.text))
        return {
            "std_out": execution.logs.stdout,
            "std_err": execution.logs.stderr,
            "text": execution.text,
            "results": execution.results
        }
    except Exception as exc:
        logger.error("Code execution failed: %s", exc)
        raise


def upload_file_to_sandbox(file_name: str, content: bytes, path: str = "/home/user/data"):
    logger.info("Uploading file '%s' to sandbox path '%s' (%d bytes)", file_name, path, len(content) if content else 0)
    try:
        full_path = f"{path}/{file_name}"
        get_sandbox().files.write(full_path, content)
        logger.info("File uploaded successfully to %s", full_path)
        return full_path
    except Exception as e:
        logger.error("Error uploading file to sandbox: %s", e)
        return None

