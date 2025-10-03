# Azure OpenAI RAG Workshop (Node.js)
A monorepo sample + workshop showing how to build a Retrieval‑Augmented Generation (RAG) chat experience using LangChain.js with Azure OpenAI (optionally Qdrant) and expose it through a Fastify backend, an ingestion Fastify service, and a Lit + Vite frontend. Infrastructure is provisioned and deployed to Azure using `azd` (Azure Developer CLI) with Azure Container Apps, Azure Static Web Apps, Azure AI Search (or Qdrant), and optional OpenAI proxy for training scenarios.

## Overview
- Purpose: Educational reference and workshop material for building a production‑minded RAG chat application on Azure.
- Audience: Developers learning Azure OpenAI + vector search patterns (Azure AI Search or Qdrant), workshop trainers, contributors.
- Architecture (core runtime):
  - Frontend (Static Web App): Lit web components served via Vite build; proxies `/chat` to backend during local dev.
  - Backend API (Container App): Fastify service orchestrating chat + retrieval via LangChain, Azure OpenAI (or provided OpenAI endpoint), Azure AI Search or Qdrant for vector retrieval.
  - Ingestion API (Container App): Fastify service handling PDF uploads and embedding ingestion into chosen vector store.
  - (Optional) Qdrant (Container App) or Azure AI Search (managed) selected via `useQdrant` parameter.
  - Trainer Proxy (separate project in `trainer/`): Fastify reverse proxy to share a single Azure OpenAI instance with attendees.
  - Observability: Azure Monitor / Application Insights via Bicep modules.
- Project layout (selected):
  - `src/frontend`: Web UI (Lit, Vite).
  - `src/backend`: Chat + RAG API (Fastify + LangChain + OpenAI + Search/Qdrant).
  - `src/ingestion`: Document ingestion API (Fastify) + PDF parsing.
  - `infra`: Bicep templates (`main.bicep`, parameters, core modules) for full environment.
  - `scripts`: Helper scripts (PDF ingestion upload).
  - `trainer`: Workshop trainer proxy & material references.
  - `docs`: Workshop and slide assets.
  - Root `package.json`: Defines npm workspaces and shared tooling.

## Key Technologies and Frameworks
- Language: TypeScript (Node.js 20+, npm 10+).
- Backend / Ingestion / Proxy: Fastify, Fastify CLI, Fastify plugins (cors, sensible, autoload, multipart, http-proxy).
- RAG / AI: LangChain.js (`@langchain/*`, `langchain`), Azure OpenAI (or custom endpoint), token counting (`@dqbd/tiktoken`).
- Vector Stores: Azure AI Search (`@azure/search-documents`) or Qdrant (`@qdrant/qdrant-js`, `@langchain/qdrant`).
- Frontend: Vite, Lit, custom elements.
- Infra / Deployment: Azure Developer CLI (`azd`), Bicep, Azure Container Apps, Azure Static Web Apps, Managed Identities, Application Insights, Log Analytics.
- Tooling: ESLint (plugins: import, n, unicorn, @typescript-eslint), Prettier, concurrently, rimraf, TypeScript compiler.
- Containerization: Dockerfiles per service (backend, ingestion, trainer), multi-stage builds.

## Constraints and Requirements
- Node.js >= 20, npm >= 10 (enforced via `engines`).
- Monorepo with npm workspaces: `src/ingestion`, `src/backend`, `src/frontend`.
- Azure subscription with Azure OpenAI access (or external OpenAI endpoint via `openAiUrl`).
- Environment provisioning and deployment handled by `azd up` referencing `azure.yaml` + Bicep templates.
- Vector DB choice controlled by parameter `useQdrant` (Bicep). If false => Azure AI Search; if true => Qdrant Container App + identity.
- Model + deployment parameters externalized in `main.parameters.json` (e.g., `chatModelName`, `embeddingsModelName`, versions, capacities, free tier flags).
- Managed Identity required (free search SKU unsupported) — roles assigned in Bicep (`role.bicep` modules) for OpenAI and Search.
- Local dev uses environment variables loaded via `azd env get-values` (scripts reference). In docker-compose local mode, Qdrant may run at `http://qdrant:6333`.

## Challenges and Mitigation Strategies
- Multi-service coordination: Use npm workspaces and root scripts invoking scoped scripts via `concurrently`.
- Environment variable drift: Regenerate `.env` after `azd provision` via postprovision hook (`azd env get-values > .env`).
- Vector store abstraction: Both Azure AI Search and Qdrant dependencies included — ensure conditional logic in code respects `useQdrant` flag (code agents should not assume only one path).
- Limited quotas (trainer scenario): Trainer proxy in `trainer/` allows shared OpenAI usage; capacity parameters can be tuned (`chatDeploymentCapacity`, `embeddingsDeploymentCapacity`).

