<#
.SYNOPSIS
  Spend Data Update — files monthly EU spend files from the local source into the
  SharePoint "RAW Spend Data" masters, renaming each to the country convention.

.DESCRIPTION
  Safe by default: runs as a DRY-RUN (plan only) and prints what WOULD happen.
  Add -Execute to actually action files. Default action is COPY (source kept);
  add -Move to remove the source after copying.

  Only clean MMYY files are considered (e.g. 0626.csv = Jun 2026). Files already
  present in the destination are skipped, so it naturally moves only new months
  and backfills any older gaps. On-hold / skipped items are never touched
  (IT-EOS, SCAN DK/CPH, Lux, Germany DE_SCN-3017).

.PARAMETER Execute
  Actually perform the actions. Without it, the script only reports the plan.

.PARAMETER Move
  Move (delete source after copy) instead of the default Copy.

.PARAMETER Country
  Optional filter, e.g. -Country UK  (matches the Group column, case-insensitive).

.EXAMPLE
  pwsh -File move-spend.ps1                 # dry-run, all countries
  pwsh -File move-spend.ps1 -Country UK     # dry-run, UK only
  pwsh -File move-spend.ps1 -Execute        # really COPY all
  pwsh -File move-spend.ps1 -Execute -Move  # really MOVE all
#>
param(
  [switch]$Execute,
  [switch]$Move,
  [string]$Country,
  [string]$SourceRoot = "C:\Users\DChoi\OneDrive - Gategroup\Documents\Spend\Report Spend History Data",
  [string]$DestRoot   = "C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\RAW Spend Data"
)

$Mon = @('','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec')

