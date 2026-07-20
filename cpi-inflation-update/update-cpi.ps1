<#
  cpi-inflation-update — multi-country CPI index updater

  Fetches each country's official CPI index series and fills the country's
  workbook in the CPI master folder.

  PERMITTED EDITS ONLY (see SKILL.md):
    - add a date in column A
    - add a CPI index value in an existing column
  Never renames a header, never adds/removes/reorders a column. These files
  feed downstream connections.

  Safety model:
    - Verifies EVERY already-filled cell against the source first.
      Mismatches are REPORTED and left alone (unless -FixMismatches).
    - Backs up the workbook before any write.
    - Only fills blank cells, or appends a new dated row for a month that has
      no row yet. New rows copy the number formats of the row above.

  Usage:
    .\update-cpi.ps1 -Country UK -DryRun
    .\update-cpi.ps1 -Country DE
    .\update-cpi.ps1 -Country UK -FixMismatches     # rewrites history: ask first
#>
param(
  [ValidateSet('UK','DE','NL','SACN')][string]$Country = 'UK',
  [switch]$DryRun,
  [switch]$FixMismatches,
  [double]$FixAbove = 0,    # with -FixMismatches, only correct gaps LARGER than this.
                            # Lets you fix real errors while leaving harmless historical
                            # rounding alone (e.g. NL col C was stored at 1 dp pre-2022-10).
  [string]$BackupDir = "$env:TEMP\cpi-backups"
)

$ErrorActionPreference = 'Stop'
$CPI_DIR = "C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\CPI"

$MONTHNUM = @{
  'January'=1;'February'=2;'March'=3;'April'=4;'May'=5;'June'=6
  'July'=7;'August'=8;'September'=9;'October'=10;'November'=11;'December'=12
}

# ---------------------------------------------------------------- UK (ONS) --
# One request per CDID against the ONS MM23 dataset. See mappings/UK.md.
$UK_MAP = @(
  [pscustomobject]@{ Col= 2; Code='D7BT' }   # UK CPI            CPI 00 all items
  [pscustomobject]@{ Col= 4; Code='L523' }   # UK Food CPI       CPIH 01 (incl. soft drinks)
  [pscustomobject]@{ Col= 5; Code='L78K' }   # Bakery            CPI 01.1.1.4
  [pscustomobject]@{ Col= 6; Code='D7D6' }   # Meat              CPI 01.1.2
  [pscustomobject]@{ Col= 7; Code='D7D7' }   # Fish              CPI 01.1.3
  [pscustomobject]@{ Col= 8; Code='D7D8' }   # Milk cheese eggs  CPI 01.1.4
  [pscustomobject]@{ Col= 9; Code='D7DA' }   # Fruit             CPI 01.1.6
  [pscustomobject]@{ Col=10; Code='D7DB' }   # Vegetables        CPI 01.1.7
  [pscustomobject]@{ Col=11; Code='L79Y' }   # Confectionery     CPI 01.1.8.4
  [pscustomobject]@{ Col=12; Code='L7A4' }   # Ready Meal        CPI 01.1.9.4
  [pscustomobject]@{ Col=13; Code='D7CA' }   # Alcoholic bev     CPI 02.1
  [pscustomobject]@{ Col=14; Code='D7C9' }   # Non-alc bev       CPI 01.2
  [pscustomobject]@{ Col=18; Code='L78U' }   # Poultry           CPI 01.1.2.4
  [pscustomobject]@{ Col=19; Code='L78Z' }   # Seafood           CPI 01.1.3.4 frozen
)

function Get-UkSeries {
  param($Map)
  $out = @{}
  foreach ($m in $Map) {
    $tmp = Join-Path $env:TEMP "ons_$($m.Code).json"
    $url = "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/$($m.Code)/mm23/data"
    & curl.exe -s -m 60 $url -o $tmp | Out-Null
    $o = Get-Content $tmp -Raw | ConvertFrom-Json
    if (-not $o.months) { throw "ONS: no monthly data for $($m.Code)" }
    $h = @{}
    foreach ($x in $o.months) {
      $mn = $MONTHNUM[$x.month.Trim()]
      if ($mn) { $h[("{0}-{1:d2}" -f $x.year, $mn)] = [double]$x.value }
    }
    $out[$m.Col] = $h
    Write-Host ("  {0,-6} col {1,2}  {2} points" -f $m.Code, $m.Col, $h.Count)
  }
  return $out
}