## Development Workflow
Root scripts (`package.json`):
- Start backend + frontend concurrently:
  - `npm start` (invokes `concurrently "npm:start:*" --kill-others`).
  - `start:frontend` => `npm run dev --workspace=frontend` (Vite dev server, default port 8000).
  - `start:backend` => `npm run dev --workspace=backend` (Fastify dev, port 3000).
- Ingestion service (not auto-started by root): `npm run dev --workspace=ingestion` (Fastify dev, port 3001).
- Build all workspaces: `npm run build`.
- Clean all: `npm run clean`.
- Lint: `npm run lint`; Fix: `npm run lint:fix`.
- Format: `npm run format`.
- Docker build (all that implement `docker:build`): `npm run docker:build`.

Per service notable scripts:
- Backend (`src/backend/package.json`): `dev`, `build`, `start`, `docker:build`, `docker:run`, `clean`.
- Ingestion (`src/ingestion/package.json`): same pattern (port 3001), plus multipart upload handling.
- Frontend (`src/frontend/package.json`): `dev`, `build`, `watch`, `lint`, `clean`.
- Trainer proxy (`trainer/package.json`): similar Fastify script set.

Local ingestion helper script (after services running):
```
./scripts/ingest-data.sh
```
Uploads PDFs (`data/*.pdf`) to ingestion API (defaults to `http://localhost:3001`).

Deployment (Azure):
```
azd auth login
azd up
```
Outputs URIs and environment variables (captured into `.env` via postprovision hook). Clean up with:
```
azd down --purge
```

## Infrastructure Notes
- Defined in `infra/main.bicep` + supporting modules under `infra/core/**`.
- Subscription-scope deployment creates resource group, container apps env, registry, static web app, optional search service, optional Qdrant, OpenAI resource (unless `openAiUrl` provided), identities, role assignments, and monitoring stack.
- Key outputs surfaced (e.g., `BACKEND_API_URI`, `INGESTION_API_URI`, `FRONTEND_URI`, `QDRANT_URL`, `AZURE_OPENAI_API_ENDPOINT`).
- Parameterization via `main.parameters.json` referencing AZD environment variables.
- `azure.yaml` ties logical services (frontend static web app build hook sets `BACKEND_API_URI`).
- Post-up hook auto-runs ingestion script (PowerShell or Bash variant).

## Coding Guidelines
- TypeScript strictness implied (check `tsconfig` in each service; agents should preserve module resolution and ES module usage).
- Use ES modules (`"type": "module"`).
- Maintain Prettier formatting (config embedded in root `package.json`).
- Lint with existing ESLint plugins; do not introduce new global dependencies without necessity.
- Keep service Dockerfiles multi-stage minimal and aligned with Node 20 Alpine base.
- Avoid duplicating logic between backend and ingestion — factor shared utilities if patterns recur (currently none specified; create new shared workspace only if needed).

## Security Considerations
- Managed Identities used for Azure resources; local auth disabled for certain services (`disableLocalAuth: true` in Bicep for OpenAI/Search when created).
- Environment variables contain service endpoints and model names — do not commit secrets (no API keys are stored when using managed identity).
- PDF upload endpoint (`/documents`) handles multipart; enforce size/content checks if extending (currently not detailed here, so preserve existing behavior).
- CORS: Backend/ingestion use `@fastify/cors`; ensure allowed origins include deployed frontend (Bicep sets `allowedOrigins`).
- Trainer proxy: Shares OpenAI capacity; treat as controlled-access (future task in TODO mentions adding event key restriction).

## Debugging and Troubleshooting
- If local services fail to start concurrently, run each individually to isolate (`npm run dev --workspace=backend`).
- Vector backend selection issues: Verify `useQdrant` parameter in azd environment and ensure Qdrant Container App deployed (or Azure AI Search endpoint present in outputs).
- Ingestion not populating data: Confirm `INGESTION_API_URI` and that PDF curl uploads return 2xx. Re-run ingestion script after redeploy.
- Frontend API base: Logged at Vite startup (`Using chat API base URL:`) sourced from `BACKEND_API_URI` passed via build hook.

---
Closest project‑root `AGENTS.md` governs unless a subdirectory defines its own. See per‑service agent guides:
- `src/backend/AGENTS.md`
- `src/ingestion/AGENTS.md`
- `src/frontend/AGENTS.md`
- `trainer/AGENTS.md`