# Pipe-delimited rows (strings avoid PowerShell's nested-array flattening).
# Fields: Group | SrcRel | DstRel | Prefix | OutExt | Style
# Style: dash = <prefix>-<Mon>-<YY> ; de = <prefix>-<Mon>_20<YY> ;
#        it = <prefix>_<Mon>_<YY> ; be = <prefix>_20<YY> - <Mon>.<YY>
$Map = @(
  # --- UK ---
  'UK|UK & IRL\BRS|UK_Master_Spend\UK_BRS-3040-SACS|UK_BRS-3040|.csv|dash'
  'UK|UK & IRL\GLA|UK_Master_Spend\UK_GLA-3042-SACS|UK_GLA-3042|.csv|dash'
  'UK|UK & IRL\LBA|UK_Master_Spend\UK_LBA-3298-SACS|UK_LBA-3298|.csv|dash'
  'UK|UK & IRL\LGW|UK_Master_Spend\UK_LGW-3039-SACS|UK_LGW-3039|.csv|dash'
  'UK|UK & IRL\LHN|UK_Master_Spend\UK_LHN-3295-SACS|UK_LHN-3295|.csv|dash'
  'UK|UK & IRL\LTN|UK_Master_Spend\UK_LTN-3272-SACS|UK_LTN-3272|.csv|dash'
  'UK|UK & IRL\MAN|UK_Master_Spend\UK_MAN-3420-SACS|UK_MAN-3420|.csv|dash'
  'UK|UK & IRL\LCY|UK_Master_Spend\UK_LCY-3037-SACS|UK_LCY-3037|.csv|dash'
  'UK|UK & IRL\LNER|UK_Master_Spend\LNER-2082|UK_LNER-2082|.csv|dash'
  "UK|UK & IRL\BFS_jet2|UK_Master_Spend\JET2-SACS\UK_BFS_JET2-3262|UK_BFS'JET2-3262|.csv|dash"
  "UK|UK & IRL\BHX_Jet2|UK_Master_Spend\JET2-SACS\UK_BHX_JET2-3268|UK_BHX'JET2-3268|.csv|dash"
  "UK|UK & IRL\BRS_Jet2|UK_Master_Spend\JET2-SACS\UK_BRS_JETS-3263|UK_BRS'JETS-3263|.csv|dash"
  "UK|UK & IRL\EMA_Jet2|UK_Master_Spend\JET2-SACS\UK_EMA_JET2-3264|UK_EMA'JET2-3264|.csv|dash"
  "UK|UK & IRL\GLA_jet2|UK_Master_Spend\JET2-SACS\UK_GLA_JET2-3267|UK_GLA'JET2-3267|.csv|dash"
  "UK|UK & IRL\LBA_jet2|UK_Master_Spend\JET2-SACS\UK_LBA_JET2-3266|UK_LBA'JET2-3266|.csv|dash"
  "UK|UK & IRL\LPL_jet2|UK_Master_Spend\JET2-SACS\UK_LPL_JET2-3269|UK_LPL'JET2-3269|.csv|dash"
  "UK|UK & IRL\Man_jet2|UK_Master_Spend\JET2-SACS\UK_MAN_JET2-3273|UK_MAN'JET2-3273|.csv|dash"
  "UK|UK & IRL\NCL_Jet2|UK_Master_Spend\JET2-SACS\UK_NCL_JET2-3271|UK_NCL'JET2-3271|.csv|dash"
  "UK|UK & IRL\STN_Jet2|UK_Master_Spend\JET2-SACS\UK_STN_JET2-3275|UK_STN'JET2-3275|.csv|dash"
  # --- IRL ---
  'IRL|UK & IRL\DUB|IRL_Master_Spend\IRL_DUB-3044-SACS|IRL_DUB-3044|.csv|dash'
  # --- NL ---
  'NL|NL\North|NL_Master_Spend\North_Unit_3050-SACS|NL_North-3050|.csv|dash'
  'NL|NL\West|NL_Master_Spend\West_Unit_3477-SACS|NL_West-3477|.csv|dash'
  # --- CH ---
  'CH|CH\GVA|CH_Master_Spend\CH_GVA-3002-SACS|CH_GVA-3002|.csv|dash'
  'CH|CH\ZRH|CH_Master_Spend\CH_ZRH-3001-SACS|CH_ZRH-3001|.csv|dash'
  # --- SCAN ---
  "SCAN|SE\ARN|SCAN_Master_Spend\SE_Spend_Data-SACS\ARN|SCAN_SE'ARN-3056|.csv|dash"
  "SCAN|SE\GOT|SCAN_Master_Spend\SE_Spend_Data-SACS\GOT|SCAN_SE'GOT-3057|.csv|dash"
  "SCAN|SE\MMX|SCAN_Master_Spend\SE_Spend_Data-SACS\MMX|SCAN_SE'MMX-3058|.csv|dash"
  "SCAN|NO\OSL|SCAN_Master_Spend\NO_Spend_Data-SACS\NO_OSL-3052|SCAN_NO'OSL-3052|.csv|dash"
  "SCAN|NO\BGO|SCAN_Master_Spend\NO_Spend_Data-SACS\NO_BGO-3053|SCAN_NO'BGO-3053|.csv|dash"
  'SCAN|SCAN 3022-3058|SCAN_Master_Spend\DK&SE_Spend_Data-SAP|SCAN_DK&SE|.XLSX|dash'
  # --- BE ---
  'BE|BE|BE&DE_Master_Spend\BE_BRU-1261-P71|BE_BRU-1261|.XLSX|be'
  # --- Germany (DE) --- (DE_SCN-3017 removed: no longer used)
  'DE|Germany\0313|BE&DE_Master_Spend\DE_DUS_0313-P71|DE_DUS-0313|.XLSX|de'
  'DE|Germany\0314|BE&DE_Master_Spend\DE_CGN-0314-P71|DE_CGN-0314|.XLSX|de'
  'DE|Germany\0315|BE&DE_Master_Spend\DE_FRA_ZD-0315-P71|DE_FRA_ZD-0315|.XLSX|de'
  'DE|Germany\0316|BE&DE_Master_Spend\DE_FRA_ZE-0316-P71|DE_FRA_ZE-0316|.XLSX|de'
  'DE|Germany\0319|BE&DE_Master_Spend\DE_MUC-0319-P71|DE_MUC-0319|.XLSX|de'
  'DE|Germany\0325|BE&DE_Master_Spend\DE_BER-0325-P71|DE_BER-0325|.XLSX|de'
  'DE|Germany\3007|BE&DE_Master_Spend\DE_MUC_2-3007-P71|DE_MUC_2-3007|.XLSX|de'
  'DE|Germany\3015|BE&DE_Master_Spend\DE_HAM-3015-P71|DE_HAM-3015|.XLSX|de'
  'DE|Germany\3016|BE&DE_Master_Spend\DE_STR-3016-P71|DE_STR-3016|.XLSX|de'
  'DE|Germany\3447|BE&DE_Master_Spend\DE_HAJ-3447-P71|DE_HAJ-3447|.XLSX|de'
  # --- IT (P71 only; EOS on hold) ---
  'IT|IT\P71|IT_Master_Spend\IT_Master_P71|IT_1411&1413|.XLSX|it'
)

