from langchain.agents import create_agent
from agents.helpers.choose_llm import get_best_llm,Task
from agents.data_analyst.data_analyst_prompts import get_data_analyst_prompt
from agents.data_analyst.data_analyst_tools import run_code
tools =[run_code]

data_analyst = create_agent(
    model=get_best_llm([Task.DATA_ANALYSIS]),
    system_prompt=get_data_analyst_prompt(),
    tools =tools
)

def ask_data_analyst(message):
    result = data_analyst.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": message,
                }
            ]
        }
    )
    return result