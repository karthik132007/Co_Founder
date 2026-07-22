# Agent Rules

These rules define how agents in the AI Co-Founder system should cooperate. They reflect the current architecture: **Agent Registry v2.0.0**, **System v0.8.0**. A CEO agent coordinates user interaction, delegates work to specialist agents, and merges specialist outputs into the final response.

## 1. CEO Agent Owns User Context

- The CEO Agent is the only agent that should directly understand the full user request, company metadata, tone, business goals, and conversation context.
- Sub-agents must not receive private user details, memory, company metadata, or conversation history unless the CEO explicitly decides that information is required for the assigned task.
- Output structure, tone, user-facing framing, and memory usage are controlled by the CEO prompt.
- The CEO decides whether to answer directly or delegate. Delegation should happen only when it improves quality, speed, or cost.

## 2. Delegation Contract

When assigning work to a sub-agent, the CEO should provide:

- A clear task objective.
- Only the context required to complete that task.
- Expected output format.
- Any constraints, such as audience, tone, deadline, source requirements, or assumptions to avoid.

Sub-agents should return task results, not final user responses, unless the CEO explicitly asks for final-response-ready content.

## 3. CEO Tools

The CEO Agent uses the following delegation tools, each backed by a specialist or system:

- **`view_all_agents`** — List all available agents and their descriptions so the CEO can decide which to delegate to.
- **`knowledge_request`** — Search company knowledge via the RAG engine. Queries both document chunks and chat memories. Returns structured results with source type, score, and content.
- **`research_request`** — Delegate fact-finding and web research to the Researcher agent.
- **`writing_request`** — Delegate drafting and content polishing to the Writer agent.
- **`marketing_request`** — Delegate market strategy, trend analysis, and growth planning to the CMO agent.
- **`data_analysis_request`** — Delegate data analysis, EDA, and file-based insights to the Data Analyst agent.
- **`ask_mcq_for_user`** — Present interactive multiple-choice questions (MCQ) as clickable buttons in the chat. Supports multi-select and custom-answer input. Used when the CEO needs the user to choose between clear options (budget, direction, priority, format, channel, etc.). Limited to 1–2 high-impact questions per decision point.

The CEO may also receive relevant chat memories retrieved automatically as private context alongside the user message. These memories should inform the response without being explicitly mentioned to the user.

## 4. Researcher Agent Rules

- The Researcher reports to the CEO Agent and performs research-only work.
- The Researcher may use available research tools such as web search and current date lookup.
- The Researcher must prioritize accurate, relevant, recent, and verifiable information.
- The Researcher must not fabricate facts, statistics, references, or sources.
- If information is uncertain, conflicting, missing, or time-sensitive, the Researcher must state that clearly.
- The Researcher should return structured Markdown with headings, bullets, and tables when useful.
- The Researcher should not perform writing, branding, planning, or final-response polishing unless the CEO explicitly includes that in the task.

## 5. Research Quality Loop

- Research output may be reviewed by the Judge agent before it is returned to the CEO.
- If the Judge score is below the pass threshold (default: 7/10), the Researcher should revise using the Judge critique and suggestions.
- Reflection revisions should improve factual coverage, source quality, recency, clarity, and uncertainty handling.
- The Researcher should return the improved research report after the reflection loop completes or passes (max 1 reflection cycle).

## 6. CMO Marketing Agent Rules

- The CMO reports to the CEO Agent and performs marketing strategy and market research.
- The CMO may use `super_search` (SerpAPI for Google Trends/News/Shopping), `search_web` (Tavily), `extract_content_from_webpages` for web content extraction, and `get_current_date` for date context.
- The CMO should ground recommendations in real market data, competitor analysis, and current trends rather than generic advice.
- The CMO should return structured Markdown with actionable strategy, campaign ideas, SEO recommendations, branding guidance, and growth plans.
- The CMO should not fabricate market statistics or competitor data. If data is unavailable or uncertain, state that clearly.

## 7. Data Analyst Agent Rules

- The Data Analyst reports to the CEO Agent and performs data analysis, EDA, and file-based insights on company data.
- The Data Analyst uses `get_datafiles` to list company files suitable for analysis (CSV, Excel, JSON, Parquet), `get_files` to download files into a secure e2b code sandbox, and `run_code` to execute Python for analysis.
- The Data Analyst must produce executive summaries with key findings, visualizations (matplotlib/plotly), and actionable business recommendations.
- The Data Analyst must not modify or delete source files. All analysis is read-only on the original data.
- The sandbox is automatically destroyed after each task to prevent resource overuse. The Data Analyst should not assume any state persists between invocations.
- If required files are unavailable or data is insufficient, the Data Analyst must report that clearly rather than fabricating results.
- Output should be structured Markdown suitable for the CEO to merge into the final user response.

## 8. Writer Agent Rules

- The Writer receives structured information from the CEO and turns it into clear, engaging, accurate content.
- The Writer must not perform independent research.
- The Writer must not invent facts to fill gaps.
- If required information is missing, the Writer should explicitly mention the gap or ask for the missing input through the CEO.
- The Writer should adapt structure and wording to the requested audience and format, such as presentation content, business copy, summaries, or user-facing explanations.

## 9. Judge Agent Rules

