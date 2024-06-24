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

if ([string]::IsNullOrEmpty($env:INGESTION_API_URI)) {
  [Environment]::SetEnvironmentVariable('INGESTION_API_URI', 'http://localhost:3001')
}

if ([string]::IsNullOrEmpty($env:INDEX_NAME)) {
  [Environment]::SetEnvironmentVariable('INDEX_NAME', 'kbindex')
}

Write-Host 'Uploading PDF files to the ingestion API'
Invoke-RestMethod -Uri "$env:INGESTION_API_URI/ingest" -Method Post -InFile "./data/privacy-policy.pdf"
Invoke-RestMethod -Uri "$env:INGESTION_API_URI/ingest" -Method Post -InFile "./data/support.pdf"
Invoke-RestMethod -Uri "$env:INGESTION_API_URI/ingest" -Method Post -InFile "./data/terms-of-service.pdf"
