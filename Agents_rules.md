# Agent Rules

These rules define how agents in the AI Co-Founder system should cooperate. They reflect the current architecture: **Agent Registry v2.0.0**, **System v0.9.9**. A CEO agent coordinates user interaction, delegates work to specialist agents, and merges specialist outputs into the final response.

## 1. CEO Agent Owns User Context

- The CEO Agent is the only agent that should directly understand the full user request, company metadata, tone, business goals, and conversation context.
- Sub-agents must not receive private user details, memory, company metadata, or conversation history unless the CEO explicitly decides that information is required for the assigned task.
- Output structure, tone, user-facing framing, and memory usage are controlled by the CEO prompt.
- The CEO decides whether to answer directly or delegate. Delegation should happen only when it improves quality, speed, or cost.
- Before delegating, the CEO must classify intent: **INFORMATIONAL** queries (answer directly, do not spawn agents) vs **ACTION** queries (plan, delegate, execute). Never assume the founder wants to DO something just because they asked ABOUT something.
- Independent work MUST be triggered in the same turn (parallel tool calls). Serializing independent tool calls is a performance failure.

## 2. Delegation Contract

When assigning work to a sub-agent, the CEO should provide:

- A clear task objective.
- Only the context required to complete that task.
- Expected output format.
- Any constraints, such as audience, tone, deadline, source requirements, or assumptions to avoid.

Sub-agents should return task results, not final user responses, unless the CEO explicitly asks for final-response-ready content.

## 3. CEO Tools

The CEO Agent uses the following delegation tools, each backed by a specialist or system:

