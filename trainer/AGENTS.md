# Trainer Proxy & Materials
Support assets and proxy service enabling workshop trainers to share a single Azure OpenAI instance with attendees.

## Overview
- Proxy service exposes Azure OpenAI-compatible endpoints; attendees point their environment to proxy URL before provisioning (`AZURE_OPENAI_URL`).
- Slides + workshop content referenced (hosted externally) but source for slides/workshop lives under `docs/` at repo root.

## Key Files
- `azure.yaml`: Defines single `openai-proxy` Container App service.
- `Dockerfile`: Multi-stage build for Fastify proxy.
- `package.json`: Fastify + http proxy dependencies.
- `README.md`: Deployment & usage instructions for proxy and capacity guidance.

## Scripts
```
npm run dev     # Build + watch + start (debug)
npm run build   # Compile TypeScript
npm start       # Production fastify start
npm run docker:build  # docker build --tag proxy .
npm run docker:run    # Run on :3000
```

## Deployment (Proxy)
```
azd auth login
azd env new openai-trainer
azd env set AZURE_OPENAI_LOCATION <location?>   # default swedencentral
azd env set AZURE_OPENAI_CAPACITY <tokens_per_minutes?>  # default 5 (increase for class size)
azd up
```
Share resulting Container App URL; attendees set:
```
azd env set AZURE_OPENAI_URL <proxy_url>
```

## Constraints / Considerations
- Low default capacity to avoid quota deployment failures; adjust after deployment for > minimal class sizes (e.g., 200 TPM for ~50 attendees suggested in README).
- Future TODO (root `TODO`): event key restriction — do not implement unless requested.

## Security
- Treat proxy endpoint as semi-public once shared; consider adding auth or key gating if extending.

## Troubleshooting
- Throughput errors: Increase model capacity in Azure OpenAI portal and redeploy or update deployment.
- Attendee failures: Verify they set `AZURE_OPENAI_URL` before `azd up`.

This file overrides root `AGENTS.md` within `trainer/`.
