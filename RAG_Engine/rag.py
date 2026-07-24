import logging

from RAG_Engine.embeddings import generate_embeddings
from RAG_Engine.retrive import semantic_search, keywords_search
from RAG_Engine.utils import _merge_and_rerank
from RAG_Engine.chat_memory import get_chat_memories_by_query

logger = logging.getLogger(__name__)

class KnowledgeEngine:

    def search(
            self,
            company_id: int,
            query: str,
            top_k: int = 3,
            semantic_weight: float = 0.7,
            keyword_weight: float = 0.3,
            use_description_boost: bool = True,
            rerank: bool = True,
            include_chat_memory: bool = True,
    ):
        query = query.lower()
        query_embedding = generate_embeddings(query)

        # The application uses one synchronous Supabase client. Running these
        # requests in parallel shares that HTTP/2 connection across threads and
        # can corrupt the protocol state (httpx LocalProtocolError).
        semantic_search_results = semantic_search(
            company_id=company_id,
            embedding=query_embedding,
            match_count=top_k,
        ) or []
        keyword_search_results = keywords_search(
            company_id=company_id,
            query=query,
            match_count=top_k,
        ) or []
        memory_results = []
        if include_chat_memory:
            memory_results = get_chat_memories_by_query(
                company_id=company_id,
                query=query,
                match_count=top_k,
                query_embedding=query_embedding,
            ) or []

        logger.info(
            "Search tasks completed: semantic=%d, keyword=%d, memories=%d",
            len(semantic_search_results),
            len(keyword_search_results),
            len(memory_results),
        )

        if rerank:
            document_results = _merge_and_rerank(
                keyword_search_results,
                semantic_search_results,
                semantic_weight,
                keyword_weight,
            )
        else:
            document_results = semantic_search_results + keyword_search_results

        for result in document_results:
            result.setdefault("source_type", "document")
        document_results.sort(key=lambda item: item.get("score", item.get("similarity", 0)), reverse=True)

        if include_chat_memory:
            for memory in memory_results:
                memory["source_type"] = "chat_memory"
                memory["score"] = memory.get("similarity", 0)
            memory_results.sort(key=lambda item: item.get("score", item.get("similarity", 0)), reverse=True)

        if use_description_boost:
            pass

        logger.info("Search complete: %d document results, %d chat memories",
                    len(document_results), len(memory_results))
        return {
            "rag": document_results,
            "chat_memories": memory_results,
        }

kg = KnowledgeEngine()
