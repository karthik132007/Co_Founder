from  backend.utils import get_supabase_client
supabase_client = get_supabase_client()
def add_memory(data,company_id):
    """
    Add a new memory entry to the chat_memory table.

    Args:
        data (dict): The memory data to be added.
        company_id (int): The ID of the company associated with the memory.
        """
    if not data:
        return None
    rows =[]
    for memory in data:
        rows.append({
            "company_id": company_id,
            "title": memory.get("title"),
            "memory": memory.get("memory"),
            "category": memory.get("category"),
            "importance": memory.get("importance"),
        })

    response = (
        supabase_client
        .table("chat_memories")
        .insert(rows)
        .execute()
    )
    return response
