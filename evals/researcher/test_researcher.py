from pathlib import Path
import os
import sys
import time
import datetime

PROJECT_ROOT = Path(__file__).resolve().parents[2]
VENV_PYTHON = PROJECT_ROOT / ".venv" / "bin" / "python"

if VENV_PYTHON.exists() and Path(sys.executable).resolve() != VENV_PYTHON.resolve():
    os.execv(str(VENV_PYTHON), [str(VENV_PYTHON), str(Path(__file__).resolve()), *sys.argv[1:]])

sys.path.insert(0, str(PROJECT_ROOT))

from agents.researcher.researcher import do_research


def research(topic: str):
    try:
        tic = time.time()
        result = do_research(topic)
        toc = time.time()
        return {
            "result": result,
            "time": toc - tic
        }
    except Exception as e:
        return {"error": f"Failed!, cause: {e}"}
print("Enter a simple topic to test: ")
Topic = input()
result=research(topic=Topic)
print(result)

try:
    report_path = Path(__file__).resolve().parent / "Researcher_Test_Report.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w") as fl:
        content = f"""
        Date: {datetime.datetime.now()}
        prompt: {Topic}
        time taken: {result.get("time", "N/A")} seconds
        result: {result.get("result", result.get("error", "No output"))}
    """
        fl.write(content)
except Exception as e:
    print(f"Failed to write report, cause: {e}")