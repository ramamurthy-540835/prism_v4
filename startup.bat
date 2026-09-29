@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0startup.ps1" -FrontendPort 3000 -BackendPort 8000
endlocal