- **`view_all_agents`** — List all available agents and their descriptions (reads `agents/agents.json`) so the CEO can decide which to delegate to.
- **`knowledge_request`** — Search company **documents only** (files, chunks) via the RAG engine. Does NOT search chat memories (those are injected separately, non-flash only). Consumes `rag_calls` budget.
- **`research_request`** — Delegate fact-finding and web research to the Researcher agent. Consumes `web_searches` budget (Researcher's own searches draw from the same budget).
- **`writing_request`** — Delegate drafting and content polishing to the Writer agent. Consumes `external_agents` budget.
- **`marketing_request`** — Delegate market strategy, trend analysis, and growth planning to the CMO agent. Consumes `external_agents` budget.
- **`data_analysis_request`** — Delegate data analysis, EDA, and file-based insights to the Data Analyst agent. Consumes `external_agents` budget. The Data Analyst discovers and loads the relevant files itself — do NOT call `knowledge_request` first to find files.
- **`graphic_design_request`** — Delegate branded visual-asset creation and color-palette work to the Graphic Designer agent. `return_direct=True`; returns an `image_generated` payload resolved by `talk_to_ceo()`. Consumes `external_agents` budget.
- **`ask_mcq_for_user`** — Present interactive multiple-choice questions (MCQ) as clickable buttons in the chat. `return_direct=True`. Supports multi-select and custom-answer input. **Hard limit is effort-based** (flash: 1, mid: 2, max: 3 per session) — enforced both by the session resource budget AND by a backend `[SYSTEM DIRECTIVE]` guard that forces immediate execution once the limit is reached. Batch related questions into ONE `multi_select=True` call when possible.

**Chat memory retrieval** happens automatically before the CEO receives the user message in non-flash effort modes. Relevant past conversation memories are fetched via `match_chat_memories` RPC and injected into the user prompt as context. The CEO should use these memories naturally without mentioning them to the user.

## 4. Effort Levels (flash / mid / max)

Every chat request carries an `effort` parameter (`backend/api/chat.py`, frontend dropdown, default `flash`) that controls the entire pipeline:

| Aspect | ⚡ Flash | ⚖️ Mid | 🎯 Max |
|--------|---------|--------|-------|
| CEO / tool-use model | DeepSeek | GLM | GLM |
| Writing/creative model | DeepSeek | DeepSeek | GPT-OSS 120b |
| Researcher reflections | 0 | 1 | 2 |
| Writer reflections | 0 | 1 | 2 |
| Chat memory extraction + storage | ✅ async via Kafka | ✅ async via Kafka | ✅ async via Kafka |
| Chat memory retrieval (context injection) | skipped | ✅ | ✅ |
| Chat title generation | ✅ async via Kafka | ✅ async via Kafka | ✅ async via Kafka |
| Expected latency | ~30-60s | ~2-4min | ~5-7min |

- Flash mode uses a dedicated compact CEO prompt (`get_ceo_system_prompt_flash`) that tells the CEO its exact resource limits and instructs it to minimize agents (one agent should research AND write, analyze AND summarize, etc.).
- Model selection for every agent goes through `get_best_llm(tasks, effort)` in `agents/helpers/choose_llm.py`.

## 5. Session Resource Budget

Each session has a Redis-backed resource budget (`agents/CEO/ceo_resources.py`, key `session_resources:{id}`, 1h TTL) initialized on first request and re-initialized if the effort changes mid-session:

| Resource | ⚡ Flash | ⚖️ Mid | 🎯 Max |
|----------|---------|--------|-------|
| max_external_agents | 1 | 2 | 5 |
| max_web_searches | 2 | 3 | 4 |
| max_rag_calls | 1 | 3 | 5 |
| max_mcqs | 1 | 2 | 3 |

- Every budget-consuming tool calls `consume_resource(session_id, resource)` before executing; if exhausted it returns an error payload telling the agent to synthesize from what it has.
- The remaining budget is injected into the CEO's system context each turn (`format_resources_for_prompt`). Once a resource hits 0, the tool MUST NOT be called again.
- Researcher, CMO, and Data Analyst tool calls consume the same shared session budget as the CEO.

## 6. Researcher Agent Rules

- The Researcher reports to the CEO Agent and performs research-only work.
- Tools: `search_web` (Tavily) and `get_current_date`. Searches consume the session `web_searches` budget and fail gracefully with a "synthesize from what you have" error when exhausted.
- The Researcher must prioritize accurate, relevant, recent, and verifiable information.
- The Researcher must not fabricate facts, statistics, references, or sources.
- If information is uncertain, conflicting, missing, or time-sensitive, the Researcher must state that clearly.
- The Researcher should return structured Markdown with headings, bullets, and tables when useful.
- The Researcher should not perform writing, branding, planning, or final-response polishing unless the CEO explicitly includes that in the task (flash mode encourages asking the Researcher to also write a clean report to avoid a second agent).

## 7. Research Quality Loop

- Research output is reviewed by the Judge agent (GPT-OSS 120b) before it is returned to the CEO.
- Reflection count is effort-based: flash = 0, mid = 1, max = 2.
- If the Judge score is below the pass threshold (default: 7/10), the Researcher revises using the Judge critique and suggestions.
- Reflection revisions should improve factual coverage, source quality, recency, clarity, and uncertainty handling.
- The agent is rebuilt before each reflection pass because the search budget may have changed.

## 8. CMO Marketing Agent Rules

- The CMO reports to the CEO Agent and performs marketing strategy and market research.
- Tools: `search_current_market_trends` (SerpAPI for Google Trends/News/Shopping), `search_web` (Tavily), `extract_content_from_webpages`, `get_current_date`. Searches consume the session `web_searches` budget.
- The CMO should ground recommendations in real market data, competitor analysis, and current trends rather than generic advice.
- The CMO should return structured Markdown with actionable strategy, campaign ideas, SEO recommendations, branding guidance, and growth plans.
- The CMO should not fabricate market statistics or competitor data. If data is unavailable or uncertain, state that clearly.
- **No judge loop** — the CMO executes directly; quality control is the CEO's responsibility during synthesis.

## 9. Data Analyst Agent Rules

- The Data Analyst reports to the CEO Agent and performs data analysis, EDA, and file-based insights on company data.
- Tools: `run_code` (Python in an e2b sandbox), `get_datafiles` (list CSV/Excel/JSON/Parquet), `get_files` (download files into the sandbox). Uses `get_best_llm` with the effort parameter.
- The Data Analyst must produce executive summaries with key findings, visualizations (matplotlib/plotly), and actionable business recommendations.
- The Data Analyst must not modify or delete source files. All analysis is read-only on the original data.
- The sandbox is killed after every task (`kill_sandbox()`) — no state persists between invocations.
- The Data Analyst discovers and loads the relevant files BY ITSELF. The CEO should never call `knowledge_request` to locate files for it.
- If required files are unavailable or data is insufficient, the Data Analyst must report that clearly rather than fabricating results.
- **No judge loop** — executes directly.
- Output should be structured Markdown suitable for the CEO to merge into the final user response.

## 10. Writer Agent Rules

- The Writer receives structured information from the CEO and turns it into clear, engaging, accurate content.
- The Writer must not perform independent research.
- The Writer must not invent facts to fill gaps.
- If required information is missing, the Writer should explicitly mention the gap or ask for the missing input through the CEO.
- The Writer should adapt structure and wording to the requested audience and format, such as presentation content, business copy, summaries, or user-facing explanations.
- Reflection count is effort-based: flash = 0, mid = 1, max = 2, scored by the Judge (pass threshold 8/10).

## 11. Graphic Designer Agent Rules

- The Graphic Designer reports to the CEO Agent and owns the company's visual identity.
- The Graphic Designer has three tools:
  - `get_color_palette(company_id)` — Fetch the active brand color palette (hex array). Must be called FIRST before any graphic generation.
  - `update_color_palette(company_id, new_colors)` — Create or update the active palette with new hex values.
  - `create_graphic(company_id, prompt)` — Generate a PNG image via OpenRouter `google/gemini-2.5-flash-image`. Returns an image token (not raw bytes) to keep the ~1MB base64 payload out of the LLM context.
- The designer must always respect the company's color palette in every visual asset.
- The designer should adapt output to the requested format (Instagram post, email header, ad banner, etc.) and match the brand's positioning and audience.
- The designer should not fabricate brand assets or use colors that conflict with the established palette.
- **Image token flow:** The generated image is cached in `_generated_images` dict keyed by token. `talk_to_ceo()` scans tool outputs for the `image_generated` payload, resolves the token via `get_generated_image()` (one-shot read — popped on retrieval), and returns it to the chat API which saves the PNG to Supabase Storage (`save_generated_graphic`) in a background task.
- **No judge loop** — the Graphic Designer executes directly. Quality control is the CEO's responsibility during synthesis.

## 12. Judge Agent Rules

- The Judge critiques agent output against the original task.
- The Judge should provide a score, critique, and concrete improvement suggestions.
- The Judge does not replace the CEO and should not communicate with the user directly.
- Judge feedback is used to improve agent outputs (Researcher, Writer) before the CEO composes the final response, with reflection depth controlled by effort level.

## 13. Utility Agents

The system includes utility agents that support the core workflow:

- **Chat Memory Agent** — Extracts durable long-term memories from conversations (business goals, decisions, preferences, key facts) as structured JSON. Triggered after every CEO response by `queue_chat_memory()` (Kafka, all effort levels) and executed by the `chat_memory` consumer — never blocks the request path. Retrieval for context injection remains non-flash only.
- **Document Description Agent** — Generates retrieval-optimized descriptions for uploaded non-image files. Used during the file upload pipeline.
- **Image Description Agent** — Describes uploaded images, extracts visible text (OCR), and produces indexing-friendly metadata using a vision-capable LLM (Gemma). Used during the file upload pipeline.
- **Title Creator** — Generates concise chat session titles from the first user message in a session. Triggered on new sessions by `queue_title_creation()` (Kafka, all effort levels) and executed by the `session_title_creation` consumer.

These agents are utility (not core) agents. They do not interact with the user directly and are invoked by the backend pipeline or the CEO layer as needed.

## 14. Knowledge Engine & RAG

The Knowledge Engine (`RAG_Engine/rag.py`) provides hybrid search across company **documents only** when called via `knowledge_request` (which passes `include_chat_memory=False`):

- **Semantic search** — Uses embeddings (text-embedding-3-small via OpenRouter) with Supabase pgvector RPC (`semantic_search`).
- **Keyword search** — Full-text keyword search via Supabase RPC (`keyword_search`) as a fallback for exact term matching.
- **Hybrid fusion** — Results are merged with weighted scoring: semantic (0.7) + keyword (0.3), then reranked by score.
- **Sequential RPC calls** — The app uses one synchronous Supabase client; parallel requests can corrupt the shared HTTP/2 connection (httpx `LocalProtocolError`), so RPCs run sequentially.
- **Document chunking** — Uses LangChain `SemanticChunker` (percentile breakpoint threshold) to split documents into semantically coherent chunks before embedding.

**Chat memories are NOT searched via `knowledge_request`.** They are retrieved separately by `_get_relevant_chat_memories()` in `talk_to_ceo()` (non-flash only) and injected directly into the user prompt before the CEO agent receives it. This prevents duplicate memory lookups and keeps the knowledge tool focused on document retrieval.

## 15. Chat Memory System

The chat memory system captures and persists long-term knowledge from conversations:

- **Extraction** — After each CEO response, `chat.py` queues the conversation pair to the Kafka `chat_memory` topic (`queue_chat_memory()`, all effort levels); the `chat_memory_job` consumer calls `store_chat_memory()` which runs the Chat Memory Agent and persists structured memories with title, category, importance, and source fields.
- **Storage** — Memories are stored in the `chat_memories` Supabase table with embeddings for semantic retrieval via the `match_chat_memories` RPC function (`schemas/match_chat_memories.sql`).
- **Retrieval** — Before the CEO processes a new message (non-flash only), `talk_to_ceo()` calls `_get_relevant_chat_memories()` to fetch semantically similar memories. These are injected into the user prompt with "Hey CEO, here are retrieved relevant memories from past conversations..."
- **Usage** — The CEO uses memories to remember past decisions, business goals, user preferences, and key facts without needing to ask again. Memories should inform responses without being explicitly mentioned.
- **RPC fallback** — If the `match_chat_memories` RPC is unavailable, the system falls back to loading all memories for the company and computing cosine similarity locally.

## 16. File Upload Pipeline

When a user uploads a file, the backend processes it as follows:

- **Images** → Sent to Image Description Agent (Gemma vision model) for OCR and metadata extraction. No chunking.
- **Documents** (PDF, text) → Text extracted via PyMuPDF, sent to Document Description Agent for a summary description, then semantically chunked and embedded.
- **All files** → Uploaded to Supabase Storage (`company_files` bucket), metadata stored in `files` table. Chunks stored in `document_chunks` table with embeddings.

## 17. Tool And Model Boundaries

- Agents should use only the tools assigned to them in `agents.json`.
- Tool use must match the agent role. For example, the Researcher can search the web, while the Writer should work only from provided context.
- Model selection is handled by `choose_llm.py` based on task type AND effort level, not hard-coded in agent prompts:
  - ⚡ Flash → DeepSeek for everything; Gemma for OCR; MIMO (gpt-oss-20b) for classification.
  - ⚖️ Mid → DeepSeek for research/data, GLM (z-ai/glm-4.5-air) for tool-heavy agents, DeepSeek for writing; Gemma for OCR; MIMO for classification.
  - 🎯 Max → GLM for tool-heavy agents, DeepSeek for research/data, GPT-OSS (openai/gpt-oss-120b) for writing/creative; Gemma for OCR; MIMO for classification; DeepSeek for image-gen orchestration.
- Image generation orchestration → DeepSeek; actual image bytes via OpenRouter `google/gemini-2.5-flash-image`.
- Tool failures should be returned as clear errors so the CEO can decide whether to retry, degrade gracefully, or ask the user for clarification.
- **History field-name bug (fixed v0.8.0):** DB stores text in the `message` column; `talk_to_ceo()` reads `turn.get("content") or turn.get("message")` to handle both naming conventions. Always verify DB column names match what the code reads.

## 18. Final Response Ownership

- The CEO Agent is responsible for merging delegated results into one coherent final response.
- The CEO should remove internal details that are not useful to the user, such as raw tool scores, internal critique, reflection prompts, or unnecessary source dumps.
- The CEO should preserve important caveats, risks, missing information, and assumptions from sub-agent outputs.
- The final response should match the company tone and the user's requested format.

### Output Formatting for Deliverables

When the CEO's response contains content the founder will copy and use directly (emails, Instagram captions, ad copy, SMS, landing pages, blog posts, etc.), the CEO MUST wrap that content in fenced code blocks:

```text
[Ready-to-use deliverable content]
```

- Use ` ```text ` (not bare ` ``` `) so the frontend applies dedicated styling and a copy button.
- Put one blank line before and after each code block.
- Never put commentary inside code blocks — only the deliverable.
- Multiple deliverables should each go in their own block, separated by blank lines.
- Short inline items (a single headline, a tagline) do not need code blocks.