# ----------------------------------------------------------- DE (Destatis) --
# ONE request returns the whole COICOP tree. See mappings/DE.md.
$DE_MAP = @(
  [pscustomobject]@{ Col= 2; Code='CC13-011'   }  # Food
  [pscustomobject]@{ Col= 3; Code='CC13-01124' }  # Poultry
  [pscustomobject]@{ Col= 4; Code='CC13-0112'  }  # Meat & meat products
  [pscustomobject]@{ Col= 5; Code='CC13-0113'  }  # Fish, fish products & seafood
  [pscustomobject]@{ Col= 6; Code='CC13-0114'  }  # Dairy products & eggs
  [pscustomobject]@{ Col= 7; Code='CC13-0116'  }  # Fruit
  [pscustomobject]@{ Col= 8; Code='CC13-0117'  }  # Vegetables
  [pscustomobject]@{ Col= 9; Code='CC13-01184' }  # Confectionery products
  [pscustomobject]@{ Col=10; Code='CC13-021'   }  # Alcoholic beverages
  [pscustomobject]@{ Col=11; Code='CC13-012'   }  # Non-alcoholic beverages
)

function Get-DeSeries {
  param($Map)
  $tmp = "$env:TEMP\destatis_61111-0004.json"
  $url = 'https://genesis.destatis.de/genesis/api/rest/tables/61111-0004/data'
  & curl.exe -s -m 180 $url -o $tmp | Out-Null
  $j = Get-Content $tmp -Raw | ConvertFrom-Json
  if (-not $j.data) { throw "Destatis: unexpected payload" }

  # JSON-stat style: dims [statistic, DINSG, content, MONAT, JAHR, CC13Ax],
  # flat row-major value[], last dimension fastest.
  $sets = @()
  foreach ($ds in $j.data) {
    $ccDim = $ds.id | Where-Object { $_ -like 'CC13*' }
    $idx = { param($ci) $m=@{}; foreach($p in $ci.PSObject.Properties){$m[$p.Name]=[int]$p.Value}; $m }
    $sets += [pscustomobject]@{
      Size  = $ds.size; Value = $ds.value
      MONAT = & $idx $ds.dimension.MONAT.category.index
      JAHR  = & $idx $ds.dimension.JAHR.category.index
      CC    = & $idx $ds.dimension.$ccDim.category.index
    }
  }

  $out = @{}
  foreach ($m in $Map) {
    $h = @{}
    foreach ($s in $sets) {
      if (-not $s.CC.ContainsKey($m.Code)) { continue }
      $ci = $s.CC[$m.Code]; $sz = $s.Size
      foreach ($yk in $s.JAHR.Keys) {
        $yi = $s.JAHR[$yk]
        for ($mo = 1; $mo -le 12; $mo++) {
          $mk = "MONAT{0:d2}" -f $mo
          if (-not $s.MONAT.ContainsKey($mk)) { continue }
          $mi = $s.MONAT[$mk]
          $off = ((((0*$sz[1]+0)*$sz[2]+0)*$sz[3]+$mi)*$sz[4]+$yi)*$sz[5]+$ci
          $v = $s.Value[$off]
          # Destatis pads unpublished months with 0 (not null). A CPI index is
          # never 0, so treat 0 as "not published yet" — otherwise future
          # months get written as 0 and read as -100% inflation downstream.
          if ($null -ne $v -and "$v" -match '^[\d.]+$' -and [double]$v -gt 0) {
            $h[("{0}-{1:d2}" -f $yk, $mo)] = [double]$v
          }
        }
      }
      break
    }
    if ($h.Count -eq 0) { throw "Destatis: code $($m.Code) not found" }
    $out[$m.Col] = $h
    Write-Host ("  {0,-12} col {1,2}  {2} points" -f $m.Code, $m.Col, $h.Count)
  }
  return $out
}

# ------------------------------------------------------------------ NL (CBS) --
# Both columns carry the SAME series. See mappings/NL.md: the column labelled
# "NL Total CPI" is in fact COICOP 01 food & non-alcoholic beverages, and
# "NL Food CPI" has always been a verbatim copy of it. We reproduce that
# faithfully rather than change the file's structure.
$NL_MAP = @(
  [pscustomobject]@{ Col=2; Code='CPI010000' }   # header says "NL Total CPI (2D76)"
  [pscustomobject]@{ Col=3; Code='CPI010000' }   # header says "NL Food CPI (3G20)"
)

