#!/usr/bin/env bash
##############################################################################
# Usage: ./create-packages.sh
# Creates packages for skippable sections of the workshop
##############################################################################

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

target_folder=dist

rm -rf "$target_folder"
mkdir -p "$target_folder"

copyFolder() {
  local src="$1"
  local dest="$target_folder/${2:-}"
  find "$src" -type d -not -path '*node_modules*' -not -path '*/.git' -not -path '*.git/*' -not -path '*/dist' -not -path '*dist/*' -exec mkdir -p '{}' "$dest/{}" ';'
  find "$src" -type f -not -path '*node_modules*' -not -path '*.git/*' -not -path '*dist/*' -not -path '*/.DS_Store' -exec cp -r '{}' "$dest/{}" ';'
}

makeArchive() {
  local src="$1"
  local name="${2:-$src}"
  local archive="$name.tar.gz"
  local cwd="${3:-}"
  echo "Creating $archive..."
  if [[ -n "$cwd" ]]; then
    pushd "$target_folder/$cwd" >/dev/null
    tar -czvf "../$archive" "$src"
    popd
    rm -rf "$target_folder/${cwd:?}"
  else
    pushd "$target_folder/$cwd" >/dev/null
    tar -czvf "$archive" "$src"
    popd
    rm -rf "$target_folder/${src:?}"
  fi
}

##############################################################################
# Complete solution
##############################################################################

echo "Creating solution package (for JS + Azure AI Search)..."
copyFolder . solution
mv "$target_folder/solution/src/backend-node-aisearch" "$target_folder/solution/src/backend"
rm -rf "$target_folder/solution/.azure"
rm -rf "$target_folder/solution/.qdrant"
rm -rf "$target_folder/solution/.env"
rm -rf "$target_folder/solution/*.env"
rm -rf "$target_folder/solution/docs"
rm -rf "$target_folder/solution/trainer"
rm -rf "$target_folder/solution/scripts/repo"
rm -rf "$target_folder/solution/.github"
rm -rf "$target_folder/solution/src/backend-"*
rm -rf "$target_folder/solution/src/ingestion-"*
rm -rf "$target_folder/solution/TODO"
rm -rf "$target_folder/solution/SUPPORT.md"
rm -rf "$target_folder/solution/CODE_OF_CONDUCT.md"
rm -rf "$target_folder/solution/SECURITY.md"
rm -rf "$target_folder/solution/docker-compose.yml"
rm -rf "$target_folder/solution/scripts/setup-template.sh"
rm -rf "$target_folder/solution/pom.xml"
perl -pi -e 's/stream: false/stream: true/g' "$target_folder/solution/src/frontend/src/components/chat.ts"
makeArchive . solution solution

echo "Creating solution package (for JS + Qdrant)..."
copyFolder . solution-qdrant
mv "$target_folder/solution-qdrant/src/backend-node-qdrant" "$target_folder/solution-qdrant/src/backend"
rm -rf "$target_folder/solution-qdrant/.azure"
rm -rf "$target_folder/solution-qdrant/.qdrant"
rm -rf "$target_folder/solution-qdrant/.env"
rm -rf "$target_folder/solution-qdrant/.env*"
rm -rf "$target_folder/solution-qdrant/docs"
rm -rf "$target_folder/solution-qdrant/trainer"
rm -rf "$target_folder/solution-qdrant/scripts/repo"
rm -rf "$target_folder/solution-qdrant/.github"
rm -rf "$target_folder/solution-qdrant/src/backend-"*
rm -rf "$target_folder/solution-qdrant/src/ingestion-"*
rm -rf "$target_folder/solution-qdrant/TODO"
rm -rf "$target_folder/solution-qdrant/SUPPORT.md"
rm -rf "$target_folder/solution-qdrant/CODE_OF_CONDUCT.md"
rm -rf "$target_folder/solution-qdrant/SECURITY.md"
rm -rf "$target_folder/solution-qdrant/scripts/setup-template.sh"
rm -rf "$target_folder/solution/pom.xml"
perl -pi -e 's/stream: false/stream: true/g' "$target_folder/solution-qdrant/src/frontend/src/components/chat.ts"
makeArchive . solution-qdrant solution-qdrant

echo "Creating solution package (for Java + Quarkus)..."
copyFolder . solution-java-quarkus
mv "$target_folder/solution-java-quarkus/src/backend-node-qdrant" "$target_folder/solution-java-quarkus/src/backend"
rm -rf "$target_folder/solution-java-quarkus/src/ingestion"
mv "$target_folder/solution-java-quarkus/src/ingestion-java" "$target_folder/solution-java-quarkus/src/ingestion"
rm -rf "$target_folder/solution-java-quarkus/.azure"
rm -rf "$target_folder/solution-java-quarkus/.qdrant"
rm -rf "$target_folder/solution-java-quarkus/.env"
rm -rf "$target_folder/solution-java-quarkus/.env*"
rm -rf "$target_folder/solution-java-quarkus/docs"
rm -rf "$target_folder/solution-java-quarkus/trainer"
rm -rf "$target_folder/solution-java-quarkus/scripts/repo"
rm -rf "$target_folder/solution-java-quarkus/.github"
rm -rf "$target_folder/solution-java-quarkus/src/backend-"*
rm -rf "$target_folder/solution-java-quarkus/src/ingestion-"*
rm -rf "$target_folder/solution-java-quarkus/TODO"
rm -rf "$target_folder/solution-java-quarkus/SUPPORT.md"
rm -rf "$target_folder/solution-java-quarkus/CODE_OF_CONDUCT.md"
rm -rf "$target_folder/solution-java-quarkus/SECURITY.md"
rm -rf "$target_folder/solution-java-quarkus/scripts/setup-template.sh"
perl -pi -e 's/stream: false/stream: true/g' "$target_folder/solution-java-quarkus/src/frontend/src/components/chat.ts"
makeArchive . solution-java-quarkus solution-java-quarkus

##############################################################################
# Backend Dockerfile
##############################################################################

echo "Creating backend-dockerfile package (for JS + Azure AI Search)..."
mkdir -p "$target_folder/src/backend"
cp -R src/backend-node-aisearch/Dockerfile "$target_folder/src/backend/Dockerfile"
makeArchive src backend-dockerfile-aisearch

echo "Creating backend-dockerfile package (for JS + Qdrant)..."
mkdir -p "$target_folder/backend-dockerfile/src/backend"
cp -R src/backend-node-qdrant/Dockerfile "$target_folder/backend-dockerfile/src/backend/Dockerfile"
cp -R docker-compose.yml "$target_folder/backend-dockerfile/docker-compose.yml"
makeArchive . backend-dockerfile backend-dockerfile

##############################################################################
# Frontend
##############################################################################

echo "Creating frontend package..."
copyFolder src/frontend
makeArchive src frontend

##############################################################################
# Deployment (CI/CD)
##############################################################################

echo "Creating CI/CD package..."
mkdir -p "$target_folder/ci-cd/.github/workflows"
cp .github/workflows/deploy.yml "$target_folder/ci-cd/.github/workflows/deploy.yml"
makeArchive . ci-cd ci-cd
