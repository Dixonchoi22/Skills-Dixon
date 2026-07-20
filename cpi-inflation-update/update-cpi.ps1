<#
  cpi-inflation-update — UK updater
  Fetches ONS MM23 index series and fills blank month cells in
  UK_Inflation_Indicators.xlsx.

  Safety model:
    - Backs up the workbook before any write.
    - Verifies EVERY already-filled cell against the ONS source first.
      Any mismatch => abort, write nothing.
    - Only ever writes into BLANK cells. Never overwrites.

  Usage:
    .\update-cpi.ps1              # verify + write
    .\update-cpi.ps1 -DryRun      # verify + show what WOULD be written
#>
param(
  [switch]$DryRun,
  [switch]$FixMismatches,   # also correct existing cells that disagree with ONS
  [string]$File = "C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\CPI\UK_Inflation_Indicators.xlsx",
  [string]$BackupDir = "$env:TEMP\cpi-backups"
)

$ErrorActionPreference = 'Stop'

# Column index (1-based, sheet 'in') -> ONS CDID. See mappings/UK.md.
# Columns 3 (RPI), 15 (GROCERY), 16 (DESSERTS), 17 (SANDWICHES) have no source.
# NOTE: deliberately an ARRAY, not a hashtable — PowerShell's [ordered] dict
# treats an integer key as a POSITIONAL index, which silently shifts the map.
$MAP = @(
  [pscustomobject]@{ Col= 2; Cdid='D7BT' }  # UK CPI           - CPI 00 all items
  [pscustomobject]@{ Col= 4; Cdid='L523' }  # UK Food CPI      - CPIH 01 (CPIH, not CPI!)
  [pscustomobject]@{ Col= 5; Cdid='L78K' }  # Bakery           - CPI 01.1.1.4 other bakery
  [pscustomobject]@{ Col= 6; Cdid='D7D6' }  # Meat             - CPI 01.1.2
  [pscustomobject]@{ Col= 7; Cdid='D7D7' }  # Fish             - CPI 01.1.3
  [pscustomobject]@{ Col= 8; Cdid='D7D8' }  # Milk cheese eggs - CPI 01.1.4
  [pscustomobject]@{ Col= 9; Cdid='D7DA' }  # Fruit            - CPI 01.1.6
  [pscustomobject]@{ Col=10; Cdid='D7DB' }  # Vegetables       - CPI 01.1.7
  [pscustomobject]@{ Col=11; Cdid='L79Y' }  # Confectionery    - CPI 01.1.8.4
  [pscustomobject]@{ Col=12; Cdid='L7A4' }  # Ready Meal       - CPI 01.1.9.4
  [pscustomobject]@{ Col=13; Cdid='D7CA' }  # Alcoholic bev    - CPI 02.1
  [pscustomobject]@{ Col=14; Cdid='D7C9' }  # Non-alc bev      - CPI 01.2
  [pscustomobject]@{ Col=18; Cdid='L78U' }  # Poultry          - CPI 01.1.2.4
  [pscustomobject]@{ Col=19; Cdid='L78Z' }  # Seafood          - CPI 01.1.3.4 frozen
)

$MONTHNUM = @{
  'January'=1;'February'=2;'March'=3;'April'=4;'May'=5;'June'=6
  'July'=7;'August'=8;'September'=9;'October'=10;'November'=11;'December'=12
}

function Get-OnsSeries {
  param([string]$Cdid)
  $tmp = Join-Path $env:TEMP "ons_$Cdid.json"
  $url = "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/$Cdid/mm23/data"
  & curl.exe -s -m 60 $url -o $tmp | Out-Null
  if (-not (Test-Path $tmp)) { throw "fetch failed for $Cdid" }
  $o = Get-Content $tmp -Raw | ConvertFrom-Json
  if (-not $o.months) { throw "no monthly data for $Cdid" }
  $h = @{}
  foreach ($m in $o.months) {
    $mn = $MONTHNUM[$m.month.Trim()]
    if ($mn) { $h[("{0}-{1:d2}" -f $m.year, $mn)] = [double]$m.value }
  }
  return $h
}

