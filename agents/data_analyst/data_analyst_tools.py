import logging

from langchain.tools import tool
from e2b_sandbox.codig_env import run_python_code, upload_file_to_sandbox
from backend.db.get_from_sql import get_user_files
from backend.db.put_to_drive import download_from_cloud

logger = logging.getLogger(__name__)

# Extensions suitable for data analysis
DATA_EXTENSIONS = (".csv", ".xlsx", ".xls", ".json", ".parquet")


@tool('run code',description="Run Python code to DO EDA")
def run_code(code):
    logger.info("run_code called")
    result = run_python_code(code)
    logger.info("run_code completed successfully")
    return result
    
@tool('get data files', description="Returns the list of files with description which are suitable for data analysis tasks like .csv files or .xlsx files")
def get_datafiles(company_id: int):
    """Return data-analysis-suitable files for a company with their descriptions."""
    logger.info("get_datafiles called: company_id=%d", company_id)
    files = get_user_files(company_id)
    data_files = [
        {
            "file_name": f.get("file_name"),
            "mime_type": f.get("mime_type"),
            "file_size": f.get("file_size"),
            "description": f.get("description"),
            "created_at": f.get("created_at"),
        }
        for f in files
        if (f.get("file_name") or "").lower().endswith(DATA_EXTENSIONS)
    ]
    logger.info("Found %d data files for company_id=%d", len(data_files), company_id)
    return data_files if data_files else "No data files found for this company."


@tool('get files', description="Downloads one or more files by name and loads them into the code sandbox. Pass a list of file names. Returns sandbox paths to use in 'run code' (e.g. pd.read_csv('<path>')).")
def get_files(company_id: int, file_names: list[str]):
    """Download files from cloud storage (in-memory bytes) and upload them into the e2b sandbox."""
    logger.info("get_files called: company_id=%d, file_names=%s", company_id, file_names)
    results = []
    for file_name in file_names:
        content = download_from_cloud(company_id, file_name)
        if content is None:
            logger.warning("Could not retrieve file '%s' for company_id=%d", file_name, company_id)
            results.append(f"FAILED: Could not retrieve file '{file_name}'.")
            continue

        sandbox_path = upload_file_to_sandbox(file_name, content)
        if sandbox_path is None:
            logger.warning("Failed to load '%s' into sandbox", file_name)
            results.append(f"FAILED: Downloaded '{file_name}' but failed to load it into the sandbox.")
            continue

        logger.info("File '%s' loaded to sandbox at %s", file_name, sandbox_path)
        results.append(f"'{file_name}' -> {sandbox_path}")

    logger.info("get_files completed: %d files processed for company_id=%d", len(results), company_id)
    return (
        "Files loaded into the sandbox:\n" + "\n".join(results) +
        "\nUse these paths in the 'run code' tool to analyze them, e.g. pd.read_csv('<path>')."
    )