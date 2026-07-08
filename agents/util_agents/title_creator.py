from agents.helpers.choose_llm import get_best_llm, Task
from langchain.agents import create_agent

agent = create_agent(
    model=get_best_llm([Task.CLASSIFICATION]),
    system_prompt="You are a helpful assistant"
)


def create_title_for_query(query: str) -> str:
    prompt = f"""
    For given user query genrate a simple title for that chat
    ex: How can i develop my business?
    output: Business Development Strategies
    -------------------
    query: {query}
    """

    response = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
    )
    # agent.invoke() returns {"messages": [...]} — grab the last AI message
    content = response["messages"][-1].content
    return content.strip() if isinstance(content, str) else str(content)