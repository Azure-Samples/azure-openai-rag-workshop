# Ingestion Service
Fastify service for document ingestion (PDF upload) and embedding generation into Azure AI Search or Qdrant.

## Overview
- Port: 3001.
- Upload Endpoint: `/documents` (multipart form field `file`).
- Responsibilities: Accept PDF files, parse (pdf-parse), produce embeddings via Azure OpenAI, upsert vectors into selected store.

## Key Dependencies
- Fastify + plugins (`@fastify/multipart`, `@fastify/cors`, `@fastify/autoload`, `@fastify/sensible`).
- PDF parsing: `pdf-parse`.
- LangChain / Vector: `@langchain/community`, `@langchain/qdrant`, `@azure/search-documents`, `@azure/identity`.
- Env mgmt: `dotenv`.

## Scripts
```
npm run dev         # Build + watch + start (debug)
npm run build       # Compile TypeScript
npm start           # Production start
npm run docker:build  # docker build --tag ingestion --file ./Dockerfile ../..
npm run docker:run    # Run container exposing 3001
npm run clean       # Remove dist
```

## Environment Variables
- AZURE_OPENAI_API_* (endpoint, version, deployment names, model names)
- AZURE_AISEARCH_ENDPOINT or QDRANT_URL (mutually exclusive usage)
- AZURE_CLIENT_ID (managed identity for auth)

## Data Flow
1. Receive PDF via multipart.
2. Extract text (pdf-parse).
3. Chunk + embed (LangChain embeddings with specified model).
4. Upsert to chosen vector DB.

## Coding Guidelines
- Keep parsing & chunking modular (add new file format handlers as separate utilities rather than modifying core handler heavily).
- Validate file type (if adding more formats) before processing.

## Security
- Limit accepted content types to PDFs (enforce if extending) to reduce attack surface.
- Managed identity for Azure resources.

## Troubleshooting
- 415 / parsing errors: Ensure uploaded file is a valid PDF.
- Empty vector store: Check logs for embedding errors (model deployment names env mismatch).

This file overrides root `AGENTS.md` for context within `src/ingestion`.
