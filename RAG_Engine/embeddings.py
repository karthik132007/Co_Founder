import os
from openai import OpenAI

class EmbeddingGenerator:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.environ['LLM_API_KEY'],
            base_url="https://openrouter.ai/api/v1",
        )
        self.model = "openai/text-embedding-3-small"

    def generate_embeddings(self, text: str):
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty or whitespace.")
        response = self.client.embeddings.create(
            input=text,
            model=self.model
        )
        return response.data[0].embedding

embedding_generator = EmbeddingGenerator()