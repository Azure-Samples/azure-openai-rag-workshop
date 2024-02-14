#!/usr/bin/env bash
##############################################################################
# Usage: ./switch-template.sh [aisearch|qdrant|quarkus]
# Switch the current project template being worked on.
##############################################################################
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

current_template=""
if [ -f .current ]; then
  current_template=$(cat .current)
fi

# Restore current template to its named state
if [ -n "$current_template" ]; then
  echo "Restoring ${current_template}..."
  mv "src/backend" "src/backend-$current_template"
elif [ -d "src/backend" ]; then
  echo "src/backend exists but no current template found!"
  exit 1
fi

template_name=$1
# If no template name is specified, then just restore the current template
if [ -z "$template_name" ]; then
  echo "No template name specified, done."
  exit 0
fi

# Switch to the new template if it exists
if [ -d "src/backend-$template_name" ]; then
  echo "Switching to ${template_name}..."
  mv "src/backend-$template_name" "src/backend"
  echo "$template_name" > .current
  echo "Switched to ${template_name}."
else
  echo "Template not found: ${template_name}."
  exit 1
fi
