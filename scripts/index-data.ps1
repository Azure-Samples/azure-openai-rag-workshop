$scriptPath = $MyInvocation.MyCommand.Path
cd $scriptPath/../..

Write-Host "Loading azd .env file from current environment"
$output = azd env get-values

foreach ($line in $output) {
  if (!$line.Contains('=')) {
    continue
  }

  $name, $value = $line.Split("=")
  $value = $value -replace '^\"|\"$'
  [Environment]::SetEnvironmentVariable($name, $value)
}

if ([string]::IsNullOrEmpty($env:INDEXER_API_URI)) {
  [Environment]::SetEnvironmentVariable('INDEXER_API_URI', 'http://localhost:3001')
}

if ([string]::IsNullOrEmpty($env:INDEX_NAME)) {
  [Environment]::SetEnvironmentVariable('INDEX_NAME', 'kbindex')
}

Write-Host 'Installing dependencies and building CLI'
npm install
npm run build --workspace=indexer

Write-Host 'Running "index-files" CLI tool'
$files = Get-Item "data/*.pdf"
npx index-files --wait --indexer-url "$env:INDEXER_API_URI" --index-name "$env:INDEX_NAME" $files