function Get-NlSeries {
  param($Map)
  $base = 'https://opendata.cbs.nl/ODataApi/odata'
  function Get-CbsTable($table, $filter) {
    $u = "$base/$table/UntypedDataSet?`$filter=$filter&`$select=Perioden,CPI_1"
    $f = Join-Path $env:TEMP "cbs_$table.json"
    & curl.exe -s -m 120 $u -o $f | Out-Null
    return (Get-Content $f -Raw | ConvertFrom-Json).value
  }
  $cat = "Bestedingscategorieen%20eq%20%27CPI010000%27"

  # chain factor: CBS's own published 2025 annual average on the old (2015=100)
  # base. Derived from published data, NOT fitted - see mappings/NL.md.
  $ann = Get-CbsTable '83131NED' "$cat%20and%20Perioden%20eq%20%272025JJ00%27"
  if (-not $ann) { throw "CBS: could not read 2025 annual average" }
  $factor = [double]($ann[0].CPI_1) / 100.0
  Write-Host ("  chain factor {0} (CBS 2025 annual = {1})" -f $factor, $ann[0].CPI_1)

  $h = @{}
  foreach ($r in (Get-CbsTable '83131NED' $cat)) {            # 2015=100, to 2025-12
    if ($r.Perioden -match '^(\d{4})MM(\d{2})$') { $h["$($Matches[1])-$($Matches[2])"] = [double]$r.CPI_1 }
  }
  foreach ($r in (Get-CbsTable '86141NED' $cat)) {            # 2025=100 live -> rescale
    if ($r.Perioden -match '^(\d{4})MM(\d{2})$') {
      $k = "$($Matches[1])-$($Matches[2])"
      if ($Matches[1] -ge 2026) { $h[$k] = [math]::Round([double]$r.CPI_1 * $factor, 2) }
    }
  }
  $out = @{}
  foreach ($m in $Map) { $out[$m.Col] = $h; Write-Host ("  {0,-10} col {1,2}  {2} points" -f $m.Code, $m.Col, $h.Count) }
  return $out
}

# --------------------------------------------------- SACN / Denmark (DST) --
# ONLY Denmark (col B) is mapped. Norway (col C) and Sweden (col D) are NOT
# confirmed - see COLUMN-MAP.md - so they are deliberately left blank rather
# than filled with numbers we cannot stand behind.
$SACN_MAP = @(
  [pscustomobject]@{ Col=2; Code='DK-01' }   # "Food DK (3G06)"
)

