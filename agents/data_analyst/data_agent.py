from langchain.agents import create_agent
from agents.helpers.choose_llm import get_best_llm,Task
from agents.data_analyst.data_analyst_prompts import get_data_analyst_prompt
from agents.data_analyst.data_analyst_tools import run_code, get_datafiles, get_files
from e2b_sandbox.codig_env import kill_sandbox
tools = [run_code, get_datafiles, get_files]

data_analyst = create_agent(
    model=get_best_llm([Task.DATA_ANALYSIS]),
    system_prompt=get_data_analyst_prompt(),
    tools =tools
)

def ask_data_analyst(company_id: int, message: str):
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
        return result
    finally:
        # Always destroy the sandbox after the task to avoid e2b overusage.
        kill_sandbox()