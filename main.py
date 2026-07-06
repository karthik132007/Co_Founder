"""
The main entry point to start conversation
"""
from agents.CEO.CEO import talk_to_ceo
from RAG_Engine.chat_memory import add_memory
from agents.util_agents.chat_memory_creator import create_chat_memory
import json


def chat(company_id:int, user_message:str):
    ceo_reply = talk_to_ceo(company_id, user_message)
    conversation = f"""
    User: {user_message}
    CEO: {ceo_reply}
"""
    memories = create_chat_memory(conversation)
    if memories:
        add_memory(json.loads(memories), company_id)
    return ceo_reply
