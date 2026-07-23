import logging
import sys
from pathlib import Path

logger = logging.getLogger(__name__)

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from RAG_Engine.rag import kg

logger.info("Running end-to-end RAG test: company_id=1, query='GST', top_k=3")
results = kg.search(
    company_id=1,
    query="GST",
    top_k=3
)
logger.info("RAG search completed: %d document results, %d chat memories",
            len(results.get("rag", [])), len(results.get("chat_memories", [])))
print(results)