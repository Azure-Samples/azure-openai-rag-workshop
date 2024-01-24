#!/usr/bin/env bash
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if azd_env=$(azd env get-values); then
  echo "Loading azd .env file from current environment"
  export "$(echo "$azd_env" | xargs)"
fi

echo 'Installing dependencies and building CLI'
npm ci
npm run build --workspace=indexer

echo 'Running "index-files" CLI tool'
npx index-files \
  --wait \
  --indexer-url "${INDEXER_API_URI:-http://localhost:3001}" \
  --index-name "${AZURE_SEARCH_INDEX:-kbindex}" \
  ./data/*.pdf
