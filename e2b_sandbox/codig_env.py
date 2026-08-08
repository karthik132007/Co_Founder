import logging
import os
from e2b_code_interpreter import Sandbox

logger = logging.getLogger(__name__)

api_key = os.getenv("E2B_API_KEY")

# A data-analysis task can require several model/tool turns before it executes
# code. E2B's implicit lifetime is too short for these longer CEO evals.
try:
    SANDBOX_TIMEOUT_SECONDS = max(60, int(os.getenv("E2B_SANDBOX_TIMEOUT_SECONDS", "900")))
except ValueError:
    SANDBOX_TIMEOUT_SECONDS = 900

# Cap a single code execution so a hung script can't stall the agent for the
# full sandbox lifetime (e2b's own default execution timeout is 300s).
try:
    CODE_TIMEOUT_SECONDS = max(10, int(os.getenv("E2B_CODE_TIMEOUT_SECONDS", "120")))
except ValueError:
    CODE_TIMEOUT_SECONDS = 120

# Lazily-created singleton sandbox. Created on first use, not at import time.
_sandbox: Sandbox | None = None


def get_sandbox() -> Sandbox:
    global _sandbox
    if _sandbox is None:
        logger.info("Creating new E2B sandbox (timeout=%ds)", SANDBOX_TIMEOUT_SECONDS)
        _sandbox = Sandbox.create(api_key=api_key, timeout=SANDBOX_TIMEOUT_SECONDS)
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
    logger.info(
        "Running Python code in sandbox (length=%d, timeout=%ds)",
        len(code) if code else 0,
        CODE_TIMEOUT_SECONDS,
    )
    try:
        execution = get_sandbox().run_code(
            code=code,
            timeout=CODE_TIMEOUT_SECONDS,
            request_timeout=CODE_TIMEOUT_SECONDS + 30,
        )
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
