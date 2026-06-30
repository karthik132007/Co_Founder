def get_judge_prompt(v1: any, task: str) -> str:
    return f"""
You are judging a research agent's answer.

Task:
{task}

Research output:
{v1}

Evaluate the answer using these criteria:
- Relevance to the task
- Factual accuracy
- Recency of information
- Source quality
- Completeness
- Clear handling of uncertainty
- No hallucinated facts or fake sources
- Useful structure for a CEO/founder decision

Return only valid JSON:

{{
  "score": 0,
  "passed": false,
  "critique": "Specific weaknesses",
  "suggestions": "Concrete improvements the researcher should make",
  "missing_questions": ["Important unanswered question 1"]
}}

The score must be from 0 to 10.
Pass only if score is 8 or higher.
"""
