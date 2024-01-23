#!/usr/bin/env bash
##############################################################################
# Usage: ./build-docs.sh [--local]
# Build the docs and push them to the "docs" branch on GitHub.
##############################################################################

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../..

DOCS_HOME=/tmp/azure-openai-rag-workshop-docs
GH_USER=$(git config user.name)
REPO=https://$GH_USER:$GH_TOKEN@github.com/Azure-Samples/azure-openai-rag-workshop.git

echo "Preparing workshop docs..."
echo "(temp folder: $DOCS_HOME)"
cp -R docs "$DOCS_HOME"
cd "$DOCS_HOME"

# Build docs
cd docs
moaw build _workshop-qdrant.md workshop-qdrant.md

if [[ ${1-} == "--local" ]]; then
  echo "Local mode: skipping GitHub push."
  open "$DOCS_HOME"
else
  # Update git repo
  git init
  git checkout -b docs
  git remote add origin "$REPO"
  git add .
  git commit -m "docs: prepare workshop docs"
  git push -u origin docs --force

  rm -rf "$DOCS_HOME"
fi

echo "Successfully updated workshop docs."
