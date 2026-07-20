<#
  read-xlsx.ps1 — dump an .xlsx sheet WITHOUT Excel.

  Why this exists: Excel COM on this machine intermittently hangs or throws
  0x800A03EC when opening these CPI workbooks (they appear to carry external
  links). An .xlsx is just a zip of XML, so read it directly — fast, and it
  can never pop a dialog or leave a stray EXCEL.EXE running.

  READ ONLY. Writing still goes through Excel COM (update-cpi.ps1) so that
  formatting and downstream connections are preserved untouched.

  Usage:
    .\read-xlsx.ps1 -Path "...\UK_Inflation_Indicators.xlsx"
    .\read-xlsx.ps1 -Path "..." -Rows 1,2,3,45,46,47
#>
param(
  [Parameter(Mandatory)][string]$Path,
  [int[]]$Rows,                 # default: header + first 2 + last 5
  [int]$MaxCols = 26
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-SheetCells {
  param([string]$File)
  $zip = [IO.Compression.ZipFile]::OpenRead($File)
  try {
    # shared strings table
    $shared = New-Object System.Collections.ArrayList
    $e = $zip.Entries | Where-Object { $_.FullName -eq 'xl/sharedStrings.xml' }
    if ($e) {
      $sr = New-Object IO.StreamReader($e.Open())
      $xml = [xml]$sr.ReadToEnd(); $sr.Close()
      foreach ($si in $xml.sst.si) { [void]$shared.Add($si.InnerText) }
    }
    # first worksheet
    $e = $zip.Entries | Where-Object { $_.FullName -match '^xl/worksheets/sheet1\.xml$' }
    if (-not $e) { throw "no xl/worksheets/sheet1.xml in $File" }
    $sr = New-Object IO.StreamReader($e.Open())
    $xml = [xml]$sr.ReadToEnd(); $sr.Close()

    $cells = @{}; $maxRow = 0
    foreach ($row in $xml.worksheet.sheetData.row) {
      foreach ($c in $row.c) {
        if ($null -eq $c.r) { continue }
        $col = $c.r -replace '[0-9]', ''
        $rn  = [int]($c.r -replace '[^0-9]', '')
        if ($rn -gt $maxRow) { $maxRow = $rn }
        $val = $c.v
        if ($c.t -eq 's'  -and $null -ne $val) { $val = $shared[[int]$val] }
        if ($c.t -eq 'inlineStr')              { $val = $c.is.InnerText }
        if ($null -ne $val -and "$val" -ne '') { $cells["$rn|$col"] = $val }
      }
    }
    return @{ Cells = $cells; MaxRow = $maxRow }
  } finally { $zip.Dispose() }
}

function Get-ColLetters { param([int]$N)
  1..$N | ForEach-Object {
    $i = $_; $s = ''
    while ($i -gt 0) { $m = ($i - 1) % 26; $s = [char](65 + $m) + $s; $i = [int](($i - $m) / 26) }
    $s
  }
}

$r = Get-SheetCells -File $Path
$cells = $r.Cells; $maxRow = $r.MaxRow
$letters = Get-ColLetters $MaxCols

if (-not $Rows) {
  $Rows = @(1, 2, 3) + (($maxRow - 4)..$maxRow) | Where-Object { $_ -ge 1 -and $_ -le $maxRow } | Select-Object -Unique
}

Write-Host ("=== {0}  (rows to {1}) ===" -f (Split-Path $Path -Leaf), $maxRow) -ForegroundColor Cyan
foreach ($rn in $Rows) {
  $line = @()
  foreach ($cl in $letters) {
    $v = $cells["$rn|$cl"]
    if ($null -eq $v) { $line += '-'; continue }
    # column A on data rows is an Excel serial date
    if ($rn -gt 1 -and $cl -eq 'A' -and $v -match '^\d+(\.\d+)?$') {
      $line += ([DateTime]::FromOADate([double]$v)).ToString('yyyy-MM-dd')
    } else {
      $d = 0.0
      if ([double]::TryParse($v, [ref]$d)) { $line += ([math]::Round($d, 4)).ToString() }
      else { $line += ($v -replace '\s+', ' ').Trim() }
    }
  }
  # trim trailing empties
  while ($line.Count -gt 0 -and $line[-1] -eq '-') { $line = $line[0..($line.Count - 2)] }
  Write-Host ("R{0,-3}: {1}" -f $rn, ($line -join ' | '))
}
