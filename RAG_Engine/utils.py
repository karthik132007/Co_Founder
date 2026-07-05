
def _merge_and_rerank(keyword_search_results, semantic_search_results,semantic_weight:float,keyword_weight:float):
    scores ={}
    for row in semantic_search_results:
        scores[row["id"]] ={
            **row,
            "score": row["similarity"] *semantic_weight
        }

    for row in keyword_search_results:

        if row["id"] not in scores:
            scores[row["id"]] = {
                **row,
                "score": 0,
            }
        scores[row["id"]]["score"] += row["keyword_score"] * keyword_weight

    return sorted(
        scores.values(),
        key=lambda x: x["score"],
        reverse=True
    )
