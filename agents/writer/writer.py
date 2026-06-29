"""
The writer agent that handles writing tasks, based on given context.
"""
from langchain.agents import create_agent
from writer_prompts import get_writer_system_prompt
from helpers.choose_llm import get_best_llm,Task
writer_agent = create_agent(
    name="writer",
    description="Convert the information into readable structured ouptput for end user",
    model=get_best_llm(Task.WRITING),
    system_prompt=get_writer_system_prompt(),
    verbose=True
)

def write(prompt_from_CEO: str):
    try:
        response = writer_agent.invoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt_from_CEO,
                    }
                ]
            }
        )
        return response["messages"][-1].content
    except Exception as e:
        return f"Writting failed!, cause: {e}"