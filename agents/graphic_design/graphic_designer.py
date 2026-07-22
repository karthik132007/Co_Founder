from langchain.agents import create_agent
from agents.helpers.choose_llm import get_best_llm,Task
from agents.graphic_design.graphic_desiger_tools import get_color_palette,create_graphic, update_color_palette
from agents.graphic_design.graphic_designer_prompts import get_graphic_designer_system_prompt
tools=[get_color_palette,update_color_palette,create_graphic]

graphic_designer_agent= create_agent(
    model=get_best_llm(tasks=[Task.ImageGen]),
    tools=tools
    system_prompt=get_graphic_designer_system_prompt()
)


def spwan_graphic_designer(company_id:int, prompt):
    user_message = (
            f"The company_id for this task is {company_id}. "
            f"Always pass this company_id to the 'get data files' and 'get files' tools.\n\n"
            f"Task: {prompt}"
        )
    
    result = graphic_designer_agent.invoke(
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