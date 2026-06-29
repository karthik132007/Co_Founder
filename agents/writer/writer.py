"""
The writer agent that handles writing tasks, based on given context.
"""
from langchain.agents import create_agent
from agents.writer.writer_prompts import get_writer_system_prompt
from agents.helpers.choose_llm import get_best_llm,Task
writer_agent = create_agent(
    name="writer",
    model=get_best_llm([Task.WRITING]),
    system_prompt=get_writer_system_prompt(),
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