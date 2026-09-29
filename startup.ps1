param(
  [int]$FrontendPort = 3000,
  [int]$BackendPort = 8000
)

$ErrorActionPreference = "Stop"

function Stop-PortProcess {
  param([int]$Port)
  $owningProcessIds = @()
  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    if ($conns) {
      $owningProcessIds = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    }
  } catch {
    $netstatLines = netstat -ano | Select-String ":$Port\s"
    foreach ($line in $netstatLines) {
      $parts = ($line.ToString() -split "\s+") | Where-Object { $_ -ne "" }
      if ($parts.Length -ge 5) {
        $owningProcessIds += [int]$parts[-1]
      }
    }
    $owningProcessIds = $owningProcessIds | Select-Object -Unique
  }

  foreach ($procId in $owningProcessIds) {
    try {
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "Stopped PID $procId on port $Port"
    } catch {
      Write-Host "Could not stop PID $procId on port $Port"
    }
  }
}

Write-Host "Checking required commands..."
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  Write-Host "gcloud not found. Install Google Cloud SDK first."
  exit 1
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "node not found. Install Node.js first."
  exit 1
}

Write-Host "Checking ADC..."
$adcPath = Join-Path $env:APPDATA "gcloud\application_default_credentials.json"
if (-not (Test-Path $adcPath) -and -not $env:GOOGLE_APPLICATION_CREDENTIALS) {
  Write-Host "ADC not found. Run: gcloud auth application-default login"
}

if (Test-Path ".env.local") {
  Get-Content .env.local | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $k,$v = $_ -split '=',2
    [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim(), "Process")
  }
}

Stop-PortProcess -Port $FrontendPort
Stop-PortProcess -Port $BackendPort

Write-Host "Starting backend on port $BackendPort"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$PWD'; `$env:BACKEND_PORT='$BackendPort'; node backend/server.js"

Write-Host "Starting frontend on port $FrontendPort"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$PWD'; `$env:PORT='$FrontendPort'; npm run dev"

Write-Host "Starting Knowledge API on port 8001"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$PWD'; python -m uvicorn backend.app:app --host 0.0.0.0 --port 8001"

Write-Host "Started. Frontend: http://localhost:$FrontendPort  Backend health: http://localhost:$BackendPort/health  Knowledge API: http://localhost:8001/health"
