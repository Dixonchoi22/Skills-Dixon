<#
  start-browser.ps1 — open Chrome for SACS with a debugging port.

  Why a debugging port: the browser then lives independently of Claude's
  scripts. Dixon drives it normally; Claude attaches over CDP whenever it needs
  to read the current page, and detaches again. Without this, the browser closes
  the moment a script ends and Claude loses sight of the session.

  Dixon signs in himself. Claude never sees the password. The session persists
  in .auth-chrome\ (gitignored), so the sign-in is not needed every run.

  Run:  .\start-browser.ps1
#>
param(
  [int]$Port = 9222,
  [string]$Url = 'https://sacsemea.gategroup.com/'
)

$profileDir = Join-Path $PSScriptRoot '.auth-chrome'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { $chrome = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe" }
if (-not (Test-Path $chrome)) { throw 'Chrome not found' }

# Already listening? Then reuse it rather than opening a second one.
try {
  $v = Invoke-RestMethod "http://localhost:$Port/json/version" -TimeoutSec 3
  Write-Host "Chrome is already listening on port $Port - reusing it." -ForegroundColor Green
  Write-Host ("  {0}" -f $v.Browser)
  return
} catch { }

if (-not (Test-Path $profileDir)) { New-Item -ItemType Directory -Path $profileDir -Force | Out-Null }

Start-Process $chrome -ArgumentList @(
  "--remote-debugging-port=$Port",
  "--user-data-dir=`"$profileDir`"",
  '--no-first-run',
  '--no-default-browser-check',
  '--start-maximized',
  $Url
)

# wait for the port to come up
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Milliseconds 700
  try {
    $v = Invoke-RestMethod "http://localhost:$Port/json/version" -TimeoutSec 2
    Write-Host "Chrome ready on port $Port" -ForegroundColor Green
    Write-Host ("  {0}" -f $v.Browser)
    Write-Host ""
    Write-Host "Sign in in that window. Claude will attach when you say so." -ForegroundColor Cyan
    return
  } catch { }
}
throw "Chrome did not open a debugging port on $Port"
