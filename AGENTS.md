# AGENTS.md

## Project Overview

This is an Azure OpenAI RAG (Retrieval-Augmented-Generation) workshop project that demonstrates how to build a ChatGPT-like experience using LangChain.js and OpenAI language models. The application consists of three main services:

- **Backend**: Chat API built with Fastify that handles user queries using RAG
- **Frontend**: Web interface built with Lit for interacting with the chat API
- **Ingestion**: Document ingestion service for processing and indexing PDF documents

**Architecture**: Monorepo managed with NPM workspaces
**Technologies**: Node.js (>=20), TypeScript, Fastify, LangChain.js, Vite, Azure AI Search or Qdrant
**Deployment**: Azure Static Web Apps (frontend) + Azure Container Apps (backend/ingestion)

## Monorepo Structure

This is an NPM workspace monorepo with the following structure:

```
src/
├── backend/     # Chat API service (port 3000)
├── frontend/    # Web UI (port 8000)
└── ingestion/   # Document ingestion service (port 3001)
```

Root-level commands affect all workspaces. Use `--workspace=<name>` to target specific services.

## Setup Commands

### Prerequisites
- Node.js >= 20
- npm >= 10
- Docker (for local development with Qdrant)
- Azure CLI and Azure Developer CLI (`azd`) for Azure deployment

### Initial Setup
```bash
# Install dependencies for all workspaces
npm install

# Setup environment variables (creates .env file from Azure)
azd env get-values > .env
```

### Environment Variables
Create a `.env` file at the root with:
```
AZURE_OPENAI_API_ENDPOINT=<your-endpoint>
AZURE_OPENAI_API_DEPLOYMENT_NAME=<deployment-name>
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=<embeddings-deployment>
AZURE_AISEARCH_ENDPOINT=<search-endpoint>
# OR for local development
QDRANT_URL=http://localhost:6333
LOCAL=true
```

## Development Workflow

### Start All Services Locally
```bash
# Start frontend and backend together
npm start

# Or start services individually:
npm run start:frontend  # Runs on port 8000
npm run start:backend   # Runs on port 3000
```

### Start Individual Services
```bash
# Frontend only (Vite dev server)
npm run dev --workspace=frontend

# Backend only (Fastify with hot reload)
npm run dev --workspace=backend

# Ingestion service
npm run dev --workspace=ingestion
```

### Development with Docker Compose
For local development with Qdrant vector database:
```bash
# Start all services including Qdrant
docker-compose up

# Build and start
docker-compose up --build
```

### Building Services
```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build --workspace=backend
npm run build --workspace=frontend
npm run build --workspace=ingestion
```

### Watch Mode for Development
```bash
# Backend watch mode (TypeScript compilation)
npm run watch --workspace=backend

# Frontend watch mode (Vite build)
npm run watch --workspace=frontend
```

## Testing Instructions

This project does not have automated tests. Manual testing is performed by:

1. Starting the services locally
2. Using the frontend UI at http://localhost:8000
3. Testing the backend API directly at http://localhost:3000
4. Testing document ingestion at http://localhost:3001

### Manual Testing Workflow
```bash
# Start services
npm start

# Ingest sample documents
./scripts/ingest-data.sh
# Or using curl directly:
curl -F "file=@./data/privacy-policy.pdf" http://localhost:3001/documents
curl -F "file=@./data/support.pdf" http://localhost:3001/documents
curl -F "file=@./data/terms-of-service.pdf" http://localhost:3001/documents

# Access frontend at http://localhost:8000
# Test chat queries through the UI
```

## Code Style Guidelines

### Linting and Formatting
```bash
# Run ESLint on all TypeScript files
npm run lint

# Fix auto-fixable ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### ESLint Configuration
- Based on `@typescript-eslint/recommended`
- Includes `unicorn`, `n` (node), and `import` plugins
- Enforces consistent type imports
- Module extensions required in imports (ESM)

### Prettier Configuration
- Tab width: 2 spaces
- Semicolons: required
- Single quotes: yes
- Print width: 120 characters

### TypeScript Guidelines
- Use explicit `.js` extensions in imports (compiled from `.ts`)
- Type-only imports should use `import type` or inline `type` keyword
- Target: ES modules (ESM)
- Strict mode enabled

### File Organization
- Source files in `src/` directory within each workspace
- Compiled output in `dist/` directory
- Each service has its own `package.json`
- Shared dependencies managed at root level

### Naming Conventions
- Files: kebab-case (e.g., `chat-service.ts`)
- Classes: PascalCase
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE for true constants
- Interfaces/Types: PascalCase

## Build and Deployment

### Docker Build
```bash
# Build backend Docker image
npm run docker:build --workspace=backend

# Build ingestion Docker image
npm run docker:build --workspace=ingestion

# Run Docker images
npm run docker:run --workspace=backend
npm run docker:run --workspace=ingestion
```

### Azure Deployment with azd
```bash
# Login to Azure
azd auth login

# Provision infrastructure and deploy (first time)
azd up

