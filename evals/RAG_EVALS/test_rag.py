import json
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from RAG_Engine.rag import kg

TOP_K = 5


def load_test_cases() -> list[dict]:
    path = Path(__file__).resolve().parent / "rag_test_data.json"
    with open(path, "r") as f:
        return json.load(f)


def run_evals() -> int:
    test_cases = load_test_cases()

    passed = 0
    failed = 0

    total_precision = 0.0
    total_recall = 0.0
    total_mrr = 0.0

    failures = []
    i = 1
    for case in test_cases:
        print(f"Running test case {i}")
        i += 1
        query = case["query"]
        expected_ids = case["expected_chunk_ids"]
        company_id = case.get("company_id")

        if company_id is None:
            raise ValueError(f"Test case missing company_id: {query}")

        results = kg.search(
            company_id=company_id,
            query=query,
            top_k=TOP_K,
            include_chat_memory=False,
        )

        rag = results.get("rag", [])
        returned_ids = [
            int(r["id"])
            for r in rag
            if r.get("id") is not None
        ]

        expected_set = {int(x) for x in expected_ids}
        returned_set = set(returned_ids)

        relevant_retrieved = len(expected_set & returned_set)

        precision = (
            relevant_retrieved / len(returned_ids)
            if returned_ids
            else 0.0
        )

        recall = (
            relevant_retrieved / len(expected_ids)
            if expected_ids
            else 0.0
        )

        total_precision += precision
        total_recall += recall
        # Reciprocal Rank (RR)
        rr = 0.0

        for rank, chunk_id in enumerate(returned_ids, start=1):
            if chunk_id in expected_set:
                rr = 1.0 / rank
                break

        total_mrr += rr
        
        missing = [
            cid
            for cid in expected_ids
            if cid not in returned_ids
        ]

        if not missing:
            passed += 1
        else:
            failed += 1
            failures.append(
                {
                    "query": query,
                    "expected": expected_ids,
                    "returned": returned_ids,
                    "missing": missing,
                    "precision": round(precision, 3),
                    "recall": round(recall, 3),
                    "mrr": round(rr, 3),
                }
            )

    avg_precision = (
        total_precision / len(test_cases)
        if test_cases else 0.0
    )

    avg_recall = (
        total_recall / len(test_cases)
        if test_cases else 0.0
    )
    avg_mrr = (
        total_mrr / len(test_cases)
        if test_cases else 0.0
    )

    report = f"# RAG Evaluation Report\n\n"
    report += f"**Date:** {datetime.now().isoformat()}\n\n"
    report += f"**Top K:** {TOP_K}\n\n"
    report += f"**Total Test Cases:** {len(test_cases)}\n"
    report += f"**Passed:** {passed}\n"
    report += f"**Failed:** {failed}\n\n"

    report += f"## Metrics\n\n"
    report += f"- Average Precision@{TOP_K}: {avg_precision:.3f}\n"
    report += f"- Average Recall@{TOP_K}: {avg_recall:.3f}\n"
    report += f"- Average MRR: {avg_mrr:.3f}\n"
    report += f"- Pass Rate: {(passed / len(test_cases)) * 100:.2f}%\n\n"

    if failures:
        report += "## Failed Test Cases\n\n"

        for failure in failures:
            report += json.dumps(failure, indent=2)
            report += "\n\n"

    report_path = (
        Path(__file__).resolve().parent
        / "last_eval_results.md"
    )

    with open(report_path, "w") as f:
        f.write(report)

    print(report)

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(run_evals())