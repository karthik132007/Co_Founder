import logging
import threading

from langchain.agents import create_agent
from agents.helpers.choose_llm import get_best_llm,Task
from agents.data_analyst.data_analyst_prompts import get_data_analyst_prompt
from agents.data_analyst.data_analyst_tools import run_code, get_datafiles, get_files
from e2b_sandbox.codig_env import kill_sandbox

logger = logging.getLogger(__name__)

# The data-analysis tools share one E2B sandbox and ``finally`` tears it down
# after each request.  Concurrent invocations would otherwise let one request
# kill the sandbox while another is still uploading files or running code.
_data_analyst_execution_lock = threading.Lock()


def _sandbox_expired(error: Exception) -> bool:
    """Whether E2B says the remote sandbox was already torn down."""
    text = str(error).lower()
    return "sandbox was not found" in text or "sandbox timeout" in text

tools = [run_code, get_datafiles, get_files]

logger.info("Creating data analyst agent")
data_analyst = create_agent(
    model=get_best_llm([Task.DATA_ANALYSIS]),
    system_prompt=get_data_analyst_prompt(),
    tools =tools
)
logger.info("Data analyst agent created")

def spawn_data_analyst(company_id: int, message: str, effort: str = "flash"):
    logger.info("spawn_data_analyst called: company_id=%d, message='%s', effort=%s", company_id, message[:100], effort)
    user_message = (
        f"The company_id for this task is {company_id}. "
        f"Always pass this company_id to the 'get data files' and 'get files' tools.\n\n"
        f"Task: {message}"
    )
    logger.info("Waiting for exclusive E2B sandbox access")
    with _data_analyst_execution_lock:
        try:
            for attempt in range(2):
                try:
                    result = data_analyst.invoke(
                        {
                            "messages": [
                                {
                                    "role": "user",
                                    "content": user_message,
                                }
                            ]
                        }
                    )
                    logger.info("Data analyst agent completed successfully for company_id=%d", company_id)
                    return result
                except Exception as e:
                    if attempt == 0 and _sandbox_expired(e):
                        logger.warning("E2B sandbox expired; recreating it and retrying data analysis once")
                        kill_sandbox()
                        continue
                    logger.error("Data analyst agent failed for company_id=%d: %s", company_id, e, exc_info=True)
                    raise
        finally:
            kill_sandbox()
