"""
Eval for the Data Analyst agent (via CEO delegation).

Prereqs:
- sales_2024.csv and sales_2025.csv uploaded through the app for the company below.

Run from repo root:
    python -m evals.data_analyst.test_data_analyst
"""
from datetime import datetime
from pathlib import Path

from agents.CEO.CEO import talk_to_ceo

COMPANY_ID = 1

PROMPT = """
I need a deep EDA on our sales data. We have two files: sales_2024.csv and sales_2025.csv.

Please do ALL of the following:
1. Load BOTH files and combine them into a single dataset (handle any column mismatches).
2. Data quality report: missing values, duplicates, inconsistent dtypes, negative or zero revenue/profit rows, outliers in Revenue and Profit.
3. Year-over-year analysis: total Revenue and Profit for 2024 vs 2025, growth %, and monthly revenue trend across both years.
4. Breakdowns: top 5 products by revenue, revenue by Region and by Channel, and Category-wise profit margin %.
5. Discount analysis: correlation between DiscountPercent and Profit — are heavy discounts actually hurting us? Show numbers.
6. Salesperson leaderboard: top 5 by total profit.
7. Anomalies: any months/regions where revenue spiked or crashed abnormally.
8. Finish with a concise executive summary: 5 key findings and 3 actionable recommendations with the numbers to back them.
""".strip()

REPORT_PATH = Path(__file__).resolve().parent / "data_analyst_test_report.md"


def main():
    started = datetime.now()
    response = talk_to_ceo(company_id=COMPANY_ID, message=PROMPT)
    elapsed = (datetime.now() - started).total_seconds()

    report = f"""# Data Analyst Test Report

**Date:** {started.strftime("%Y-%m-%d %H:%M:%S")}
**Company ID:** {COMPANY_ID}
**Duration:** {elapsed:.1f}s

## Prompt

{PROMPT}

## Response

{response}
"""
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"Report written to {REPORT_PATH}")
    print(response)


if __name__ == "__main__":
    main()
