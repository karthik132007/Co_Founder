# Co_Founder — v0.7.2 (Prerelease)

> **📘 For complete system context and understanding, please refer to [`Agents_rules.md`](Agents_rules.md) before contributing or making changes.**

## Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [What's Built](#whats-built)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Status](#status)
- [Contributing](#contributing)

## Overview

Many aspiring entrepreneurs have great business ideas but lack expertise in areas such as technology, marketing, finance, and business strategy. Hiring a full team is often expensive and inaccessible for early-stage founders. AI Co-Founder addresses this problem through a multi-agent AI system where a CEO orchestrator agent coordinates specialized agents for research, writing, marketing, data analysis, and quality review. By working together through a shared knowledge base (RAG + chat memory), these agents help founders make decisions, automate tasks, and manage their businesses efficiently from a single platform.

## Architecture

```
User → FastAPI Backend → main.py (Orchestrator) → CEO Agent
                                                      ├── Researcher Agent (Tavily web search)
                                                      ├── Writer Agent (content generation)
                                                      ├── CMO Marketing Agent (market trends, SEO)
                                                      ├── Data Analyst Agent (EDA, Python sandbox)
                                                      ├── Judge Agent (quality review, score ≥8/10)
                                                      └── Utility Agents (chat memory, descriptions, titles)
                                                      └── RAG Engine (hybrid semantic + keyword search)
```

## What's Built

### Multi-Agent System
- **CEO Agent** — plans, delegates to specialists, merges results; uses tools for research, writing, marketing, data analysis, and knowledge retrieval. Asks clarifying questions via interactive multiple-choice cards only when the answer materially changes the plan (max 1–2 questions, supports multi-select).
- **Researcher Agent** — web research via Tavily with reflection loop (Judge scores drafts, revises if < 8/10)
- **Writer Agent** — polished content from CEO-provided context with same reflection quality loop
- **Judge Agent** — LLM-as-Judge scoring outputs (1–10) with critique and suggestions
- **CMO Marketing Agent** — market trends (Google Trends/News/Shopping via SerpAPI), web search, content extraction
- **Data Analyst Agent** — performs EDA and data-driven analysis on company files (CSV, Excel, JSON, Parquet) by running Python in a secure e2b code sandbox. Produces executive summaries with key findings, visualizations, and actionable business recommendations.
- **Utility Agents** — chat memory extraction, document/image description, session title generation

### Interactive Clarifications (MCQ)
- CEO uses `ask_mcq_for_user` tool to present clickable multiple-choice questions in chat
- **Smart limits** — asks at most 1–2 high-impact questions per decision point; infers reasonable defaults for everything else
- **Multi-select** — when multiple options make sense (e.g. goals, channels), users can select several at once via checkboxes, then confirm at once
- Custom answer input for responses outside the predefined options
- Locks after selection; answer is sent back as a user message for the CEO to continue

### RAG Engine
- Semantic chunking (LangChain SemanticChunker)
- Embedding generation via OpenRouter (`text-embedding-3-small`)
- Hybrid search: semantic (0.7) + keyword (0.3) fusion with merge-and-rerank
- Concurrent document + chat memory retrieval
- Supabase pgvector RPC functions for vector and keyword search

### Backend (FastAPI + Supabase)
- User authentication (signup/login)
- Company onboarding with tone selection
- File upload pipeline: OCR/extract → describe → semantic chunk → embed → index → cloud storage
- Dashboard stats and file management
- Chat with session history, long-term memory, session deletion, and clarification request responses
- Supabase PostgreSQL + Storage integration

### Frontend (Next.js 16 + React 19 + Tailwind v4)
- Landing page (hero, problem, solution, agents showcase, features, comparison, CTA)
- Authentication page (login/signup)
- Onboarding wizard (4-step: name, description, industry, tone)
- Dashboard with sidebar navigation (Overview, Drive, Chat, Settings)
- Sidebar chat history with session switching, new-chat creation, and session deletion (trash icon on hover with confirmation dialog)
- Full chat interface with markdown rendering, session management, typing indicators, and interactive MCQ cards
- Custom neumorphic design system with framer-motion animations

### Code Sandbox (e2b)
- Secure Python execution environment for the Data Analyst agent
- File upload from cloud storage into sandbox for analysis
- Automatic sandbox teardown after each task to prevent resource overuse

### Logging
- Centralized `logger_config.py` with `RotatingFileHandler` (10MB, 3 backups) — writes DEBUG+ to `logs.log` in project root
- Console handler shows INFO+ in real time; file handler captures DEBUG+ for post-mortem analysis
- All agents, tools, RAG operations, API endpoints, file ops, and sandbox executions log key actions
- Warnings and exceptions logged across the entire codebase

### Evaluation
- Test scripts for Researcher, Writer, CMO, Chat Memory, Data Analyst, and RAG end-to-end
- Generated test reports with real output examples

## Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | Python, LangChain |
| Backend | FastAPI, Supabase (PostgreSQL + REST + Storage) |
| Frontend | Next.js 16.2.9, React 19, Tailwind v4, framer-motion |
| LLMs | OpenRouter (DeepSeek, GPT-OSS, Gemma, GLM, text-embedding-3-small) |
| Search | Tavily (web), SerpAPI (Google Trends/News/Shopping) |
| Vector DB | Supabase pgvector (semantic + keyword search) |
| Code Sandbox | e2b (isolated Python execution for data analysis) |

## Setup

1. Install Python deps: `pip install -r requirements.txt`
2. Install frontend deps: `cd frontend && npm install`
3. Copy `.env` and fill in your API keys (Tavily, OpenRouter, SerpAPI, Supabase, e2b)
4. Start backend: `uvicorn backend.app:app --reload`
5. Start frontend: `cd frontend && npm run dev`

## Status

Functional end-to-end prerelease. Active development — some agent tools and UI sections are placeholders.

## Contributing

Anyone can contribute. Please follow the agent architecture rules in [`Agents_rules.md`](Agents_rules.md) and maintain code style consistency with the existing codebase. If everything looks good, we will accept the PR.
