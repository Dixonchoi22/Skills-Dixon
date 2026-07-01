# SCAN (Scandinavia: SE / NO / DK) — Spend Data Update Mapping

Scandinavia is split across several SOURCE folders that all land in the single
`SCAN_Master_Spend` destination tree.

## Paths

- **Source root**: `C:\Users\DChoi\OneDrive - Gategroup\Documents\Spend\Report Spend History Data\`
  - `SE\` (ARN, GOT, MMX), `NO\` (BGO, OSL), `DK\` (CPH), `SCAN 3022-3058\` (monthly XLSX)
- **Destination**: `...\Data_EU_Master_Channel\RAW Spend Data\SCAN_Master_Spend\`

## Rename rule

`MMYY`  →  `<prefix>-<Mon>-<YY>` (month code → name: 01 Jan … 12 Dec).
Keep the original extension (`.csv` for stations, `.XLSX` for the SAP monthly file).

## 1. SE stations (SACS)

Source `SE\<station>\MMYY.csv` → `SE_Spend_Data-SACS\<station>\<prefix>-<Mon>-<YY>.csv`
Prefix uses an apostrophe `'`.

| Source folder | Destination folder            | File prefix          |
|---------------|-------------------------------|----------------------|
| SE\ARN        | SE_Spend_Data-SACS\ARN        | `SCAN_SE'ARN-3056`   |
| SE\GOT        | SE_Spend_Data-SACS\GOT        | `SCAN_SE'GOT-3057`   |
| SE\MMX        | SE_Spend_Data-SACS\MMX        | `SCAN_SE'MMX-3058`   |

## 2. NO stations (SACS)

Source `NO\<station>\MMYY.csv` → `NO_Spend_Data-SACS\<destfolder>\<prefix>-<Mon>-<YY>.csv`

| Source folder | Destination folder                | File prefix         |
|---------------|-----------------------------------|---------------------|
| NO\OSL        | NO_Spend_Data-SACS\NO_OSL-3052    | `SCAN_NO'OSL-3052`  |
| NO\BGO        | NO_Spend_Data-SACS\NO_BGO-3053    | `SCAN_NO'BGO-3053`  |

## 3. SCAN combined monthly XLSX (SAP)

Source `SCAN 3022-3058\MMYY.XLSX` → `DK&SE_Spend_Data-SAP\SCAN_DK&SE-<Mon>-<YY>.XLSX`

e.g. `0126.XLSX` → `SCAN_DK&SE-Jan-26.XLSX`   (note: stays `.XLSX`)

## 4. DK / CPH — ⏸️ SKIP FOR NOW

DK/CPH is **not in use yet** — SKIP it. Do not move `DK\CPH\` files.
The user will confirm when it is switched back on and will provide the file
naming style at that point. Until then, leave `DK_Spend_Data-SACS\` untouched.

## Do NOT touch

- `NO_Spend_Data- Old System\` (3052 - Oslo, 3053 - Bergen): old system with a
  different naming scheme (`OSL_RECEIVED_PO_YYYYMMDD-YYYYMMDD_ROS.CSV`).
  Historical — not part of the monthly move.

## Which files to move each month

Only move files not already present in the destination (compare by converted name).
Skip non-standard names (`01.07.2025.*`, `09.25.*`, `0524-0525`, year files, etc.).
