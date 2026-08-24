
## Changelog (v0.9.5 → v0.9.11)

### Kafka Async Job Pipeline
- **Decoupled background work**: chat memory extraction, session title generation, and message persistence moved off FastAPI `BackgroundTasks` onto Kafka topics
- **Topics + consumers**: `chat_memory` → `chat_memory_job.py`, `session_title_creation` → `session_title_creation_job.py`, `add_message_to_session` → `add_message_to_session_job.py`
- **Producer module**: `backend/kafka_jobs/producers/producer.py` with `queue_session_message()`, `queue_chat_memory()`, `queue_title_creation()` (lazy singleton producer, JSON payloads, flush per message)
- **Consumer jobs**: one process per topic, own consumer group, per-message error isolation, synchronous offset commit after success, `auto.offset.reset=earliest`
- **`run_consumers.py`**: launches all three consumers as subprocesses from a single command
- **`chat_memory_helpers.py`**: `store_chat_memory()` / `store_chat_title()` extracted from `main.py` so consumers can import persistence without the agent stack (CEO, LLM clients)
- **`main.py` slimmed** to the `chat()` entry point only
- **`docker-compose.yaml`**: Confluent Kafka 7.8.9 single-node KRaft broker on port 9092
- **MCQ persistence**: clarification replies are written to the DB directly (immediately visible in history) and side-queued to Kafka
- **All efforts get memory/titles**: flash mode no longer skips chat memory extraction or title generation — they run async via Kafka, so the response path is unaffected
- **`connectors/base.py`**: `BaseConnector` abstraction (`connect` / `disconnect` / `get_status`) added as the foundation for pluggable external connectors
- **`requirements.txt`**: added `confluent_kafka`

### Agent Registry & Routing Updates
- CEO tools in `agents/agents.json` expanded: `ask_mcq_for_user`, `research_request`, `writing_request`, `marketing_request` with agent-routing descriptions (e.g. `data_analysis_request` explicitly scoped to company files; `knowledge_request` documents only)
- CMO `super_search` renamed to `search_current_market_trends`; CMO gained `get_current_date`

### Flash Response Optimizations
- Dedicated compact flash CEO prompt (`get_ceo_system_prompt_flash`) with explicit resource limits and a "one agent does research AND write" directive
- Flash latency improved ~40% via reduced model hops and skipped non-essential pipeline stages

### Resource Guard Rails
- Session resource budget (`agents/CEO/ceo_resources.py`) enforced for `external_agents`, `web_searches`, `rag_calls`, `mcqs` (flash: 1/2/1/1, mid: 2/3/3/2, max: 5/4/5/3)
- Exhausted resources return explicit errors; agents must synthesize from collected data instead of retrying