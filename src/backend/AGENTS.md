# Backend Service (Chat RAG API)
Fastify + LangChain service providing chat responses augmented with document retrieval via Azure AI Search or Qdrant.

## Overview
- Entry: `src/app.ts` (exported via `package.json` exports).
- Port: 3000 (Docker & dev).
- Responsibilities: Accept chat requests, perform embedding + vector similarity, construct prompts with retrieved context, call Azure OpenAI (or provided OpenAI endpoint).
- Vector Source: Conditional (Azure AI Search or Qdrant) depending on deployment parameters (`useQdrant`).

## Key Dependencies
- Fastify ecosystem (`fastify`, `@fastify/*`).
- LangChain: `langchain`, `@langchain/core`, `@langchain/openai`, `@langchain/community`, `@langchain/qdrant`.
- Azure SDK: `@azure/search-documents`, `@azure/identity`.
- Token utilities: `@dqbd/tiktoken`.
- Env mgmt: `dotenv` (ensure it loads early if used in code extensions).

## Scripts
```
npm run dev        # Build + watch + start with pretty logs (debug level)
npm run build      # tsc -> dist
npm start          # Production (fastify start -l info dist/app.js)
npm run docker:build  # docker build --tag backend --file ./Dockerfile ../..
npm run docker:run    # Runs container exposing 3000
npm run clean      # Remove dist
```

## Environment Variables (Injected via Bicep/azd)
Expect (subset):
- AZURE_OPENAI_API_ENDPOINT / *_MODEL / *_DEPLOYMENT_NAME / *_VERSION
- AZURE_AISEARCH_ENDPOINT (empty when using Qdrant)
- QDRANT_URL (empty when using Azure AI Search)
- AZURE_CLIENT_ID (managed identity)

Code should:
- Branch feature logic based on presence/absence of `QDRANT_URL`.
- Avoid hardcoding model names; use env.

## Coding Guidelines
- Use existing TypeScript config & ES modules.
- Keep Fastify plugins modular (autoload pattern is present). Add new routes/plugins under standard directories (match existing layout when extending).
- Prefer async/await, minimal side effects in global scope.

## Testing / Verification (Manual)
1. Start dependency (ingestion) and ensure documents ingested.
2. `curl http://localhost:3000/chat` (exact routes depend on existing implementation—inspect routes before extending).

## Performance Considerations
- Minimize unnecessary embedding calls (reuse embeddings where possible if caching layer is introduced—none exists yet; do not add without request).
- Token counting helps with prompt size control.

## Security
- CORS restricted to frontend origin (set at deploy). Preserve origin checks when modifying.
- Managed identity for Azure OpenAI / Search; do not introduce API key storage unless explicitly required.

## Extension Points
- Middleware: Add via Fastify plugin under plugins folder.
- Retrieval strategies: Introduce new retriever module wrapping Azure AI Search or Qdrant queries; select via env gating.

## Troubleshooting
- Missing search results: Confirm `AZURE_AISEARCH_ENDPOINT` or `QDRANT_URL` not both empty.
- Auth errors: Validate managed identity role assignments completed (Bicep handles; during early provisioning there may be propagation delay).

This file overrides root `AGENTS.md` for context within `src/backend`.