## 19. Privacy And Context Minimization

- Share the least amount of user and company context needed for a sub-agent to complete its task.
- Do not expose user memory, private business details, or unrelated conversation history to sub-agents.
- Do not store or reuse user-specific details unless the CEO-level memory rules explicitly allow it.

## 20. Failure Handling

- Sub-agents should return clear failure messages that include the cause when available.
- The CEO should decide the next step after a sub-agent failure: retry, use another agent, answer with limitations, or ask the user for more information.
- Agents should prefer explicit uncertainty over confident but unsupported claims.
- When a resource budget is exhausted, tools return an explicit error and agents must synthesize from already-collected information rather than retrying.

## 21. Agent Registry

The `agents/agents.json` file is the central registry of all agents. Each entry includes id, name, role, description, tools (with args), enabled flag, and metadata kind (core / review / utility). The CEO reads this registry via `view_all_agents` to know which specialists are available. The registry's CEO tool list must stay in sync with `_build_ceo_tools()` in `agents/CEO/ceo_agent_tools.py`.

## 22. Observability & WebSocket Trace

- Every chat request with a `session_id` streams internal agent activity to the frontend over WebSocket (`/chat/ws?session_id=`): `tool_start`, `tool_end`, `tool_error`, `subagent_spawn`, `subagent_end`, `subagent_error`, `session_start`, `session_end`, and 30s heartbeats.
- `ObservabilityCallback` (LangGraph callback) captures CEO tool-call events; sub-agent spawns/ends/errors are pushed manually by the CEO tools via `event_bus`.
- `return_direct=True` tools (`ask_mcq_for_user`, `graphic_design_request`) skip the normal `on_tool_end` callback, so they push a `tool_end` event manually (`_push_tool_end_manual`) to avoid stuck "running" rows in the trace.
- Events are fanned out through `SessionEventBus` (one drain queue per connected client). The chat endpoint sends a sentinel when processing finishes so the drain loop emits `session_end`.
- The frontend renders a collapsible agent trace below each assistant message, keyed by `tool_run_id` so parallel calls to the same tool are tracked separately.

