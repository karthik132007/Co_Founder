import logging

from langchain.agents import create_agent
from agents.helpers.choose_llm import get_best_llm,Task
from agents.data_analyst.data_analyst_prompts import get_data_analyst_prompt
from agents.data_analyst.data_analyst_tools import run_code, get_datafiles, get_files
from e2b_sandbox.codig_env import kill_sandbox

logger = logging.getLogger(__name__)

tools = [run_code, get_datafiles, get_files]

logger.info("Creating data analyst agent")
data_analyst = create_agent(
    model=get_best_llm([Task.DATA_ANALYSIS]),
    system_prompt=get_data_analyst_prompt(),
    tools =tools
)
logger.info("Data analyst agent created")

def spawn_data_analyst(company_id: int, message: str):
    logger.info("spawn_data_analyst called: company_id=%d, message='%s'", company_id, message[:100])
    user_message = (
        f"The company_id for this task is {company_id}. "
        f"Always pass this company_id to the 'get data files' and 'get files' tools.\n\n"
        f"Task: {message}"
    )
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
        logger.error("Data analyst agent failed for company_id=%d: %s", company_id, e, exc_info=True)
        raise
    finally:
        kill_sandbox()