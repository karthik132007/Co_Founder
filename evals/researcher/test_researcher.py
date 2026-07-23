import logging
from pathlib import Path
import os
import sys
import time
import datetime

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
VENV_PYTHON = PROJECT_ROOT / ".venv" / "bin" / "python"

if VENV_PYTHON.exists() and Path(sys.executable).resolve() != VENV_PYTHON.resolve():
    os.execv(str(VENV_PYTHON), [str(VENV_PYTHON), str(Path(__file__).resolve()), *sys.argv[1:]])

sys.path.insert(0, str(PROJECT_ROOT))

from agents.researcher.researcher import spawn_researcher


def research(topic: str):
    logger.info("Research started for topic: '%s'", topic)
    try:
        tic = time.time()
        result = spawn_researcher(topic)
        toc = time.time()
        elapsed = toc - tic
        logger.info("Research completed in %.2f seconds", elapsed)
        return {
            "result": result,
            "time": elapsed
        }
    except Exception as e:
        logger.error("Research failed for topic '%s': %s", topic, e)
        return {"error": f"Failed!, cause: {e}"}

print("Enter a simple topic to test: ")
Topic = input()
result = research(topic=Topic)
logger.info("Research result: %s", result)
print(result)

try:
    report_path = Path(__file__).resolve().parent / "Researcher_Test_Report.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    content = f"""
        Date: {datetime.datetime.now()}
        prompt: {Topic}
        time taken: {result.get("time", "N/A")} seconds
        result: {result.get("result", result.get("error", "No output"))}
    """
    with open(report_path, "w") as fl:
        fl.write(content)
    logger.info("Report written to %s", report_path)
except Exception as e:
    logger.error("Failed to write report: %s", e)
    print(f"Failed to write report, cause: {e}")