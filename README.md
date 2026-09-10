# Co_Founder — AI Co-Founder Platform v0.9.18

A full-stack multi-agent platform that acts as an early founding team. A founder chats with a CEO orchestrator, which delegates to specialist agents for research, writing, marketing, data analysis, and design.

> **For technical details, see [`docs/technical.md`](docs/technical.md)** — agent system, RAG pipeline, backend APIs, billing, frontend, observability, benchmarks, and performance work.

## Overview

AI Co-Founder simulates a startup team around a CEO agent. A founder describes the business through chat; the CEO decides whether to answer directly, ask a clarification question, retrieve company knowledge, or delegate to a specialist.

This release includes the Dockerized stack, async Kafka persistence, effort-based routing (Flash / Mid / Max), real-time streaming with buffered WebSocket observability, Google + email auth, live Razorpay billing, and Instagram plugin integration.

Key highlights:
- **CEO orchestration** — one LangChain agent routes across 8 tools to specialist sub-agents, with MCQ clarifications and LLM-as-judge refinement.
- **Company knowledge** — RAG over uploaded docs (semantic + keyword fusion) plus separate chat-memory retrieval.
- **Live observability** — token-by-token streaming and agent trace timeline in chat, with buffered replay so traces never go missing.
- **Real billing** — Razorpay Checkout, HMAC verification, idempotent credit top-ups (1 credit = ₹1), invoice history.
- **Evaluated** — RAG 95.00% pass rate; CEO e2e: 27 runs / 81 judge verdicts (see `docs/eval_report.md`).

## Architecture

![System Architecture](docs/co_founder-runtime.webp)

## Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | Python 3.13+, LangChain (`create_agent` factory) |
| Backend | FastAPI, Uvicorn |
| Caching | Redis |
| Message Bus | Apache Kafka (KRaft) |
| Vector Search | Supabase pgvector (HNSW) |
| LLM Provider | OpenRouter (DeepSeek, GLM, GPT-OSS, Gemma) |
| Web Search | Tavily |
| Market Data | SerpAPI (Trends, News, Shopping) |
| Code Sandbox | e2b |
| Database / Storage | Supabase Postgres + Storage |
| Payments | Razorpay Standard Checkout |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Three.js / GSAP / framer-motion |

## Docs

| File | What it covers |
|---|---|
| [`docs/technical.md`](docs/technical.md) | Full technical details — agents, RAG, backend, billing, frontend, observability, benchmarks |
| [`Agents_rules.md`](Agents_rules.md) | Agent cooperation rules — CEO ownership, delegation contract, system prompts |
| [`release_notes.md`](release_notes.md) | Version changelog — what changed in each release |
| [`docs/eval_report.md`](docs/eval_report.md) | CEO agent e2e evaluation — 27 runs, 81 judge verdicts, findings |

## Status

Functional end-to-end production test (v0.9.18) — chat loop, multi-agent system, RAG, billing, auth, and plugins are operational. Known gaps (slow image gen, Supabase free-tier latency) are tracked in [`docs/technical.md`](docs/technical.md#status).

## License

Copyright (C) 2026 Karthikeya Kumar

Licensed under GNU Affero General Public License v3.0 (AGPL-3.0). See LICENSE for details.
