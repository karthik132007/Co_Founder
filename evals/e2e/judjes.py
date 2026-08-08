import json

from langchain.agents import create_agent

from agents.helpers.CreateLLM import create_llm
from evals.e2e.get_harness_judje_prompts import get_harness_judge_prompt

models = [
    "~deepseek/deepseek-v4-flash-latest",
    "qwen/qwen3.7-flash",
    "openai/gpt-5.6-luna",
]

company_metadata = ""
system_prompt = get_harness_judge_prompt(company_metadata)

judges = [
    create_agent(model=create_llm(model), system_prompt=system_prompt)
    for model in models
]

SCORE_FIELDS = [
    "tool_call_score",
    "trajectory_score",
    "final_answer_score",
    "constraint_adherence_score",
    "groundedness_score",
    "hallucination_score",
    "overall_score",
]

OUTPUT_FILE = "evals/e2e/judges_scores.json"


def _parse_json(text) -> dict:
    text = str(text).strip()
    if text.startswith("```"):
        text = text.split("```")[1].strip()
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return {}
    return {}


def judge(query, model_response,task_id):
    prompt = f"User Query: {query}\nModel Response: {model_response}"

    verdicts = []
    for agent in judges:
        response = agent.invoke({"messages": [{"role": "user", "content": prompt}]})
        verdicts.append(_parse_json(response["messages"][-1].content))

    scores = {}
    for field in SCORE_FIELDS:
        values = []
        for v in verdicts:
            try:
                value = float(v.get(field))
                if 0 <= value <= 10:
                    values.append(value)
            except (TypeError, ValueError):
                continue
        scores[field] = round(sum(values) / len(values), 2) if values else 0.0

    final_score = round(sum(scores.values()) / len(scores), 2)

    strengths = []
    weaknesses = []
    reasoning = []
    for v in verdicts:
        for s in v.get("strengths", []) or []:
            s = str(s).strip()
            if s and s not in strengths:
                strengths.append(s)
        for w in v.get("weaknesses", []) or []:
            w = str(w).strip()
            if w and w not in weaknesses:
                weaknesses.append(w)
        if v.get("reasoning"):
            reasoning.append(str(v["reasoning"]).strip())

    record = {
        "task_id": task_id,
        "query": query,
        "scores": scores,
        "final_score": final_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "reasoning": reasoning,
    }

    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, list):
                data = []
    except (FileNotFoundError, json.JSONDecodeError):
        data = []
    data.append(record)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
