from pathlib import Path
import os
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
VENV_PYTHON = PROJECT_ROOT / ".venv" / "bin" / "python"

if VENV_PYTHON.exists() and Path(sys.executable).resolve() != VENV_PYTHON.resolve():
    os.execv(str(VENV_PYTHON), [str(VENV_PYTHON), str(Path(__file__).resolve()), *sys.argv[1:]])

sys.path.insert(0, str(PROJECT_ROOT))

from agents.researcher.researcher import do_research


def research(topic: str):
    try:
        result = do_research(topic)
        return result
    except Exception as e:
        return f"Failed!, cause: {e}"
print("Enter a simple topic to test: ")
Topic = input()
result=research(topic=Topic)
print(result)