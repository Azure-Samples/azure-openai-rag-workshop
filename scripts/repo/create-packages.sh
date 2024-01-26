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
rm -rf "$target_folder/solution/.azure"
rm -rf "$target_folder/solution/.qdrant"
rm -rf "$target_folder/solution/.env"
rm -rf "$target_folder/solution/*.env"
rm -rf "$target_folder/solution/docs"
rm -rf "$target_folder/solution/trainer"
rm -rf "$target_folder/solution/scripts/repo"
rm -rf "$target_folder/solution/.github"
rm -rf "$target_folder/solution/TODO"
rm -rf "$target_folder/solution/SUPPORT.md"
rm -rf "$target_folder/solution/CODE_OF_CONDUCT.md"
rm -rf "$target_folder/solution/SECURITY.md"
rm -rf "$target_folder/solution/docker-compose.yml"
cp -R src/backend/src/plugins/_chat.ai-search.ts "$target_folder/solution/src/backend/src/plugins/chat.ts"
rm -rf "$target_folder/solution/src/backend/src/plugins/_chat*"
makeArchive . solution solution

echo "Creating solution package (for JS + Qdrant)..."
copyFolder . solution-qdrant
rm -rf "$target_folder/solution-qdrant/.azure"
rm -rf "$target_folder/solution-qdrant/.qdrant"
rm -rf "$target_folder/solution-qdrant/.env"
rm -rf "$target_folder/solution-qdrant/.env*"
rm -rf "$target_folder/solution-qdrant/docs"
rm -rf "$target_folder/solution-qdrant/trainer"
rm -rf "$target_folder/solution-qdrant/scripts/repo"
rm -rf "$target_folder/solution-qdrant/.github"
rm -rf "$target_folder/solution-qdrant/TODO"
rm -rf "$target_folder/solution-qdrant/SUPPORT.md"
rm -rf "$target_folder/solution-qdrant/CODE_OF_CONDUCT.md"
rm -rf "$target_folder/solution-qdrant/SECURITY.md"
cp -R src/backend/src/plugins/_chat.qdrant.ts "$target_folder/solution-qdrant/src/backend/src/plugins/chat.ts"
rm -rf "$target_folder/solution-qdrant/src/backend/src/plugins/_chat*"
makeArchive . solution-qdrant solution-qdrant

##############################################################################
# Backend Dockerfile
##############################################################################

echo "Creating backend-dockerfile package..."
mkdir -p "$target_folder/src/backend"
cp -R src/backend/Dockerfile "$target_folder/src/backend/Dockerfile"
makeArchive src backend-dockerfile

##############################################################################
# Frontend
##############################################################################

echo "Creating frontend package..."
copyFolder src/frontend
makeArchive src frontend

##############################################################################
# Deployment
##############################################################################

# echo "Creating deploy package..."
# mkdir -p "$target_folder/deploy/.github/workflows"
# mkdir -p "$target_folder/deploy/.azure"
# cp .github/workflows/deploy.yml "$target_folder/deploy/.github/workflows/deploy.yml"
# cp .azure/build.sh "$target_folder/deploy/.azure/build.sh"
# cp .azure/deploy.sh "$target_folder/deploy/.azure/deploy.sh"
# makeArchive . deploy deploy
