def get_judge_to_researcher_prompt(v1: any, task: str) -> str:
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

def get_judge_to_writer_prompt(v1: any, task: str) -> str:
    return f"""
You are judging a Writer Agent's output.

Original task:
{task}

Writer output:
{v1}

Evaluate the writing using these criteria:

- Follows the original task and instructions
- Clear, concise, and easy to understand
- Well-structured with logical flow
- Appropriate tone for the intended audience
- Grammatically correct and free of spelling mistakes
- No unnecessary repetition or filler
- Consistent formatting (headings, bullets, tables where appropriate)
- Preserves all important information from the original task
- Does not invent facts or unsupported claims
- Actionable and useful for the intended reader

Return ONLY valid JSON in the following format:

{{
  "score": 0,
  "passed": false,
  "critique": "Specific weaknesses in the writing.",
  "suggestions": "Concrete improvements the writer should make.",
}}

Scoring Guidelines:
- 9-10: Excellent, publication-ready.
- 8-8.9: Very good, only minor improvements needed.
- 6-7.9: Acceptable but requires revision.
- Below 6: Major rewrite required.

The score must be between 0 and 10.
Set "passed" to true only if the score is 8 or higher.

Return ONLY the JSON object.
"""