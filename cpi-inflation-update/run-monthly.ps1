<#
  run-monthly.ps1 — the scheduled monthly run.

  Runs every automated country in turn and adds any newly published month.
  Deliberately does NOT pass -FixMismatches: the routine job is to ADD the new
  month, never to rewrite history. Disagreements with the source are reported
  in the log for a human to look at.

  One country failing (a statistics office being down, say) must not stop the
  rest — each is wrapped separately.

  Log: %LOCALAPPDATA%\cpi-inflation-update\run-YYYY-MM-DD.log
       plus a one-line-per-run summary in last-run.txt

  Usage:
    .\run-monthly.ps1            # the real run
    .\run-monthly.ps1 -DryRun    # show what would change, write nothing
#>
param([switch]$DryRun)

$ErrorActionPreference = 'Continue'
$here    = Split-Path -Parent $MyInvocation.MyCommand.Path
$updater = Join-Path $here 'update-cpi.ps1'

$logDir = Join-Path $env:LOCALAPPDATA 'cpi-inflation-update'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$log   = Join-Path $logDir "run-$stamp.log"

function Say($msg) { $msg | Tee-Object -FilePath $log -Append }

Say "===== CPI monthly run  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ====="
if ($DryRun) { Say "MODE: DRY RUN (nothing will be written)" }

# Italy is absent on purpose - not yet automated. See mappings/IT.md.
$countries = @('UK','DE','NL','SACN','CH','BE')
$results = @()

foreach ($c in $countries) {
  Say ""
  Say "----- $c -----"
  try {
    # A stray EXCEL.EXE from a previous crash will block the workbook open.
    Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # *>&1 not 2>&1 - the updater reports through Write-Host, which lands on the
    # Information stream. With 2>&1 the summary silently saw zero warnings and
    # reported "all clear" while the log showed real disagreements.
    $out = if ($DryRun) { & $updater -Country $c -DryRun *>&1 } else { & $updater -Country $c *>&1 }
    $out | Out-File -FilePath $log -Append

    $txt      = ($out | Out-String)
    $filled   = if ($txt -match 'DONE - (\d+) cells filled, (\d+) rows appended') { "$($Matches[1]) cells, $($Matches[2]) rows" }
                elseif ($txt -match 'Nothing to do')  { 'already up to date' }
                elseif ($DryRun)                      { 'dry run' }
                else                                  { 'no write reported' }
    $warn     = if ($txt -match 'WARNING - (\d+) existing cells disagree') { "$($Matches[1]) disagreements" } else { '' }

    $results += [pscustomobject]@{ Country=$c; Status='OK'; Detail=$filled; Warning=$warn }
    Say "  -> $filled $(if($warn){"[$warn]"})"
  }
  catch {
    $results += [pscustomobject]@{ Country=$c; Status='FAILED'; Detail=$_.Exception.Message; Warning='' }
    Say "  -> FAILED: $($_.Exception.Message)"
  }
}

Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Say ""
Say "===== SUMMARY ====="
$results | Format-Table Country, Status, Detail, Warning -AutoSize | Out-String | ForEach-Object { Say $_ }

$failed = @($results | Where-Object { $_.Status -eq 'FAILED' })
$warned = @($results | Where-Object { $_.Warning })
Say "Countries run: $($results.Count)   failed: $($failed.Count)   with disagreements: $($warned.Count)"
Say "Italy is not included - still not automated (ISTAT). See mappings/IT.md."
Say "Log: $log"

# one-line status the user (or a dashboard) can read at a glance
$summary = "{0}  ok={1} failed={2} warn={3}  log={4}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm'),
           ($results.Count - $failed.Count), $failed.Count, $warned.Count, (Split-Path $log -Leaf)
$summary | Out-File (Join-Path $logDir 'last-run.txt') -Encoding utf8

if ($failed.Count -gt 0) { exit 1 }
exit 0
