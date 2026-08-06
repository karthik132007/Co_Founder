# RAG Evaluation Report

**Date:** 2026-08-06T11:45:15.392239

**Top K:** 5

**Total Test Cases:** 20
**Passed:** 19
**Failed:** 1

## Metrics

- Average Precision@5: 0.189
- Average Recall@5: 0.950
- Average MRR: 0.883
- Pass Rate: 95.00%

## Failed Test Cases

{
  "query": "What is the minimum order quantity (MOQ) for wholesale purchases of Kumkumadi Tailem?",
  "expected": [
    5
  ],
  "returned": [
    4,
    22,
    23,
    8,
    24
  ],
  "missing": [
    5
  ],
  "precision": 0.0,
  "recall": 0.0,
  "mrr": 0.0
}

