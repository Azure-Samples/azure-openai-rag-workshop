#!/usr/bin/env bash
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if azd_env=$(azd env get-values); then
  echo "Loading azd .env file from current environment"
  export $(echo "$azd_env" | xargs)
fi

api_mode=false

echo 'Installing dependencies and building CLI'
npm install
npm run build --workspace=ingestion

echo 'Running "index-files" CLI tool'
npx index-files \
  --wait \
  --ingestion-url "${INGESTION_API_URI:-http://localhost:3001}" \
  --index-name "${INDEX_NAME:-kbindex}" \
  ./data/*.pdf

curl -F "file=@./data/privacy-policy.pdf" \
  -F "file=@./data/support.pdf" \
  -F "file=@./data/terms-of-service.pdf" \
  "${INGESTION_API_URI:-http://localhost:3001}/ingest"