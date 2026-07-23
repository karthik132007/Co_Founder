import logging
import sys
import os

logger = logging.getLogger(__name__)

# Add project root to sys.path so e2b_sandbox can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from e2b_sandbox.codig_env import run_python_code

logger.info("Testing code sandbox with intentional division by zero")
result = run_python_code("print(200/0)")
logger.info("Sandbox result: %s", result)
print(result)