## 23. Redis Caching & CEO State

- **CEO agent caching** — Built LangChain CEO agents are cached in-process keyed by `(company_id, effort)`; `invalidate_ceo_agent_cache()` evicts one or all entries. Company data used to build prompts is cached in Redis.
- **Request state** — Each `talk_to_ceo` call stores `{sid, effort}` in Redis under `ceo_req:{uuid}` (5-min TTL) and sets the key in a contextvar; tools read it via `ceo_state._current_session_id` / `ceo_state._current_effort` (thread-safe, no globals).
- **Data caching** — Company data (1h), user→company mapping (24h), chat session lists (2min), session messages (30s), and embeddings (1h, by sha256) are cached in Redis (`backend/db/redis_client.py`).

## 24. Kafka Async Jobs (message persistence)

Background persistence is decoupled from the request path via Kafka (`docker-compose.yaml`, Confluent Kafka 7.8.9 KRaft, port 9092; `confluent_kafka` in requirements):

| Topic | Producer helper | Consumer job | What it does |
|-------|-----------------|--------------|--------------|
| `chat_memory` | `queue_chat_memory()` | `chat_memory_job.py` | Extracts + stores chat memories from user/assistant pairs |
| `session_title_creation` | `queue_title_creation()` | `session_title_creation_job.py` | Generates + persists chat session titles |
| `add_message_to_session` | `queue_session_message()` | `add_message_to_session_job.py` | Persists a message row into a chat session |

- **Producers** live in `backend/kafka_jobs/producers/producer.py` — lazy singleton producer, JSON payload, `flush()` per message. The chat API (`backend/api/chat.py`) queues on the request path; the request is NOT blocked by the downstream work.
- **Consumers** run as separate processes (`python backend/kafka_jobs/run_consumers.py` launches all three). Each uses its own consumer group, processes one message at a time with per-message try/except isolation, and commits offsets synchronously only after success (`auto.offset.reset=earliest`, so crashes re-deliver uncommitted messages).
- **Import isolation** — consumers import persistence helpers from `backend/db/chat_memory_helpers.py` (`store_chat_memory`, `store_chat_title`), NOT `main.py` or the agent stack, to keep consumer processes lightweight.
- **Fallback behavior** — Kafka must be running: producer failures on the regular chat path propagate (no silent data loss). The only best-effort path is the MCQ side-queue (`queue_session_message` is wrapped in try/except because the message is already persisted to the DB synchronously and must remain visible in history even if Kafka is down).
- **MCQ messages** are persisted to the DB synchronously (immediately visible in history) and also queued via `queue_session_message()` for downstream consumers.