function Get-SacnSeries {
  param($Map)
  function Get-DstTable($table, $varegr) {
    $body = @{ table=$table; format='CSV'; delimiter='Semicolon'
      variables=@(
        @{ code='VAREGR'; values=@($varegr) },
        @{ code='ENHED';  values=@('100') },
        @{ code='Tid';    values=@('*') }
      ) } | ConvertTo-Json -Depth 6
    $bf = Join-Path $env:TEMP "dst_$table.json"
    $of = Join-Path $env:TEMP "dst_$table.csv"
    $body | Out-File $bf -Encoding utf8
    & curl.exe -s -m 120 -X POST 'https://api.statbank.dk/v1/data' `
        -H 'Content-Type: application/json' --data-binary "@$bf" -o $of | Out-Null
    $h = @{}
    foreach ($l in (Get-Content $of | Select-Object -Skip 1)) {
      $p = $l -split ';'
      if ($p.Count -ge 4 -and $p[2] -match '^(\d{4})M(\d{2})$') {
        $h["$($Matches[1])-$($Matches[2])"] = [double]($p[3] -replace ',', '.')
      }
    }
    return $h
  }

  $old = Get-DstTable 'PRIS111' '010000'   # 2015=100, COICOP 01, to 2025-12
  $new = Get-DstTable 'PRIS01'  '011'      # 2025=100, COICOP 01.1, 2026-01 on

  # Chain factor = mean of the twelve published 2025 monthly values on the old
  # base. Derived from published data, not fitted.
  $v2025 = $old.GetEnumerator() | Where-Object { $_.Key -like '2025-*' } | ForEach-Object { $_.Value }
  if ($v2025.Count -ne 12) { throw "DST: expected 12 months of 2025, got $($v2025.Count)" }
  $factor = ($v2025 | Measure-Object -Average).Average / 100
  Write-Host ("  chain factor {0:N6} (mean of 12 published 2025 months)" -f $factor)

  $h = @{}
  foreach ($k in $old.Keys) { $h[$k] = $old[$k] }
  foreach ($k in $new.Keys) { if ($k -ge '2026-01') { $h[$k] = [math]::Round($new[$k] * $factor, 2) } }

  $out = @{}
  foreach ($m in $Map) { $out[$m.Col] = $h; Write-Host ("  {0,-8} col {1,2}  {2} points" -f $m.Code, $m.Col, $h.Count) }
  return $out
}

# ------------------------------------------------------------------ config --
$CFG = @{
  UK = @{ File = 'UK_Inflation_Indicators.xlsx';      Map = $UK_MAP; Fetch = { Get-UkSeries $UK_MAP } }
  DE = @{ File = 'Germany_inflation_indicators.xlsx'; Map = $DE_MAP; Fetch = { Get-DeSeries $DE_MAP } }
  NL = @{ File = 'NL_inflation_indicators.xlsx';      Map = $NL_MAP; Fetch = { Get-NlSeries $NL_MAP } }
  SACN = @{ File = 'SACN_inflation_indicators.xlsx';  Map = $SACN_MAP; Fetch = { Get-SacnSeries $SACN_MAP } }
}
$c    = $CFG[$Country]
$File = Join-Path $CPI_DIR $c.File
$Map  = $c.Map

Write-Host "=== $Country : $($c.File) ===" -ForegroundColor Cyan
Write-Host "Fetching $($Map.Count) series..." -ForegroundColor Cyan
$series = & $c.Fetch

# ------------------------------------------------------------------- excel --
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false; $excel.DisplayAlerts = $false
$excel.AskToUpdateLinks = $false; $excel.EnableEvents = $false
# UpdateLinks=0 is essential: these workbooks carry external links and Excel
# otherwise blocks on a hidden "update links?" dialog forever.
$wb = $excel.Workbooks.Open($File, 0, $false)
$ws = $wb.Worksheets.Item(1)
$lastRow = $ws.UsedRange.Rows.Count

$mismatch = @(); $toWrite = @(); $newRows = @(); $verified = 0
$seenMonths = @{}; $lastDatedRow = 1; $lastDate = $null

for ($r = 2; $r -le $lastRow; $r++) {
  $dv = $ws.Cells.Item($r,1).Value2
  if (-not $dv) { continue }
  # Some workbooks (SACN, NL) hold TEXT dates like "01/02/2022" in early rows.
  # Never use [DateTime]::Parse here - under a US locale it reads that as
  # 2 January, not 1 February, silently shifting the whole verification.
  if ($dv -is [string]) {
    $fmts = [string[]]@('dd/MM/yyyy','d/M/yyyy','yyyy-MM-dd','dd-MM-yyyy')
    $d = [DateTime]::ParseExact([string]$dv.Trim(), $fmts,
           [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None)
  } else {
    $d = [DateTime]::FromOADate($dv)
  }
  $key = "{0}-{1:d2}" -f $d.Year, $d.Month
  $seenMonths[$key] = $r
  $lastDatedRow = $r; $lastDate = $d

  foreach ($m in $Map) {
    $col = $m.Col
    if (-not $series[$col].ContainsKey($key)) { continue }
    $src = $series[$col][$key]
    $cur = $ws.Cells.Item($r,$col).Value2
    if ($null -eq $cur -or "$cur" -eq '') {
      $toWrite += [pscustomobject]@{ Row=$r; Col=$col; Code=$m.Code; Month=$d.ToString('MMM yyyy'); Value=$src }
    }
    elseif ([Math]::Abs([double]$cur - $src) -gt 0.005) {
      $mismatch += [pscustomobject]@{ Row=$r; Col=$col; Code=$m.Code; Month=$d.ToString('MMM yyyy'); File=[double]$cur; Src=$src }
    }
    else { $verified++ }
  }
}

# months published beyond the last dated row -> need a NEW row each
$nextRow = $lastDatedRow + 1
$probe = $lastDate.AddMonths(1)
$thisMonth = Get-Date -Day 1
while ($true) {
  # Belt-and-braces: never create a row for a month that has not happened yet,
  # whatever the source claims. (Destatis, for one, pads future months with 0.)
  if ($probe -ge $thisMonth) { break }
  $key = "{0}-{1:d2}" -f $probe.Year, $probe.Month
  $any = $false
  foreach ($m in $Map) { if ($series[$m.Col].ContainsKey($key)) { $any = $true; break } }
  if (-not $any) { break }
  $vals = @{}
  foreach ($m in $Map) { if ($series[$m.Col].ContainsKey($key)) { $vals[$m.Col] = $series[$m.Col][$key] } }
  $newRows += [pscustomobject]@{ Row=$nextRow; Date=$probe; Month=$probe.ToString('MMM yyyy'); Values=$vals }
  $nextRow++; $probe = $probe.AddMonths(1)
}

Write-Host ""
Write-Host ("Verified $verified existing cells against source.") -ForegroundColor Green

if ($mismatch.Count -gt 0) {
  Write-Host ("WARNING - {0} existing cells disagree with source (NOT changed):" -f $mismatch.Count) -ForegroundColor Yellow
  $mismatch | Format-Table Month, Col, Code, File, Src -AutoSize | Out-String | Write-Host
  if ($FixMismatches) {
    $fix  = $mismatch | Where-Object { [Math]::Abs($_.File - $_.Src) -gt $FixAbove }
    $skip = $mismatch | Where-Object { [Math]::Abs($_.File - $_.Src) -le $FixAbove }
    if ($FixAbove -gt 0) {
      Write-Host ("-FixAbove {0}: correcting {1}, leaving {2} within tolerance." -f $FixAbove, $fix.Count, $skip.Count) -ForegroundColor Red
    } else {
      Write-Host "-FixMismatches set: these WILL be overwritten with the source value." -ForegroundColor Red
    }
    foreach ($x in $fix) {
      $toWrite += [pscustomobject]@{ Row=$x.Row; Col=$x.Col; Code=$x.Code; Month=$x.Month; Value=$x.Src }
    }
  } else {
    Write-Host "Left as-is. Re-run with -FixMismatches to correct them." -ForegroundColor DarkGray
  }
}

if ($toWrite.Count -gt 0) {
  Write-Host ("{0} blank cells to fill:" -f $toWrite.Count) -ForegroundColor Cyan
  $toWrite | Format-Table Month, Col, Code, Value -AutoSize | Out-String | Write-Host
}
if ($newRows.Count -gt 0) {
  Write-Host ("{0} NEW dated rows to append:" -f $newRows.Count) -ForegroundColor Cyan
  foreach ($n in $newRows) {
    Write-Host ("  row {0}  {1}  ->  {2} values" -f $n.Row, $n.Date.ToString('dd/MM/yyyy'), $n.Values.Count)
  }
}
if ($toWrite.Count -eq 0 -and $newRows.Count -eq 0) {
  Write-Host "Nothing to do - already up to date." -ForegroundColor Yellow
  $wb.Close($false); $excel.Quit(); exit 0
}

if ($DryRun) {
  Write-Host "DRY RUN - nothing written." -ForegroundColor Yellow
  $wb.Close($false); $excel.Quit(); exit 0
}

# ------------------------------------------------------------ backup+write --
if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
$bak = Join-Path $BackupDir ((Split-Path $c.File -LeafBase) + '.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.xlsx')
Copy-Item $File $bak -Force
Write-Host "Backup: $bak" -ForegroundColor DarkGray

foreach ($w in $toWrite) { $ws.Cells.Item($w.Row, $w.Col).Value2 = $w.Value }

foreach ($n in $newRows) {
  $src = $n.Row - 1                      # inherit formatting from the row above
  $ws.Cells.Item($n.Row,1).NumberFormat = $ws.Cells.Item($src,1).NumberFormat
  $ws.Cells.Item($n.Row,1).Value2 = $n.Date.ToOADate()
  foreach ($col in $n.Values.Keys) {
    $ws.Cells.Item($n.Row,$col).NumberFormat = $ws.Cells.Item($src,$col).NumberFormat
    $ws.Cells.Item($n.Row,$col).Value2 = $n.Values[$col]
  }
}

$wb.Save(); $wb.Close($true); $excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
Write-Host ("DONE - {0} cells filled, {1} rows appended." -f $toWrite.Count, $newRows.Count) -ForegroundColor Green
