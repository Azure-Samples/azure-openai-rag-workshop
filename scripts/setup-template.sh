#!/usr/bin/env bash
##############################################################################
# Usage: ./setup-template.sh [aisearch|qdrant|quarkus]
# Setup the current project template.
##############################################################################
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

template_name=$1
if [ -z "$template_name" ]; then
  echo "Usage: setup-template.sh [aisearch|qdrant|quarkus]"
  exit 1
fi

if [ "$template_name" == "qdrant" ]; then
  echo "Preparing project template for Qdrant..."
  mv src/backend-node-qdrant src/backend
  rm -rf src/backend-*
  rm -rf src/ingestion-*
  rm -rf pom.xml

  echo -e "services:
  # backend:
  #   build:
  #     dockerfile: ./src/backend/Dockerfile
  #   environment:
  #     - AZURE_OPENAI_URL=\${AZURE_OPENAI_URL}
  #     - QDRANT_URL=http://qdrant:6333
  #     - LOCAL=true
  #   ports:
  #     - 3000:3000

  ingestion:
    build:
      dockerfile: ./src/ingestion/Dockerfile
    environment:
      - AZURE_OPENAI_URL=\${AZURE_OPENAI_URL}
      - QDRANT_URL=http://qdrant:6333
    ports:
      - 3001:3001

  qdrant:
    image: docker.io/qdrant/qdrant:v1.8.2
    ports:
      - 6333:6333
      - 6334:6334
    volumes:
      - .qdrant:/qdrant/storage:z
" > docker-compose.yml
  npm install
elif [ "$template_name" == "aisearch" ]; then
  echo "Preparing project template for Azure AI Search..."
  mv src/backend-node-aisearch src/backend
  rm -rf src/backend-*
  rm -rf src/ingestion-*
  rm -rf pom.xml
  npm install
elif [ "$template_name" == "quarkus" ]; then
  echo "Preparing project template for Quarkus..."
  mv src/backend-java-quarkus src/backend
  rm -rf src/ingestion
  mv src/ingestion-java src/ingestion
  rm -rf src/backend-*
  rm -rf src/ingestion-*

  echo -e "services:
  # backend:
  #   build:
  #     dockerfile: ./src/backend/Dockerfile
  #   environment:
  #     - AZURE_OPENAI_URL=\${AZURE_OPENAI_URL}
  #     - QDRANT_URL=http://qdrant:6334
  #     - LOCAL=true
  #   ports:
  #     - 3000:3000

  ingestion:
    build:
      dockerfile: ./src/ingestion/Dockerfile
    environment:
      - AZURE_OPENAI_URL=\${AZURE_OPENAI_URL}
      - QDRANT_URL=http://qdrant:6334
    ports:
      - 3001:3001

  qdrant:
    image: docker.io/qdrant/qdrant:v1.8.2
    ports:
      - 6333:6333
      - 6334:6334
    volumes:
      - .qdrant:/qdrant/storage:z
" > docker-compose.yml

  perl -pi -e 's/api_mode=false/api_mode=true/g' scripts/ingest-data.sh
  perl -pi -e 's/$api_mode = false/$api_mode = true/g' scripts/ingest-data.ps1
  npm install
else
  echo "Invalid template name. Please use 'aisearch', 'qdrant' or 'quarkus' as the template name."
  echo "Usage: setup-template.sh [aisearch|qdrant|quarkus]"
  exit 1
fi

rm -rf ./scripts/setup-template.sh

git add .
git commit -m "chore: complete project setup"

echo "Template ready!"

