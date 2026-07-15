import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from RAG_Engine.rag import kg
results=kg.search(
    company_id=1,
    query="GST",
    top_k=3
)
print(results)