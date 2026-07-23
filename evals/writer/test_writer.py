import logging

from agents.util_agents.writer.writer import spawn_writer
import time
import datetime
from pathlib import Path

logger = logging.getLogger(__name__)


def test_writer(prompt: str):
    logger.info("test_writer called with prompt length=%d", len(prompt) if prompt else 0)
    try:
        toc = time.time()
        result = spawn_writer(prompt, max_reflections=2)
        tic = time.time()
        elapsed = tic - toc
        logger.info("Writer completed in %.2f seconds", elapsed)
        return {
            "result": result,
            "time": elapsed
        }
    except Exception as e:
        logger.error("Writer failed: %s", e)
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
logger.info("test_writer result: %s", result)
print(result)
try:
    report_path = Path(__file__).resolve().parent / "Writer_Test_Report.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    content = f"""
        Date: {datetime.datetime.now()}
        prompt: {prompt}
        time taken: {result.get("time", "N/A")} seconds
        result: {result.get("result", result.get("error", "No output"))}
    """
    with open(report_path, "w") as fl:
        fl.write(content)
    logger.info("Report written to %s", report_path)
except Exception as e:
    logger.error("Failed to write report: %s", e)
    print(f"Failed to write report, cause: {e}")