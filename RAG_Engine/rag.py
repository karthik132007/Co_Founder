from concurrent.futures import ThreadPoolExecutor

from RAG_Engine.embeddings import generate_embeddings
from RAG_Engine.retrive import semantic_search, keywords_search
from RAG_Engine.utils import _merge_and_rerank
from RAG_Engine.chat_memory import get_chat_memories_by_query

class KnowledgeEngine:

    def search(
            self,
            company_id: int,
            query: str,
            top_k: int=3,
            semantic_weight: float = 0.7,
            keyword_weight: float = 0.3,
            use_description_boost: bool = True,
            rerank: bool = True,
            include_chat_memory: bool = True,
    ):
        query = query.lower()
        query_embedding = generate_embeddings(query)

        with ThreadPoolExecutor(max_workers=3 if include_chat_memory else 2) as executor:
            semantic_future = executor.submit(
                semantic_search,
                company_id=company_id,
                embedding=query_embedding,
                match_count=top_k,
            )
            keyword_future = executor.submit(
                keywords_search,
                company_id=company_id,
                query=query,
                match_count=top_k,
            )
            memory_future = None
            if include_chat_memory:
                memory_future = executor.submit(
                    get_chat_memories_by_query,
                    company_id=company_id,
                    query=query,
                    match_count=top_k,
                    query_embedding=query_embedding,
                )

            semantic_search_results = semantic_future.result() or []
            keyword_search_results = keyword_future.result() or []
            memory_results = (memory_future.result() or []) if memory_future else []

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

        return {
            "rag": document_results,
            "chat_memories": memory_results,
        }

kg = KnowledgeEngine()
