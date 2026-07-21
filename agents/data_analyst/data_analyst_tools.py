from langchain.tools import tool
from e2b_sandbox.codig_env import run_python_code


@tool('run code',description="Run Python code to DO EDA")
def run_code(code):
    
    result = run_python_code(code)
    return result
    
@tool('get data files',description="Retunrns the list of files with description which are suitable for data analysis tasks like .csv files or .xlsx files")
def get_datafiles():
    pass

@tool('get a file',description="returns given file")
def get_a_file(file_name):
    pass