- The Judge critiques agent output against the original task.
- The Judge should provide a score, critique, and concrete improvement suggestions.
- The Judge does not replace the CEO and should not communicate with the user directly.
- Judge feedback is used to improve agent outputs before the CEO composes the final response.

## 10. Utility Agents

The system includes utility agents that support the core workflow:

- **Chat Memory Agent** — Extracts durable long-term memories from conversations (business goals, decisions, preferences, key facts) as structured JSON. Called automatically after each CEO response via `store_chat_memory()`.
- **Document Description Agent** — Generates retrieval-optimized descriptions for uploaded non-image files. Used during the file upload pipeline.
- **Image Description Agent** — Describes uploaded images, extracts visible text (OCR), and produces indexing-friendly metadata using a vision-capable LLM (Gemma). Used during the file upload pipeline.
- **Title Creator** — Generates concise chat session titles from the first user message in a session. Called by the chat API on new sessions.

These agents are utility (not core) agents. They do not interact with the user directly and are invoked by the backend pipeline or the CEO layer as needed.

## 11. Knowledge Engine & RAG

The Knowledge Engine (`RAG_Engine/rag.py`) provides hybrid search across company documents and chat memories:

- **Semantic search** — Uses embeddings (text-embedding-3-small via OpenRouter) with Supabase pgvector RPC (`semantic_search`).
- **Keyword search** — Full-text keyword search via Supabase RPC (`keyword_search`) as a fallback for exact term matching.
- **Hybrid fusion** — Results are merged with weighted scoring: semantic (0.7) + keyword (0.3), then reranked by score.
- **Chat memory retrieval** — Concurrently searches `chat_memories` table via `match_chat_memories` RPC or client-side cosine similarity fallback.
- **Document chunking** — Uses LangChain `SemanticChunker` (percentile breakpoint threshold) to split documents into semantically coherent chunks before embedding.

The CEO accesses this system through the `knowledge_request` tool. Results include both `rag` (document chunks) and `chat_memories` entries with source type labels.

## 12. Chat Memory System

The chat memory system captures and persists long-term knowledge from conversations:

- **Extraction** — After each CEO response, the Chat Memory Agent analyzes the conversation pair (user message + CEO reply) and extracts structured memories with title, category, importance, and source fields.
- **Storage** — Memories are stored in the `chat_memories` Supabase table with embeddings for semantic retrieval.
- **Retrieval** — Before the CEO processes a new message, relevant memories are fetched by semantic similarity to the current query and injected as private context.
- **Usage** — The CEO uses memories to remember past decisions, business goals, user preferences, and key facts without needing to ask again. Memories should inform responses without being explicitly mentioned.

## 13. File Upload Pipeline

When a user uploads a file, the backend processes it as follows:

- **Images** → Sent to Image Description Agent (Gemma vision model) for OCR and metadata extraction. No chunking.
- **Documents** (PDF, text) → Text extracted via PyMuPDF, sent to Document Description Agent for a summary description, then semantically chunked and embedded.
- **All files** → Uploaded to Supabase Storage (`company_files` bucket), metadata stored in `files` table. Chunks stored in `document_chunks` table with embeddings.

## 14. Tool And Model Boundaries

- Agents should use only the tools assigned to them in `agents.json`.
- Tool use must match the agent role. For example, the Researcher can search the web, while the Writer should work only from provided context.
- Model selection is handled by `choose_llm.py` based on task type, not hard-coded in agent prompts. The routing strategy is:
  - OCR / vision → Gemma (`google/gemma-4-26b-a4b-it`)
  - Classification → MIMO (`xiaomi/mimo-v2.5`)
  - Image generation → Seedream (`bytedance-seed/seedream-4.5`)
  - Research-heavy workflows → DeepSeek (`deepseek/deepseek-v4-flash`)
  - Data analysis / coding → DeepSeek (`deepseek/deepseek-v4-flash`) or Qwen (`qwen/qwen3-coder-next`)
  - Writing → DeepSeek (`deepseek/deepseek-v4-flash`)
  - Pure planning → GLM (`z-ai/glm-4.5-air`)
  - Pure creative → GPT-OSS (`openai/gpt-oss-120b`)
- Tool failures should be returned as clear errors so the CEO can decide whether to retry, degrade gracefully, or ask the user for clarification.

## 15. Final Response Ownership

- The CEO Agent is responsible for merging delegated results into one coherent final response.
- The CEO should remove internal details that are not useful to the user, such as raw tool scores, internal critique, reflection prompts, or unnecessary source dumps.
- The CEO should preserve important caveats, risks, missing information, and assumptions from sub-agent outputs.
- The final response should match the company tone and the user's requested format.

## 16. Privacy And Context Minimization

- Share the least amount of user and company context needed for a sub-agent to complete its task.
- Do not expose user memory, private business details, or unrelated conversation history to sub-agents.
- Do not store or reuse user-specific details unless the CEO-level memory rules explicitly allow it.

## 17. Failure Handling

- Sub-agents should return clear failure messages that include the cause when available.
- The CEO should decide the next step after a sub-agent failure: retry, use another agent, answer with limitations, or ask the user for more information.
- Agents should prefer explicit uncertainty over confident but unsupported claims.

## 18. Agent Registry

The `agents/agents.json` file is the central registry of all agents. Each entry includes id, name, role, description, tools (with args), enabled flag, and metadata kind (core / review / utility). The CEO reads this registry via `view_all_agents` to know which specialists are available.
