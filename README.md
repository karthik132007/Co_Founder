# Co_Founder — v0.7.2 (Prerelease)

> **📘 For complete system context and understanding, please refer to [`Agents_rules.md`](Agents_rules.md) before contributing or making changes.**

## Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Agent System](#agent-system)
- [RAG Engine](#rag-engine)
- [Backend](#backend)
- [Frontend](#frontend)
- [Code Sandbox](#code-sandbox)
- [Prompt System & Tool Registry](#prompt-system--tool-registry)
- [Logging & Observability](#logging--observability)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Status](#status)
- [Contributing](#contributing)

## Overview

AI Co-Founder is a multi-agent AI platform that replaces a human founding team with a CEO orchestrator agent and specialized sub-agents. Founders describe their business idea through a conversational chat interface, and the agents collaboratively handle strategy, market research, content writing, data analysis, and knowledge management via a shared RAG + chat memory backbone.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User (React Frontend)                   │
│  Landing → Auth → Onboarding → Dashboard (Chat/Drive/Stats) │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP (JSON)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (backend/app.py)                 │
│  Routers: auth, company, files, chat                         │
│  Middleware: CORS (localhost:3000), JSON parsing              │
└─────────┬───────────────────────────────────────────────────┘
          │ agent dispatch
          ▼
┌─────────────────────────────────────────────────────────────┐
│              CEO Agent (LangChain create_agent)              │
│  System prompt: CEO persona + tool descriptions              │
│  Decision loop: plan → delegate → synthesize → respond       │
│  Tools: research, write, marketing, data_analysis,           │
│         ask_mcq, retrieve_knowledge, get_chat_memories,      │
│         create_doc_description, see_drive_files              │
└──────┬──────┬──────┬──────┬──────┬──────┬────────────────────┘
       │      │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼      ▼
   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌──────────┐
   │Res.│ │Writ│ │CMO │ │Data│ │Jud.│ │Utility   │
   │    │ │    │ │    │ │An. │ │ge  │ │Agents    │
   │Tav │ │LLM │ │Serp│ │e2b │ │LLM │ │(mem,desc,│
   │ily │ │    │ │API │ │sand│ │as- │ │title)    │
   └────┘ └────┘ └────┘ └────┘ └────┘ └──────────┘
       │      │      │      │
       └──────┴──────┴──────┘
                │
                ▼
     ┌──────────────────────┐
     │   RAG Engine         │
     │  Semantic Chunker     │
     │  Embed (text-embed-3) │
     │  Hybrid Search        │
     │  0.7 sem + 0.3 kw    │
     │  Merge + Rerank       │
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │   Supabase           │
     │  PostgreSQL + pgvec   │
     │  Storage (S3-compat)  │
     └──────────────────────┘
```

## Agent System

### CEO Orchestrator
The CEO (`backend/agents/ceo_agent.py`) is a LangChain agent built with `create_agent()` — a custom wrapper around LangChain's agent framework. It is initialized with:
- **System prompt**: A detailed persona describing the CEO's role, decision-making style, and constraint rules
- **Tool registry**: 10+ tools that the CEO dynamically selects via LLM reasoning
- **LLM backend**: OpenRouter with model selection via `get_best_llm(system_prompt)` — picks DeepSeek, GPT-OSS, Gemma, or GLM based on context

**Decision loop**:
1. User message received via `POST /api/chat`
2. CEO plans next actions (research, write, analyze, or clarify)
3. Delegates to sub-agents via tool calls
4. Synthesizes results into a coherent response
5. Sends response back as markdown or MCQ cards

### Sub-Agent Architecture
Each sub-agent follows a common pattern:
- **Specialized system prompt** with domain expertise
- **Judge Agent reflection loop**: Output is scored 1–10; if < 8/10, the agent revises with Judge's critique
- **Temperature 0.7** for creative tasks (writer), **0.2** for analytical (data analyst)

| Agent | File | Tools / Backend | Judge Loop |
|---|---|---|---|
| Researcher | `backend/agents/researcher.py` | Tavily web search API | ✅ < 8/10 revises |
| Writer | `backend/agents/writer.py` | Direct LLM generation | ✅ < 8/10 revises |
| CMO Marketing | `backend/agents/cmo.py` | SerpAPI (Trends, News, Shopping) + web search | ✅ < 8/10 revises |
| Data Analyst | `backend/agents/data_analyst.py` | e2b code sandbox (Python, Pandas, Matplotlib) | ❌ (direct execution) |
| Judge | `backend/agents/judge.py` | LLM-as-Judge prompt | N/A (evaluator) |
| Chat Memory | `backend/agents/chat_memory_agent.py` | Structured memory extraction from conversations | ❌ |
| Doc Description | `backend/agents/description_agent.py` | LLM + OCR for document/image summarization | ❌ |

### Interactive MCQ Clarifications
The CEO uses the `ask_mcq_for_user` tool to present **multiple-choice question cards** in the chat UI. Implementation details:
- `backend/tools/mcq_tools.py` defines the tool with a structured `MCQRequest` schema: question text, options list (label + description), min/max selections
- The CEO agent is instructed to ask **at most 1–2 questions per turn** and only when the answer would materially change the plan
- Frontend renders MCQ cards via `Chat.tsx` — displays as interactive cards with checkboxes, a custom answer input, and a confirm button
- On confirmation, the selection is sent back as a user message, which re-enters the CEO's decision loop

## RAG Engine

The RAG pipeline (`backend/RAG_Engine/rag.py`) is the shared knowledge layer. Data flow:

### Ingestion Pipeline
```
User uploads file → POST /api/files/upload
  → PyMuPDF extraction (PDFs) / OCR (images)
  → Description Agent generates a retrieval-optimized summary
  → LangChain SemanticChunker splits text by semantic boundaries
  → OpenRouter text-embedding-3-small generates 1536-dim vectors
  → Supabase pgvector RPC inserts (content, embedding, metadata)
  → File stored in Supabase Storage
```

### Retrieval Pipeline
```
User asks question in chat:
  → CEO calls retrieve_knowledge tool
  → Embed query with same text-embedding-3-small
  → Parallel RPC calls:
      • match_documents(query_embedding, match_threshold=0.7, match_count=5)
      • search_documents_keyword(query, match_count=5)
      • match_memories(query_embedding, match_threshold=0.7, match_count=5)
  → Fusion: semantic (weight 0.7) + keyword (weight 0.3)
  → Merge, deduplicate, rerank by combined score
  → Return top-k results to CEO context
```

### Database Schema (`schemas/`)
- `01_tables.sql`: `users`, `companies`, `chat_sessions`, `chat_messages`, `documents`, `chat_memories`, `color_palettes`
- `02_functions.sql`: `match_documents`, `search_documents_keyword`, `match_memories` – PostgreSQL RPC functions with pgvector HNSW indexes
- `03_triggers.sql`: Automatic `updated_at` timestamp management

## Backend

### Structure
```
backend/
├── app.py              # FastAPI app, CORS, router registration
├── utils.py            # DB helpers (Supabase REST), auth helpers
├── logger_config.py    # RotatingFileHandler (10MB × 3), dual handlers
├── routers/
│   ├── auth.py         # POST /signup, /login (plaintext comparison)
│   ├── company.py      # POST /onboard-company, GET /company
│   ├── files.py        # POST /upload, GET /list-files, DELETE /delete-file
│   └── chat.py         # POST /chat, /chat/new, /chat/list, /chat/{id}/messages, DELETE /chat/{id}
├── agents/             # Agent implementations (see above)
├── tools/              # Tool definitions (mcq, retrieval, file ops)
├── RAG_Engine/         # rag.py, embed.py, chunking logic
├── evals/              # Test scripts per agent
└── schemas/            # Raw SQL migration files
```

### API Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/signup` | Create user (plaintext password) |
| POST | `/login` | Authenticate user |
| POST | `/onboard-company` | Create company profile (name, description, industry, tone) |
| GET | `/company` | Fetch company details |
| POST | `/api/files/upload` | Upload file (PDF, image, CSV, Excel, JSON, Parquet) |
| GET | `/api/files/list-files` | List company files |
| DELETE | `/api/files/delete-file` | Delete file |
| POST | `/api/chat` | Send message to CEO agent |
| POST | `/api/chat/new` | Create new chat session |
| GET | `/api/chat/list` | List user's chat sessions |
| GET | `/api/chat/{id}/messages` | Get messages for a session |
| DELETE | `/api/chat/{id}` | Delete chat session |

### Authentication Flow
- Password stored in database as plaintext (no hashing)
- On login, `authenticate_user()` compares raw strings
- On success, user metadata (id, email, company_id) is returned
- Client stores in `localStorage` and sends `user_id` as a query/form parameter
- No JWT, no HTTP-only cookies, no session expiry

## Frontend

### Structure
```
frontend/
├── app/
│   ├── page.tsx          # Landing page (835 lines) — hero, problem, solution, agents showcase, features, comparison, CTA, footer
│   ├── auth/page.tsx      # Auth page (277 lines) — login/signup toggle, brand panel, animated transitions
│   ├── onboarding/page.tsx # Onboarding wizard (421 lines) — 4-step form with progress bar
│   ├── dashboard/page.tsx  # Dashboard (824 lines) — sidebar nav, overview stats, drive grid, chat interface
│   └── globals.css        # Design system tokens, neumorphic cards, glass nav, animations
├── components/
│   ├── Chat.tsx           # Full chat component (617 lines) — message list, MCQ cards, typing indicator, session management
│   └── ...
└── ...
```

### Page Details

**Landing Page** (`/`): Animated hero with orbiting agent chips (orbiting icons for each agent role). Sections for problem/solution, how-it-works (5-step visual pipeline), agent cards (6 agents with role descriptions), feature grid, comparison table, and CTA. Responsive with mobile hamburger menu.

**Auth Page** (`/auth`): Split layout — left brand panel (desktop) or stacked (mobile). Animated form toggle between login/signup. Input validation, loading spinner, error/success toasts. Redirects to `/dashboard` on login, `/onboarding` on signup.

**Onboarding Wizard** (`/onboarding`): 4 steps — company name → description (max 500 words with counter) → industry (animated scroll selector) → brand tone (radio cards: Friendly/Professional/Witty). Progress bar, back/continue/finish buttons, animated transitions between steps.

**Dashboard** (`/dashboard`): Collapsible sidebar with 4 nav items — Overview (stats cards: files, storage, sessions; recent files grid; quick action buttons), Drive (file grid with type icons, upload/delete), Chat (full conversational UI with session sidebar), Settings (placeholder — "coming soon").

### Chat Component
- Renders message list with react-markdown + remark-gfm
- MCQ cards rendered as interactive HTML forms — checkboxes, custom text input, confirm button
- Typing indicator (bouncing dots animation) during agent processing
- Session management: create new, switch via sidebar, delete with confirmation dialog
- Auto-scroll to bottom on new messages

### Design System (`globals.css`)
- Tailwind v4 `@theme` custom tokens for colors, fonts, spacing
- Neumorphic card system with inset shadows and hover lifts
- Glass-morphism navigation with backdrop blur
- Grid background pattern and text gradient utilities
- Custom scrollbar, keyframe animations (fade-in, slide-up, orbit), reduced-motion media query support

## Code Sandbox

The Data Analyst agent uses **e2b** (`backend/agents/data_analyst.py`) for secure Python execution:

1. Agent receives file references from the CEO
2. Files are downloaded from Supabase Storage
3. Uploaded into an e2b sandbox instance
4. Agent generates a Python script (Pandas, Matplotlib, seaborn)
5. Script executes in the sandbox; stdout/stderr and any generated plot images are captured
6. Results are formatted into an executive summary with key findings, visualizations, and actionable recommendations
7. Sandbox is automatically torn down to prevent resource leaks

## Prompt System & Tool Registry

### CEO Tool Definitions (`backend/tools/`)
| Tool | File | Description |
|---|---|---|
| `Researcher` | `tools.py` (inline) | Delegates to Researcher agent, returns structured research |
| `Writer` | `tools.py` (inline) | Delegates to Writer agent for content generation |
| `CMO` | `tools.py` (inline) | Delegates to CMO Marketing agent |
| `Data Analyst` | `tools.py` (inline) | Delegates to Data Analyst with file references |
| `ask_mcq_for_user` | `mcq_tools.py` | Presents MCQ cards to user |
| `retrieve_knowledge` | `retrival_tool.py` | Queries RAG engine for company documents |
| `get_chat_memories` | `retrival_tool.py` | Retrieves relevant past conversation memories |
| `see_drive_files` | `file_tools.py` | Lists files in company drive |
| `create_doc_description` | `file_tools.py` | Generates description for uploaded files |

### Prompt Engineering
All agent prompts follow a structured format:
- **Persona definition**: Role, expertise, tone, constraints
- **Tool descriptions**: Name, parameters, usage guidelines, and examples
- **Output formatting rules**: Markdown structure, required sections, length limits
- **Quality constraints**: Judge review threshold (≥ 8/10), revision instructions
- **Edge case handling**: Missing information, ambiguous requests, error recovery

Each agent prompt is defined as a module-level constant (e.g., `RESEARCHER_SYSTEM_PROMPT`, `WRITER_SYSTEM_PROMPT`) in the respective agent file.

## Logging & Observability

- **`backend/logger_config.py`**: Dual-handler setup
  - `RotatingFileHandler`: 10 MB per file, 3 backup copies, DEBUG+ level
  - `StreamHandler`: Console output at INFO+ level
- Logs capture: agent decisions, tool calls, RAG queries, API requests/responses, file operations, sandbox execution, errors/warnings
- All agents and tools use `logger.info()` / `logger.debug()` / `logger.error()` with consistent format: `[timestamp] [LEVEL] module: message`
- Log file location: `logs.log` in project root

## Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | Python 3.12+, LangChain (custom `create_agent` wrapper) |
| Backend | FastAPI, Uvicorn |
| Database | Supabase PostgreSQL 15 + pgvector (HNSW indexes) |
| Storage | Supabase Storage (S3-compatible) |
| Frontend | Next.js 16.2.9, React 19.2.4, Tailwind CSS v4 |
| UI Animation | framer-motion 12.42.0 |
| Icons | lucide-react 1.21.0 |
| Markdown | react-markdown 10.1.0, remark-gfm 4.0.1 |
| LLM Provider | OpenRouter (DeepSeek, GPT-OSS, Gemma, GLM, text-embedding-3-small) |
| Web Search | Tavily Search API |
| Market Data | SerpAPI (Google Trends, Google News, Google Shopping) |
| Vector Search | Supabase pgvector (cosine similarity + keyword fusion) |
| Code Sandbox | e2b (e2b-code-interpreter) |
| PDF Extraction | PyMuPDF (fitz) |
| OCR | Pillow + custom image processing |

## Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- Supabase project (PostgreSQL + Storage)
- API keys: Tavily, OpenRouter, SerpAPI, e2b

### Installation
1. Clone the repo
2. Install Python deps: `pip install -r requirements.txt`
3. Install frontend deps: `cd frontend && npm install`
4. Copy `.env.example` to `.env` and fill in your API keys (Tavily, OpenRouter, SerpAPI, Supabase URL + service role key, e2b)
5. Run Supabase SQL migrations from `backend/schemas/` in order (01, 02, 03)
6. Start backend: `uvicorn backend.app:app --reload` (default: `http://localhost:8000`)
7. Start frontend: `cd frontend && npm run dev` (default: `http://localhost:3000`)


## Status

Functional end-to-end prerelease (v0.7.2). The core chat loop, multi-agent system, RAG pipeline, file management, and onboarding flow are operational. Known gaps:
- Settings page is a placeholder
- Graphic Designer agent module exists but is not wired to the CEO's tool registry
- Image generation tool references a commented-out API key
- No automated test suite — only ad-hoc eval scripts
- Passwords stored in plaintext
- CORS hardcoded to localhost

## Contributing

Anyone can contribute. Please follow the agent architecture rules in [`Agents_rules.md`](Agents_rules.md) and maintain code style consistency with the existing codebase. If everything looks good, we will accept the PR.