# Deploy only (after initial provision)
azd deploy

# Clean up all resources
azd down --purge
```

### CI/CD Pipeline
- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Triggers on push to `main` branch
- Uses Azure federated credentials (OIDC)
- Required secrets/variables:
  - `AZURE_CLIENT_ID`
  - `AZURE_TENANT_ID`
  - `AZURE_SUBSCRIPTION_ID`
  - `AZURE_ENV_NAME`
  - `AZURE_LOCATION`

### Build Outputs
- **Backend**: `src/backend/dist/` - Compiled JavaScript
- **Frontend**: `src/frontend/dist/` - Vite production build
- **Ingestion**: `src/ingestion/dist/` - Compiled JavaScript

### Infrastructure as Code
- Bicep templates in `infra/` directory
- Main template: `infra/main.bicep`
- Parameters: `infra/main.parameters.json`
- Provisions: Azure OpenAI, Azure AI Search (or Qdrant), Container Apps, Static Web Apps

## Pull Request Guidelines

### Before Submitting
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Build all workspaces to check for errors
npm run build
```

### PR Title Format
No strict format required, but should be descriptive and reference any related issues.

### Required Checks
- Code must pass ESLint checks
- Code must be formatted with Prettier
- All workspaces must build successfully

## Working with Workspaces

### Target Specific Workspace
```bash
# Run any script in specific workspace
npm run <script> --workspace=<workspace-name>

# Examples:
npm run build --workspace=backend
npm run dev --workspace=frontend
npm run clean --workspace=ingestion
```

### Run Across All Workspaces
```bash
# Run script in all workspaces that have it
npm run build --workspaces
npm run clean --workspaces
```

### Available Workspaces
- `frontend` - Web UI (Lit + Vite)
- `backend` - Chat API (Fastify + LangChain.js)
- `ingestion` - Document ingestion (Fastify + pdf-parse)

## Common Development Tasks

### Adding a New Dependency
```bash
# Add to root (for all workspaces)
npm install <package>

# Add to specific workspace
npm install <package> --workspace=<workspace-name>

# Examples:
npm install dotenv --workspace=backend
npm install lit --workspace=frontend
```

### Cleaning Build Artifacts
```bash
# Clean all workspaces
npm run clean

# Clean specific workspace
npm run clean --workspace=backend
```

### Updating Dependencies
```bash
# Update all dependencies
npm update

# Update in specific workspace
npm update --workspace=backend
```

## Debugging and Troubleshooting

### Backend Debugging
- Backend runs with `--watch` flag in dev mode for auto-reload
- Logs are output to console with different levels (debug, info, error)
- Use `NODE_ENV=development` for detailed logs
- Check `.env` file for correct API endpoints and keys

### Frontend Debugging
- Vite provides HMR (Hot Module Replacement) in dev mode
- Check browser console for errors
- Frontend proxies API requests to backend at port 3000

### Common Issues

**"Module not found" errors**: 
- Ensure you've run `npm install` at the root
- Check that import paths include `.js` extension (TypeScript requires this for ESM)

**TypeScript compilation errors**:
- Run `npm run build` to see full error output
- Ensure all workspaces have been built

**ESLint errors on imports**:
- Use `.js` extension in imports even for `.ts` files
- For type-only imports, use `import type` or inline `type`

**Docker build failures**:
- Ensure Docker daemon is running
- Check that `.env` file exists with required variables
- Docker builds happen from the repository root, not individual service directories

**Azure deployment issues**:
- Verify `azd auth login` succeeded
- Check that all required Azure environment variables are set
- Review `azd` logs for specific error messages

### Performance Considerations
- Vector database queries can be slow with large datasets
- Embedding generation is rate-limited by Azure OpenAI quotas
- Frontend uses streaming responses for better UX
- Consider caching frequently accessed embeddings

## Additional Notes

### LangChain.js Integration
- Backend uses LangChain.js for RAG implementation
- Vector store: Azure AI Search or Qdrant
- Embeddings: Azure OpenAI embeddings model
- Chat: Azure OpenAI GPT models

### Document Ingestion
- Supports PDF files only
- Files are split into chunks for embedding
- Chunks are stored in vector database with metadata
- Sample PDFs provided in `data/` directory

### Azure Resources
- Azure OpenAI for LLM and embeddings
- Azure AI Search for vector storage (production)
- Azure Container Apps for backend/ingestion hosting
- Azure Static Web Apps for frontend hosting
- Application Insights for monitoring (optional)

### Local Development Options
- Use Qdrant for local vector database (via Docker Compose)
- Set `LOCAL=true` in `.env` for local authentication
- Alternative: Use Ollama for fully local LLM (experimental)

### Workshop Materials
- Full workshop guide: `docs/workshop.md`
- Slides: `docs/slides/`
- Sample data: `data/*.pdf`

### Security Notes
- Never commit `.env` files or Azure credentials
- Use Azure Managed Identity in production
- API keys should be stored in Azure Key Vault for production deployments
- Frontend communicates only with backend API (no direct OpenAI access)
