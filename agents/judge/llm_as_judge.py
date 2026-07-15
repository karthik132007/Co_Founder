"""
Asking llm to critique a given answer to a question, give suggestions.
"""
import dotenv
from openai import OpenAI

from agents.judge.judge_propmts import get_judge_to_researcher_prompt,get_judge_to_writer_prompt
from agents.helpers.datetime_context import get_datetime_context
dotenv.load_dotenv()
LLM_API_KEY = dotenv.get_key(dotenv.find_dotenv(), "LLM_API_KEY")

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=LLM_API_KEY,
)


def judge_output_to_researcher(model: str, v1: any,task: str):
    """
    Judge the output of a model based on the given criteria.
    """
    prompt = get_judge_to_researcher_prompt(v1, task)
    completion = client.chat.completions.create(

    model=model,
    messages=[
        {
        "role": "system",
        "content": f"{get_datetime_context()}\n\nYou are a judge, your task is to critique the given answer to a question and provide suggestions for improvement."
    },
        {
        "role": "user",
        "content": prompt
        }
        ]
    )

    return completion.choices[0].message.content

def judge_output_to_writer(model: str, v1: any, task: str):

    prompt = get_judge_to_writer_prompt(v1, task)
    completion = client.chat.completions.create(

    model=model,
    messages=[
        {
        "role": "system",
        "content": f"{get_datetime_context()}\n\nYou are a judge, your task is to critique the given answer to a question and provide suggestions for improvement."
    },
        {
        "role": "user",
        "content": prompt
        }
        ]
    )

    return completion.choices[0].message.content
