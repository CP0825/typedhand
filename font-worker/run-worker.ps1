# Starts the TypedHand font-worker locally, loading Supabase creds from
# ../.env.local. Run this in its own shell:  .\run-worker.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root ".env.local"

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $i = $_.IndexOf('=')
  $k = $_.Substring(0, $i).Trim()
  $v = $_.Substring($i + 1).Trim()
  if ($k -eq 'NEXT_PUBLIC_SUPABASE_URL') { $env:SUPABASE_URL = $v }
  if ($k -eq 'SUPABASE_SERVICE_ROLE_KEY') { $env:SUPABASE_SERVICE_ROLE_KEY = $v }
}

Write-Host "font-worker -> $($env:SUPABASE_URL)" -ForegroundColor Cyan
python "$PSScriptRoot\worker.py"
