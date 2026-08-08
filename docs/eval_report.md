# CEO Agent — End-to-End Evaluation Report

**Date:** 2026-08-08
**Scope:** `evals/e2e` — prompt-tweak + effort-mode evaluation of the **CEO orchestrator agent** in the Co_Founder multi-agent system, judged by three independent LLM judges.

---

## 1. Executive Summary

- **27 runs** were executed across **5 tasks**, **6 prompt tweaks** and **2 effort modes**, and each run was scored by **3 independent LLM judges** → **81 judge verdicts**.
- **Best average overall score: `normal` prompt (8.44/10)**, followed by `explicit_planning` (7.76), `cot_n_shot` (7.44), `reflection` (7.23), `tight_budget` (5.77), `Verification-first` (5.47).
- **Effort mode matters more than tweak:** `flash` (8.62) outperforms `mid` (6.36) with ~3× fewer tokens and roughly half the latency — **but all 6 `flash` runs were on the easy task (`CEO_008`), so this is confounded with task difficulty** and needs a like-for-like test.
- **The big failure mode is hard, multi-step tasks:** `CEO_033` (social-media strategy) and `CEO_045` (sales forecast) average **3.68 and 4.53**, dragged down by 3 runs that produced an **empty trajectory (zero tool calls)** and scored ~0.
- **`Verification-first` is the most hallucination-safe** (best `hallucination_score` of 8.93) **but the least capable** (worst overall 5.47) — it blocks unverifiable claims at the cost of task completion.
- **3 of 27 runs hit infra issues** (1 provider error, 2 timeouts > 240 s), all on `mid`-effort, hard tasks.

**Overall verdict:** the default (`normal`) prompt with `flash` effort is currently the strongest, most cost-efficient configuration. The system's quality is limited by agentic reliability on complex tasks (empty trajectories, no grounding evidence), not by prompt phrasing.

---

## 2. What Was Evaluated

The subject under test is the **CEO agent** (`agents/CEO/CEO.py`), the orchestrator that:

- classifies a user request,
- routes it to subagents via tools (`research_request`, `writing_request`, `marketing_request`, `data_analysis_request`, `graphic_design_request`),
- synthesizes a final answer.

The eval exercises this end-to-end: the CEO's full trajectory (tool decisions, delegated task prompts, final answer, timings, tokens) is recorded and then scored by judges.

---

## 3. Methodology

### 3.1 Dataset (`evals/e2e/ceo_answers_best5.json`)

5 tasks were selected, spanning 3 categories and 3 difficulty levels:

| Task ID | Category | Difficulty | Query (abridged) |
|---|---|---|---|
| `CEO_008` | Sales Analytics | easy | Best-selling product in 2024 by revenue |
| `CEO_016` | Content & Writing | mid | Product description for Herbal Hair Oil |
| `CEO_024` | Sales Analytics | mid | Customer demographics — states & channels |
| `CEO_033` | Marketing & Growth | hard | Complete social-media strategy for next quarter |
| `CEO_045` | Sales Analytics | hard | Forecast next quarter's sales from 2024–2025 data |

Category mix (by run): **Sales Analytics 16, Content & Writing 6, Marketing & Growth 5**.
Difficulty mix (by run): **easy 6, mid 11, hard 10**.

### 3.2 Experimental factors

- **Prompt tweaks** (`evals/e2e/tweaks/`), one config per run:
  `normal`, `cot_n_shot`, `explicit_planning`, `reflection`, `Verification-first`, `tight_budget`.
- **Effort modes:** `flash` (6 runs) and `mid` (21 runs).
- **Repetition:** 1 per variant (total 27 runs).
- Each variant carries per-effort **wall-clock safety caps** (flash 120 s, mid 420 s) — a case that exceeds its cap is recorded as `status="timeout"` and the harness moves on.

### 3.3 Harness

- Runner: `python -m evals.e2e.run_ceo_e2e` → compact per-run records (final answer, CEO tool-decision trace, delegated task prompts, timings, token totals, resource use). Raw transcripts, tool outputs and hidden chain-of-thought are **deliberately not retained**.
- Judging: `python -m evals.e2e.run_judging` reads the recorded answers and runs each through **3 independent LLM judges**, persisting one record per (answer, judge) to `judges_scores.json`.

### 3.4 Judging

**Judge models** (`evals/e2e/run_judging.py`):

| Judge # | Model |
|---|---|
| 1 | `deepseek/deepseek-v4-flash-latest` |
| 2 | `qwen/qwen3.7-flash` |
| 3 | `openai/gpt-5.6-luna` |

Each judge returns **7 numeric scores** (0–10), plus strengths/weaknesses/reasoning:

`tool_call_score`, `trajectory_score`, `final_answer_score`, `constraint_adherence_score`, `groundedness_score`, `hallucination_score`, `overall_score`.

**Aggregation:** the final score for a run is the **mean across all judges** per metric (see `evals/e2e/answera_eda.ipynb`). Judge verdicts that could not be parsed are dropped from the mean.

---

## 4. Results

### 4.1 Overall performance (final per-metric means, 27 runs)

| Metric | Mean | Std |
|---|---|---|
| tool_call_score | 7.36 | 3.30 |
| trajectory_score | 6.74 | 3.12 |
| final_answer_score | 6.75 | 3.01 |
| constraint_adherence_score | **8.09** | 3.10 |
| groundedness_score | **6.10** | 3.22 |
| hallucination_score | 7.46 | 2.67 |
| **overall_score** | **6.86** | 2.98 |

> Constraint adherence is the strongest dimension; **groundedness is the weakest**, consistent with the recurring judge complaint that the underlying tool output is not visible in the recorded trace, so numerical claims can't be independently verified.

### 4.2 By prompt tweak

| Tweak | n | Overall | Final answer | Hallucination | Time (ms) | Tokens |
|---|---|---|---|---|---|---|
| normal | 2 | **8.44** | 8.28 | 7.72 | 52,650 | 12,890 |
| explicit_planning | 5 | 7.76 | 7.58 | 7.39 | 113,122 | 32,642 |
| cot_n_shot | 5 | 7.44 | 7.55 | 6.93 | 94,321 | 29,796 |
| reflection | 5 | 7.23 | 7.04 | 6.50 | 109,451 | 24,372 |
| tight_budget | 5 | 5.77 | 5.89 | 7.43 | 109,960 | 16,748 |
| Verification-first | 5 | 5.47 | 5.10 | **8.93** | 106,812 | 17,667 |

- **`normal` (no added scaffolding) wins** — the extra reasoning scaffolds (`explicit_planning`, `cot_n_shot`, `reflection`) do not improve quality here, and some are more expensive.
- **`Verification-first` trades capability for safety:** best anti-hallucination score (8.93) but the worst overall (5.47) and lowest final-answer quality (5.10) — it refuses/aborts rather than answer.

### 4.3 By effort mode

| Effort | n | Overall | Time (ms) | Tokens |
|---|---|---|---|---|
| **flash** | 6 | **8.62** | 60,740 | 10,879 |
| mid | 21 | 6.36 | 114,723 | 28,586 |

`flash` is both **better and cheaper** — higher overall score with ~3× fewer tokens and ~half the latency. In this eval, the extra "thinking" budget of `mid` does not translate into quality.

> ⚠️ **Caveat:** all 6 `flash` runs are on the *easy* task `CEO_008`; `flash` was never run on the mid/hard tasks. The flash-vs-mid gap is therefore **confounded with task difficulty** and must be re-tested like-for-like (same tweak × same task) before it can be treated as a real effect.

### 4.4 By task

| Task | Difficulty | n | Overall | Final answer | Time (ms) | Tokens |
|---|---|---|---|---|---|---|
| `CEO_024` | mid | 5 | **8.84** | 8.51 | 113,837 | 21,296 |
| `CEO_008` | easy | 6 | 8.62 | 8.34 | 60,740 | 10,879 |
| `CEO_016` | mid | 6 | 8.05 | 8.08 | 40,496 | 17,390 |
| `CEO_045` | hard | 5 | 4.53 | 4.07 | 216,662 | 34,069 |
| `CEO_033` | hard | 5 | 3.68 | 4.18 | 102,744 | 50,382 |

Easy/mid tasks score well (8.0–8.8). **Hard, multi-step tasks collapse** (`CEO_033`/`CEO_045`), and they are also the most expensive in time and tokens.

### 4.5 Best & worst runs

**Top 5:**
| Task | Tweak | Effort | Overall |
|---|---|---|---|
| CEO_024 | cot_n_shot | mid | 9.33 |
| CEO_008 | Verification-first | flash | 9.22 |
| CEO_024 | tight_budget | mid | 9.20 |
| CEO_016 | explicit_planning | mid | 8.91 |
| CEO_024 | Verification-first | mid | 8.84 |

**Bottom 5:**
| Task | Tweak | Effort | Overall |
|---|---|---|---|
| CEO_045 | tight_budget | mid | 0.20 |
| CEO_033 | Verification-first | mid | 0.33 |
| CEO_045 | Verification-first | mid | 0.77 |
| CEO_033 | cot_n_shot | mid | 4.08 |
| CEO_033 | tight_budget | mid | 4.39 |

