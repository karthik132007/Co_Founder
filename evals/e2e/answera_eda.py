# %%
import pandas as pd
# %%
from pathlib import Path

json_path = Path("judges_scores.json")
if not json_path.exists():
    json_path = Path("evals/e2e/judges_scores.json")

answers= pd.read_json(json_path)

json_path = Path("ceo_answers_best5.json")
if not json_path.exists():
    json_path = Path("evals/e2e/ceo_answers_best5.json")

data = pd.read_json(json_path)
# %%
answers = answers.drop(columns=['response'])
# %%
data['tweak'] = data['variant'].apply(lambda x: x.get('tweak'))
data = data.drop(columns=['schema_version','recorded_at'])
data['query'] = data['task'].apply(lambda x: x.get('query'))
data['total_ms'] = data['metrics'].apply(lambda x: x.get('total_ms'))
data['effort'] = data['variant'].apply(lambda x: x.get('effort'))
# %%
df = pd.merge(answers, data, left_on='run_id', right_on='run_id', how='left')
# %%
df['tool_call_score'] = df['scores'].apply(lambda x: x.get('tool_call_score'))
df['trajectory_score'] = df['scores'].apply(lambda x: x.get('trajectory_score'))
df['final_answer_score'] = df['scores'].apply(lambda x: x.get('final_answer_score'))
df['constraint_adherence_score'] = df['scores'].apply(lambda x: x.get('constraint_adherence_score'))
df['groundedness_score'] = df['scores'].apply(lambda x: x.get('groundedness_score'))
df['hallucination_score'] = df['scores'].apply(lambda x: x.get('hallucination_score'))
df['overall_score'] = df['scores'].apply(lambda x: x.get('overall_score'))
df['tokens'] = df['metrics'].apply(lambda x: x.get('tokens'))
df['total_tokens'] = df['tokens'].apply(lambda x: x.get('total_tokens') if isinstance(x, dict) else None)
# %%
df = df.drop(columns=['scores','query_x','query_y','task','variant','metrics','subagent_prompts','subagent_results','ceo_trace','response','reasoning','weaknesses','strengths','tokens'])
# %%
# Keep a single final record per run_id: average the judges' scores
score_cols = ['tool_call_score', 'trajectory_score', 'final_answer_score',
              'constraint_adherence_score', 'groundedness_score',
              'hallucination_score', 'overall_score']
agg = {c: 'first' for c in df.columns if c not in score_cols}
agg.update({c: 'mean' for c in score_cols})
df = df.groupby('run_id', as_index=False).agg(agg)
df.sort_values(by='task_id', ascending=True, inplace=True)
# %%
df
# %%
import seaborn as sns
import matplotlib.pyplot as plt
from IPython.display import display

sns.set_theme(style="whitegrid", context="talk")

# Average judge scores per tweak and per effort mode
score_summary = (
    df.groupby("tweak", dropna=False)[score_cols]
    .mean()
    .round(2)
    .sort_values("overall_score", ascending=False)
)
mode_summary = (
    df.groupby("effort", dropna=False)[score_cols]
    .mean()
    .round(2)
    .sort_values("overall_score", ascending=False)
)

display(score_summary)
display(mode_summary)

# Long-form dataframe for plotting
plot_df = df.melt(
    id_vars=["tweak", "effort", "task_id", "total_ms", "total_tokens"],
    value_vars=score_cols,
    var_name="metric",
    value_name="score",
)
# %%
# 2x2 collage: overall score by tweak/mode (top: boxplots, bottom: bars with error bars)
fig, axes = plt.subplots(2, 2, figsize=(18, 12), constrained_layout=True)

# Row 0: overall score by tweak and by effort mode
for ax, (x_col, title) in zip(axes[0], [("tweak", "Tweak vs Overall Score"), ("effort", "Mode vs Overall Score")]):
    sns.boxplot(data=df, x=x_col, y="overall_score", ax=ax, color="#dbeafe", showfliers=False)
    sns.stripplot(data=df, x=x_col, y="overall_score", ax=ax, color="#111827", alpha=0.75, jitter=0.15, size=7)
    ax.set_title(title, fontweight="bold")
    ax.set_xlabel(x_col.capitalize())
    ax.tick_params(axis="x", rotation=25)

# Row 1: overall score by tweak and by mode (mean +/- std)
for ax, (x_col, title) in zip(axes[1], [("tweak", "Overall Score by Tweak"), ("effort", "Overall Score by Mode")]):
    sns.barplot(data=df, x=x_col, y="overall_score", ax=ax, color="#60a5fa", errorbar="sd", capsize=0.15)
    sns.stripplot(data=df, x=x_col, y="overall_score", ax=ax, color="#111827", alpha=0.6, jitter=0.15, size=6)
    ax.set_title(title, fontweight="bold")
    ax.set_xlabel(x_col.capitalize())
    ax.tick_params(axis="x", rotation=25)

fig.suptitle("Judge scores by tweak and effort mode", fontsize=18, fontweight="bold")
output_path = Path("/home/electron/Documents/GitHub/Co_Founder/docs/answera_scores_eda.png")
output_path.parent.mkdir(parents=True, exist_ok=True)
plt.savefig(output_path, bbox_inches="tight", dpi=200)
plt.show()
# %%
# Heatmap: average of every judge metric by tweak
fig, ax = plt.subplots(figsize=(13, 6), constrained_layout=True)
sns.heatmap(
    score_summary,
    annot=True,
    fmt=".2f",
    cmap="YlGnBu",
    linewidths=0.5,
    ax=ax,
    cbar_kws={"label": "Average score"},
)
ax.set_title("Average judge scores by tweak (all metrics)", fontweight="bold")
ax.set_xlabel("Metric")
plt.show()
# %%
# Efficiency vs quality: overall score against tokens and runtime, colored by mode
fig, axes = plt.subplots(1, 2, figsize=(18, 6), constrained_layout=True)

sns.scatterplot(data=df, x="total_tokens", y="overall_score", hue="effort", style="tweak", s=140, ax=axes[0])
axes[0].set_title("Overall score vs total tokens", fontweight="bold")

sns.scatterplot(data=df, x="total_ms", y="overall_score", hue="effort", style="tweak", s=140, ax=axes[1])
axes[1].set_title("Overall score vs runtime (ms)", fontweight="bold")

fig.suptitle("Efficiency vs quality by effort mode", fontsize=18, fontweight="bold")
plt.show()