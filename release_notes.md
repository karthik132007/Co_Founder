
## Changelog (v0.9.14 → v0.9.15)

### Agent Trace — fixed in production + real-time LLM streaming
- **Root cause of the invisible trace fixed**: the agent (running in the `POST /chat` threadpool) could emit events before the browser's WebSocket finished upgrading, so the event bus silently dropped them. The `SessionEventBus` now buffers events per session and replays them into a drain loop when it connects, so nothing is lost — even if the WS connects late or reconnects mid-query. The frontend also awaits the WebSocket connection before firing the chat POST, so the trace starts at t=0.
- **Handles missed sentinels**: if a query ends before the WS connects, a late-connecting drain loop now ends immediately (after replaying the buffer) instead of blocking forever.
- **Real-time LLM streaming via `agent.stream`**: `talk_to_ceo` now uses LangChain's `agent.stream()` (`stream_mode=["messages","updates"]`) instead of `invoke()`. LLM tokens are batched (~24 tokens / 60ms) and pushed to the WebSocket as `llm_token` events; the full result is reconstructed from the stream so MCQ / image-generation flows are unchanged.
- **Live streaming answer in the chat**: the assistant message now appears token-by-token in real time while the CEO agent responds (planning/"thinking" tokens are discarded when a tool call starts).
- **Agent Trace dropdown beside the chat bar**: a new `AgentTracePanel` sits in the input bar and opens as a right-aligned popover above it. It auto-opens on send, shows connection status, live tool calls, subagents with durations, expandable inputs/outputs, the streaming response, and a clear button. The old inline trace in the message flow was removed.

## Changelog (v0.9.13 → v0.9.14)

### Signup & Onboarding
- **Email validation + confirm password**: signup form now validates email format (must contain `@` and a domain) and requires a matching confirm-password field; only the final password is sent to the backend
- **Onboarding asks for the user's name**: new "Your name" step, saved to `users.name` via the onboarding endpoint

### Google OAuth (Supabase PKCE)
- Full Google sign-in flow: `signInWithGoogle()` → `/auth/callback` → `POST /auth/google` (Supabase access token verified server-side)
- New Google accounts go to `/onboarding`; returning accounts go straight to `/dashboard`
- Google users: `password NULL`, `auth_provider='google'`, linked via `supabase_user_id`
- Missing `users.name` is backfilled from Supabase metadata on subsequent logins

### Onboarding Completion Tracking
- `/auth/login` and `/auth/google` now return `onboarding_complete` (true when the user has a company), so "signed up but never onboarded" users are always redirected back to `/onboarding`
- App layout + onboarding hydration guards prevent spurious redirects to `/auth`; the auth page auto-redirects already-signed-in users

### Backend Session Cookie
- `httpOnly` `cofounder_session` cookie (HMAC-signed, expiring token) set on login/signup/Google
- `GET /auth/me` restores the session from the cookie; `POST /auth/logout` clears it
- Next visit auto-redirects to the dashboard without re-entering credentials
- Env: `SESSION_SECRET`, `SESSION_COOKIE_SECURE`, `SESSION_MAX_AGE_DAYS`

### Database
- Applied `schemas/migrations/add_supabase_user_id.sql` (adds `users.supabase_user_id` + unique constraint)

### Bug Fixes
- Google OAuth callback no longer always lands users on `/chat`
- Fixed stray backtick corruption on the auth callback page
- Clearer error messages for OAuth / backend-unreachable failures

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