**3 runs produced an empty trajectory (zero tool calls)** — CEO_033/Verification-first, CEO_045/Verification-first, CEO_045/tight_budget — all `mid`, all hard tasks. These account for the three near-zero overall scores.

### 4.6 Judge reliability & agreement

- 81 judge records; **1 unparseable** verdict ("Judge response did not contain parseable scores") for run `660ecf74…` (CEO_008/tight_budget) — that run's score is the mean of the 2 parseable judges.
- **Average within-run judge std: 1.29** (good agreement overall).
- **5 of 27 runs had high disagreement (std > 2)** — mostly around the failed runs where judges weighed "no hallucination" vs "no task completion" differently.

---

## 5. Infra / Reliability

| Status | Count |
|---|---|
| ok | 24 |
| timeout (> 240 s) | 2 |
| error | 1 |

| run_id | Task | Tweak | Effort | Issue |
|---|---|---|---|---|
| `3d4fb63e…` | CEO_033 | Verification-first | mid | `BadRequestResponseError: Provider returned error` |
| `62d82c75…` | CEO_045 | Verification-first | mid | timeout after 240 s |
| `f12fc40d…` | CEO_045 | tight_budget | mid | timeout after 240 s |

All 3 affected runs are `mid`-effort hard tasks. Note the harness is **resumable** (`--retry-errors`), so these can be re-run and merged in.

---

## 6. Key Findings & Insights

1. **Default beats scaffolding.** `normal` prompt outperforms every engineered tweak; the reasoning scaffolds add cost (time/tokens) without adding quality.
2. **Effort mode is promising but unproven.** `flash` > `mid` on both quality and cost in this sample, but every `flash` run was the easy task — treat the gap as confounded until `flash` is run on mid/hard tasks.
3. **Complex tasks are the bottleneck.** The agent reliably handles easy/mid routing but **fails to even start tool calls** on some hard multi-step tasks (3 empty trajectories scoring ~0).
4. **Groundedness is the weakest metric everywhere** (6.10) — judges can't verify claims because tool outputs aren't in the recorded trace. This is partly an **evaluation artifact** (trace truncation) and partly a real transparency gap.
5. **Verification-first is a safety/capability trade-off**: excellent hallucination control, poor completion.
6. **Costs are high on hard tasks:** `CEO_045` averages ~217 s and ~34k tokens; `CEO_033` averages ~50k tokens, with one run at 86k tokens.

---

## 7. Recommendations

- **Keep `normal` + `flash`** as the default for easy/simple queries (best quality per cost), but **re-run `flash` on mid/hard tasks** — all flash runs so far were the easy task, so the gap isn't proven outside easy queries.
- **Fix the empty-trajectory failure mode** — add a guard that forces at least one tool call (or a fallback) when the CEO plan requires data/knowledge gathering; this alone would lift the hard-task floor.
- **Surface tool outputs to the judge** — include the tool-returned content (or a summary) in the judged trace so `groundedness`/`hallucination` scores reflect reality instead of the trace's silence.
- **Re-evaluate `Verification-first`** — if hallucination safety is a product requirement, use it as a **hallucination guardrail** (post-filter) rather than as the primary planner.
- **Re-run the 3 failed runs** with `--retry-errors` and re-merge before drawing final conclusions about `tight_budget`/`Verification-first` on hard tasks.
- **Add judge-agreement reporting** as a standard eval output (currently computed ad hoc) so noisy runs are flagged automatically.

---

## 8. Artifacts

| File | Purpose |
|---|---|
| `evals/e2e/ceo_answers_best5.json` | Recorded CEO answers (27 runs) |
| `evals/e2e/judges_scores.json` | Judge verdicts (81 records) |
| `evals/e2e/run_ceo_e2e.py` | CEO eval harness |
| `evals/e2e/run_judging.py` | LLM judging harness |
| `evals/e2e/tweaks/` | Prompt-tweak implementations |
| `evals/e2e/answera_eda.ipynb` | Score EDA + plots (judge averaging, per-tweak/mode/task) |
| `evals/e2e/eda.ipynb` | Runtime/token EDA |
| `docs/answera_scores_eda.png` | Score plots (tweak/mode quality + bars) |
| `docs/eda.png` | Runtime/token collage |

## 9. Reproduce

```bash
# 1. Run the CEO end-to-end eval for chosen tweaks
python -m evals.e2e.run_ceo_e2e --tweaks normal cot_n_shot explicit_planning reflection Verification-first tight_budget

# 2. Judge the recorded answers with 3 LLM judges
python -m evals.e2e.run_judging --input evals/e2e/ceo_answers_best5.json --output evals/e2e/judges_scores.json

# 3. Retry any errored/timeout runs
python -m evals.e2e.run_ceo_e2e --retry-errors
```
