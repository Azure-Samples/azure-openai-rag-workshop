# Frontend (Chat UI)
Lit + Vite web client providing the chat interface to the backend RAG API.

## Overview
- Dev server: Vite (port 8000).
- Build: Outputs to `dist` (consumed by Azure Static Web Apps on deploy).
- API Proxy (dev): `/chat` proxied to `http://127.0.0.1:3000` via `vite.config.ts`.
- Runtime backend base URL injected at build through env var `BACKEND_API_URI` -> `VITE_BACKEND_API_URI`.

## Key Dependencies
- `lit` (web components).
- `@microsoft/ai-chat-protocol` for standardized chat payloads.

## Scripts
```
npm run dev     # Start Vite dev server on :8000
npm run build   # Production build (with code splitting and vendor chunk)
npm run watch   # Rebuild on changes (non-minified)
npm run lint    # lit-analyzer
npm run clean   # Remove dist
```

## Coding Guidelines
- Use Lit reactive properties & templates; keep components small and cohesive.
- Avoid introducing global state libraries unless necessary; prefer context via custom elements.
- Keep environment-specific values behind `import.meta.env` (already handled for backend URL).

## Performance
- Vite config manually chunks vendor modules. When adding new large deps, confirm chunking still optimal.
- Source maps enabled; remove only if size constraints arise.

## Security
- Do not expose secrets; only pass public endpoints through `VITE_*` env variables.
- Sanitize any dynamic content rendered from AI responses if adding rich rendering beyond plain text.

## Troubleshooting
- Wrong API URL: Confirm build hook in root `azure.yaml` sets `BACKEND_API_URI` before `npm run build` for deployment.
- CORS errors: Ensure backend allowed origins include deployed Static Web App URI.

This file overrides root `AGENTS.md` for context within `src/frontend`.
