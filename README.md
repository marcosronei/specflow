# ⚡ SpecFlow

[![CI](https://github.com/marcosronei/specflow/actions/workflows/ci.yml/badge.svg)](https://github.com/marcosronei/specflow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange.svg)](https://pnpm.io)

> **The all-in-one Spec-Driven Development platform** — from spec to shipped code, with GitHub Copilot and Claude Code, all in your local environment.

```
┌─────────────────────────────────────────────────────────────────┐
│                        ⚡ SPECFLOW                               │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │📝 SPEC   │→ │🗺️ PLAN   │→ │🤖 EXECUTE│→ │🔍 REVIEW    │    │
│  │          │  │          │  │          │  │              │    │
│  │ Define   │  │ Plan     │  │ AI Agent │  │ Diff, PR,    │    │
│  │ what to  │  │ how to   │  │ executes │  │ Comments &   │    │
│  │ build    │  │ build it │  │ the tasks│  │ Merge        │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🤔 What is SpecFlow?

SpecFlow is a **local-first, fullstack platform** that unifies the entire Spec-Driven Development (SDD) workflow in a single beautiful interface. Inspired by `github/spec-kit`, `Fission-AI/OpenSpec`, and `BloopAI/vibe-kanban`, SpecFlow combines the best of all three:

| Pillar | Description | Inspired by |
|--------|-------------|-------------|
| 📝 **Spec** | Define WHAT to build — requirements, user stories, acceptance criteria | spec-kit, OpenSpec |
| 🗺️ **Plan** | Define HOW to build — architecture, data model, API spec, task breakdown | spec-kit |
| 🤖 **Execute** | Run AI agents (Copilot + Claude) on isolated git worktrees | vibe-kanban |
| 🔍 **Review** | Inspect diffs, leave comments, create PRs, push to GitHub | vibe-kanban |

## ✨ Features

| Module | Features |
|--------|----------|
| **Projects** | Create & manage projects with local git repos |
| **Features** | Organize work into features with full SDD lifecycle |
| **Spec Editor** | Rich Markdown editor with AI generation |
| **Plan Editor** | Technical planning with data model & API spec |
| **Kanban Board** | Drag-and-drop task management with DnD Kit |
| **AI Agents** | GitHub Copilot + Claude Code integration |
| **Git Integration** | Worktrees, branches, commits, push |
| **Diff Viewer** | Visual code review with inline comments |
| **Memory** | Per-project AI memory/context |

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/marcosronei/specflow.git
cd specflow
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and add your API keys
```

### 3. Start everything

```bash
docker compose up -d
```

### 4. Open SpecFlow

- **Web App:** http://localhost:3000
- **API:** http://localhost:3001
- **AI Service:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **State** | Zustand |
| **Router** | React Router v7 |
| **HTTP** | TanStack Query + Axios |
| **Kanban** | @dnd-kit/core + @dnd-kit/sortable |
| **Editor** | TipTap |
| **Diff Viewer** | react-diff-viewer-continued |
| **API Gateway** | Node.js 22, Fastify v5, TypeScript |
| **ORM** | Prisma + PostgreSQL |
| **AI Service** | Python 3.12, FastAPI, Uvicorn |
| **AI SDKs** | Anthropic SDK (Claude), GitHub Copilot API |
| **Git** | simple-git |
| **Monorepo** | Turborepo + pnpm workspaces |
| **Containers** | Docker + Docker Compose |
| **CI** | GitHub Actions |

## 📁 Project Structure

```
specflow/
├── apps/
│   ├── web/              # React 19 frontend (port 3000)
│   └── api/              # Fastify API gateway (port 3001)
├── services/
│   └── ai/               # Python FastAPI AI service (port 8000)
├── packages/
│   ├── database/         # Prisma schema + PostgreSQL
│   ├── shared-types/     # Shared TypeScript types
│   └── ui/               # Design system components
├── docker-compose.yml    # Production Docker setup
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # pnpm workspaces
```

## 🗺️ Roadmap

### MVP (Current)
- [x] Monorepo structure with Turborepo + pnpm
- [x] React frontend with routing and layout
- [x] Fastify API with CRUD routes (mock)
- [x] FastAPI AI service with Claude integration
- [x] Prisma schema with all models
- [x] Shared TypeScript types
- [x] Docker Compose setup
- [x] GitHub Actions CI

### v1.0
- [ ] Full CRUD with PostgreSQL via Prisma
- [ ] AI-powered spec generation
- [ ] AI-powered plan generation
- [ ] Task generation from plan
- [ ] Kanban board with DnD
- [ ] Git worktree per task
- [ ] Diff viewer with comments

### v2.0
- [ ] Claude Code integration for task execution
- [ ] GitHub Copilot API integration
- [ ] PR creation and merge flow
- [ ] Project memory system
- [ ] Multi-agent parallel execution
- [ ] Workspace isolation

## 💡 Inspirations

- [github/spec-kit](https://github.com/github/spec-kit) — The gold standard for SDD tooling
- [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) — Lightweight SDD framework
- [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban) — AI agent kanban execution

## 📄 License

MIT © [marcosronei](https://github.com/marcosronei)
Unified Spec-Driven Development platform — spec, plan, execute and review in one place
