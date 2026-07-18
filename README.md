# Co_Founder — v0.6 (Prerelease)

## Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [What's Built](#whats-built)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Status](#status)
- [Contributing](#contributing)

## Overview

Many aspiring entrepreneurs have great business ideas but lack expertise in areas such as technology, marketing, finance, and business strategy. Hiring a full team is often expensive and inaccessible for early-stage founders. AI Co-Founder addresses this problem through a multi-agent AI system where a CEO orchestrator agent coordinates specialized agents for research, writing, marketing, and quality review. By working together through a shared knowledge base (RAG + chat memory), these agents help founders make decisions, automate tasks, and manage their businesses efficiently from a single platform.

## Architecture

```
User → FastAPI Backend → main.py (Orchestrator) → CEO Agent
                                                      ├── Researcher Agent (Tavily web search)
                                                      ├── Writer Agent (content generation)
                                                      ├── CMO Marketing Agent (market trends, SEO)
                                                      ├── Judge Agent (quality review, score ≥8/10)
                                                      └── Utility Agents (chat memory, descriptions, titles)
                                                      └── RAG Engine (hybrid semantic + keyword search)
```

## What's Built

### Multi-Agent System
- **CEO Agent** — plans, delegates to specialists, merges results; uses tools for research, writing, marketing, and knowledge retrieval
- **Researcher Agent** — web research via Tavily with reflection loop (Judge scores drafts, revises if < 8/10)
- **Writer Agent** — polished content from CEO-provided context with same reflection quality loop
- **Judge Agent** — LLM-as-Judge scoring outputs (1–10) with critique and suggestions
- **CMO Marketing Agent** — market trends (Google Trends/News/Shopping via SerpAPI), web search, content extraction
- **Utility Agents** — chat memory extraction, document/image description, session title generation

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
- Chat with session history and long-term memory
- Supabase PostgreSQL + Storage integration

### Frontend (Next.js 16 + React 19 + Tailwind v4)
- Landing page (hero, problem, solution, agents showcase, features, comparison, CTA)
- Authentication page (login/signup)
- Onboarding wizard (4-step: name, description, industry, tone)
- Dashboard with sidebar navigation (Overview, Drive, Chat, Settings)
- Full chat interface with markdown rendering, session management, typing indicators
- Custom neumorphic design system with framer-motion animations

### Evaluation
- Test scripts for Researcher, Writer, CMO, Chat Memory, and RAG end-to-end
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

## Setup

1. Install Python deps: `pip install -r requirements.txt`
2. Install frontend deps: `cd frontend && npm install`
3. Copy `.env` and fill in your API keys (Tavily, OpenRouter, SerpAPI, Supabase)
4. Start backend: `uvicorn backend.app:app --reload`
5. Start frontend: `cd frontend && npm run dev`

## Status

Functional end-to-end prerelease. Active development — some agent tools and UI sections are placeholders.

## Contributing

Anyone can contribute. Please follow the agent architecture rules in [`Agents_rules.md`](Agents_rules.md) and maintain code style consistency with the existing codebase. If everything looks good, we will accept the PR.
