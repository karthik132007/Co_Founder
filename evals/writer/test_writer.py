
from agents.util_agents.writer.writer import spawn_writer
import time
import datetime
from pathlib import Path


def test_writer(prompt:str):
    try:
        toc = time.time()
        result = spawn_writer(prompt,max_reflections=2)
        tic = time.time()

        return {
            "result": result,
            "time": tic - toc
        }
    except Exception as e:
        return {"error": f"Failed!, cause: {e}"}

with open("/home/electron/Documents/GitHub/Co_Founder/evals/researcher/Researcher_Test_Report.md", "r") as fl:
    content = fl.read()

prompt = f"""this is the output given by researcher
Your job is to convert that information into clear, engaging, and accurate content.
Tone: Funny
Target audiance: Zen-Z
 here is research :
 {content}
"""

result = test_writer(prompt=prompt)
print(result)
try:
    report_path = Path(__file__).resolve().parent / "Writer_Test_Report.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w") as fl:
        content = f"""
        Date: {datetime.datetime.now()}
        prompt: {prompt}
        time taken: {result.get("time", "N/A")} seconds
        result: {result.get("result", result.get("error", "No output"))}
    """
        fl.write(content)
except Exception as e:
    print(f"Failed to write report, cause: {e}")