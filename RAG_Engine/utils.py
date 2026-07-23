import logging

logger = logging.getLogger(__name__)


def _merge_and_rerank(keyword_search_results, semantic_search_results, semantic_weight: float, keyword_weight: float):
    logger.debug("Merging and reranking %d semantic results and %d keyword results with weights semantic=%.2f, keyword=%.2f",
                 len(semantic_search_results), len(keyword_search_results), semantic_weight, keyword_weight)
    scores = {}
    for row in semantic_search_results:
        scores[row["id"]] = {
            **row,
            "score": row["similarity"] * semantic_weight
        }

    for row in keyword_search_results:
        if row["id"] not in scores:
            scores[row["id"]] = {
                **row,
                "score": 0,
            }
        scores[row["id"]]["score"] += row["keyword_score"] * keyword_weight

    sorted_results = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    logger.debug("Reranking complete, returning %d results", len(sorted_results))
    return sorted_results