function Build-Name([string]$style,[string]$pfx,[int]$mi,[string]$yy,[string]$ext){
  $m = $Mon[$mi]
  switch ($style) {
    'dash' { "$pfx-$m-$yy$ext" }
    'de'   { "$pfx-${m}_20$yy$ext" }
    'it'   { "${pfx}_${m}_$yy$ext" }
    'be'   { "${pfx}_20$yy - $m.$yy$ext" }
  }
}

$actions = New-Object System.Collections.Generic.List[object]
$nCopy=0; $nExist=0; $nSkip=0; $nMissDir=0
$verb = if($Move){'MOVE'}else{'COPY'}
$runKind = if($Execute){'EXECUTE'}else{'DRY-RUN'}

foreach($row in $Map){
  $grp,$srel,$drel,$pfx,$ext,$style = $row -split '\|'
  if($Country -and $grp -ne $Country){ continue }
  $sdir = Join-Path $SourceRoot $srel
  $ddir = Join-Path $DestRoot   $drel
  if(-not (Test-Path -LiteralPath $sdir)){ Write-Host "!! SRC missing: $srel" -ForegroundColor Yellow; continue }
  if(-not (Test-Path -LiteralPath $ddir)){ Write-Host "!! DEST missing: $drel" -ForegroundColor Yellow; $nMissDir++; continue }

  foreach($f in Get-ChildItem -LiteralPath $sdir -File){
    if($f.Name -match '^(\d{2})(\d{2})\.(csv|xlsx)$'){
      $mi=[int]$Matches[1]; $yy=$Matches[2]
      if($mi -lt 1 -or $mi -gt 12){ $nSkip++; continue }
      $newName = Build-Name $style $pfx $mi $yy $ext
      $target  = Join-Path $ddir $newName
      if(Test-Path -LiteralPath $target){ $nExist++; continue }
      if($Execute){
        Copy-Item -LiteralPath $f.FullName -Destination $target
        if($Move){ Remove-Item -LiteralPath $f.FullName }
      }
      $actions.Add([pscustomobject]@{
        Group=$grp; Original=$f.Name; NewName=$newName; DestFolder=$drel
      })
      $nCopy++
    } else { $nSkip++ }
  }
}

Write-Host ""
Write-Host "==== Spend Data Update — $runKind ($verb) ====" -ForegroundColor Cyan
if($actions.Count -gt 0){
  $actions | Format-Table Group, Original, NewName, DestFolder -AutoSize
} else {
  Write-Host "Nothing to $verb — everything already filed." -ForegroundColor Green
}
Write-Host ("Planned {0}: {1}   Already-exists (skipped): {2}   Non-standard (skipped): {3}   Missing dest folders: {4}" -f `
  $verb, $nCopy, $nExist, $nSkip, $nMissDir)
if(-not $Execute){
  Write-Host "This was a DRY-RUN. Re-run with -Execute to action (add -Move to move instead of copy)." -ForegroundColor Yellow
}
