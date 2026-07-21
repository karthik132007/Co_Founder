import os
from e2b_code_interpreter import Sandbox
api_key = os.getenv("E2B_API_KEY")

sandbox = Sandbox.create(api_key=api_key)

def run_python_code(code):

    execution = sandbox.run_code(code=code)

    return {
        "std_out":execution.logs.stdout,
        "std_err":execution.logs.stderr,
        "text":execution.text,
        "results":execution.results
    }

