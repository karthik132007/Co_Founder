from RAG_Engine.embeddings import embedding_generator
from retrive import semantic_search, keywords_search
from utils import _merge_and_rerank

class KnowledgeEngine:

    def search(
            self,
            company_id: int,
            query: str,
            top_k: int,
            semantic_weight: float = 0.7,
            keyword_weight: float = 0.3,
            use_description_boost: bool = True,
            rerank: bool = True,
            include_chat_memory: bool = True,
    ):
        results=[]
        query = query.lower()
        query_embedding = embedding_generator(query)
        semantic_search_results = semantic_search(company_id=company_id, embedding=query_embedding)
        keyword_search_results = keywords_search(company_id=company_id, query=query)
        if rerank:
            results.append(_merge_and_rerank(keyword_search_results, semantic_search_results, semantic_weight, keyword_weight))
        #TODO:
        if include_chat_memory:
            pass
        if use_description_boost:
            pass
        return results

kg = KnowledgeEngine()