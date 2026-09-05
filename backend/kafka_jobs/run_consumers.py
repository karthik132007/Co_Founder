#!/usr/bin/env python
"""Launch all three Kafka consumers as subprocesses."""
import subprocess
import sys
import os

_repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

CONSUMERS = [
    "backend/kafka_jobs/consumers/add_message_to_session_job.py",
    "backend/kafka_jobs/consumers/chat_memory_job.py",
    "backend/kafka_jobs/consumers/session_title_creation_job.py",
    "backend/kafka_jobs/consumers/manage_credits.py",
]

procs = []
try:
    for script in CONSUMERS:
        p = subprocess.Popen([sys.executable, script], cwd=_repo_root)
        procs.append(p)
        print(f"Started {script} (pid={p.pid})")
    for p in procs:
        p.wait()
except KeyboardInterrupt:
    for p in procs:
        p.terminate()
