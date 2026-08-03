import json
import sys
from pathlib import Path
from datetime import datetime
from dummy_ceo import predict_tools
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

def load_test_cases() -> list[dict]:
    path = Path(__file__).resolve().parent / "ceo_test_data.json"
    with open(path, "r") as f:
        return json.load(f)

def run_evals():
    correct = 0
    total = 0
    failures = []

    data = load_test_cases()
    i=1
    for case in data:
        print(f"running case {i},query: {case['query']}")
        query = case["query"]
        expected_tools = set(case["expected_tools"])
        company_id = case.get("company_id")
        effort = case.get("effort", "flash")
        
        if company_id is None:
            raise ValueError(f"Test case missing company_id: {query}")

        predicted_tools = set(predict_tools(query, company_id, effort))
        i+=1
        if predicted_tools == expected_tools:
            correct += 1
        else:
            failures.append({
                "query": query,
                "expected": list(expected_tools),
                "predicted": list(predicted_tools)
            })
        total += 1
        failed = total - correct


    report = f"# CEO Evaluation Report\n\n"
    report += f"**Date:** {datetime.now().isoformat()}\n\n"
    
    report += f"**Total Test Cases:** {len(data)}\n"
    report += f"**Passed:** {correct}\n"
    report += f"**Failed:** {failed}\n\n"

    report += f"## Metrics\n\n"
    
    report += f"- Pass Rate: {(correct / len(data)) * 100:.2f}%\n\n"

    if failures:
        report += "## Failed Test Cases\n\n"

        for failure in failures:
            report += json.dumps(failure, indent=2)
            report += "\n\n"

    report_path = (
        Path(__file__).resolve().parent
        / "last_eval_results_ceo.md"
    )

    with open(report_path, "w") as f:
        f.write(report)

run_evals()