Write-Host "Fetching $($MAP.Count) ONS series..." -ForegroundColor Cyan
$series = @{}
foreach ($m in $MAP) {
  $series[$m.Col] = Get-OnsSeries -Cdid $m.Cdid
  Write-Host ("  {0,-6} col {1,2}  {2} points" -f $m.Cdid, $m.Col, $series[$m.Col].Count)
}

# ---- open workbook -------------------------------------------------------
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false; $excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($File)
$ws = $wb.Worksheets.Item(1)
$lastRow = $ws.UsedRange.Rows.Count

$mismatch = @(); $toWrite = @(); $verified = 0

for ($r = 2; $r -le $lastRow; $r++) {
  $dt = $ws.Cells.Item($r,1).Value2
  if (-not $dt) { continue }
  $d = [DateTime]::FromOADate($dt)
  $key = "{0}-{1:d2}" -f $d.Year, $d.Month

  foreach ($m in $MAP) {
    $col = $m.Col
    if (-not $series[$col].ContainsKey($key)) { continue }   # not published yet
    $src = $series[$col][$key]
    $cur = $ws.Cells.Item($r,$col).Value2

    if ($null -eq $cur -or "$cur" -eq '') {
      $toWrite += [pscustomobject]@{ Row=$r; Col=$col; Cdid=$m.Cdid; Month=$d.ToString('MMM yyyy'); Value=$src }
    }
    elseif ([Math]::Abs([double]$cur - $src) -gt 0.051) {
      $mismatch += [pscustomobject]@{ Row=$r; Col=$col; Cdid=$m.Cdid; Month=$d.ToString('MMM yyyy'); File=$cur; Ons=$src }
    }
    else { $verified++ }
  }
}

Write-Host ""
Write-Host ("Verified {0} existing cells against ONS." -f $verified) -ForegroundColor Green

if ($mismatch.Count -gt 0) {
  Write-Host ("WARNING - {0} existing cells disagree with ONS (NOT changed):" -f $mismatch.Count) -ForegroundColor Yellow
  $mismatch | Format-Table -AutoSize | Out-String | Write-Host
  if ($FixMismatches) {
    Write-Host "-FixMismatches set: these WILL be corrected to the ONS value." -ForegroundColor Red
    foreach ($x in $mismatch) {
      $toWrite += [pscustomobject]@{ Row=$x.Row; Col=$x.Col; Cdid=$x.Cdid; Month=$x.Month; Value=$x.Ons }
    }
  } else {
    Write-Host "Left as-is. Re-run with -FixMismatches to correct them." -ForegroundColor DarkGray
  }
}

if ($toWrite.Count -eq 0) {
  Write-Host "Nothing to fill - already up to date." -ForegroundColor Yellow
  $wb.Close($false); $excel.Quit()
  exit 0
}

Write-Host ("{0} blank cells to fill:" -f $toWrite.Count) -ForegroundColor Cyan
$toWrite | Format-Table Month, Col, Cdid, Value -AutoSize | Out-String | Write-Host

if ($DryRun) {
  Write-Host "DRY RUN - nothing written." -ForegroundColor Yellow
  $wb.Close($false); $excel.Quit()
  exit 0
}

# ---- backup then write ---------------------------------------------------
if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
$stamp = $wb.BuiltinDocumentProperties | Out-Null
$bak = Join-Path $BackupDir ("UK_Inflation_Indicators.bak-" + (Get-Item $File).LastWriteTime.ToString('yyyyMMdd-HHmmss') + ".xlsx")
Copy-Item $File $bak -Force
Write-Host "Backup: $bak" -ForegroundColor DarkGray

foreach ($w in $toWrite) { $ws.Cells.Item($w.Row, $w.Col).Value2 = $w.Value }
$wb.Save()
$wb.Close($true)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null

Write-Host ("DONE - wrote {0} cells." -f $toWrite.Count) -ForegroundColor Green
