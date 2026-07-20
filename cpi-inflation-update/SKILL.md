---
name: cpi-inflation-update
description: >-
  Update the monthly food-CPI (inflation indicator) index files in the EU
  Procurement master area. Fetch each country's latest published CPI index
  values from official national sources and fill the next empty month row in
  that country's Excel file. Use when the user asks to update the CPI /
  inflation indicators, or names a country (UK, Germany/DE, Italy/IT,
  Switzerland/CH, Netherlands/NL, Belgium/BE, Nordics/SACN). The EU-level file
  ("EU Inflation rate.xlsx") is OUT OF SCOPE — do not touch it.
---

# CPI / Inflation Indicators Update — SOP

Each month, national statistics offices publish new food-CPI **index** values
(base 2015 = 100). This skill pulls the latest values and appends them to the
per-country files in the CPI master folder, one file per country/region.

## Paths

- **Target folder** (files to update):
  `C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\CPI\`

Files in scope (7):
`UK_Inflation_Indicators.xlsx`, `Germany_inflation_indicators.xlsx`,
`IT_Inflation_indicators.xlsx`, `CH_inflation_indicators.xlsx`,
`NL_inflation_indicators.xlsx`, `BE_Inflation_indicators.xlsx`,
`SACN_inflation_indicators.xlsx`.

**Out of scope:** `EU Inflation rate.xlsx` — never update it.

## File shape (all countries share this)

- Column 1 = `Date`, one row per month, dated the **1st** of the month,
  format `DD/MM/YYYY` (e.g. `01/06/2026`).
- Each further column = one food category's CPI **index** value.
- Rows are already pre-created for future months and left blank until data
  is published. **We fill the blank cells of already-dated rows** — we do not
  usually add new rows (but add one if the next month has no row yet).
- Column headers and their source series differ per country — see
  `mappings/<country>.md` (the source of truth). ALWAYS read the mapping
  before writing.

## Data sources

| Country | Source | How fetched | Status |
|---------|--------|-------------|--------|
| UK      | ONS (MM23 dataset), by CDID | `curl` ONS timeseries JSON → parse `.months` | ✅ confirmed (D7BT etc.) |
| DE      | Destatis (`CC13-*` codes)   | TBD                          | 🔬 source research pending |
| IT      | ISTAT / Eurostat (Macrobond `3G/TT/TQ` in file) | TBD | 🔬 pending |
| CH      | BFS (`NW*` codes)           | TBD                          | 🔬 pending |
| NL      | CBS (`3G/2D` codes)         | TBD                          | 🔬 pending |
| BE      | Statbel (`3G02`)            | TBD                          | 🔬 pending |
| SACN    | DK/NO/SE national (`3G06/21/27`) | TBD                     | 🔬 pending |

### UK — ONS fetch (working method)

No python/jq on this machine — use curl + PowerShell:

```powershell
curl -s -m 30 "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/<CDID>/mm23/data" -o "$env:TEMP\cpi.json"
$o = Get-Content "$env:TEMP\cpi.json" -Raw | ConvertFrom-Json
$o.months | Select-Object -Last 6 | ForEach-Object { "$($_.year) $($_.month) = $($_.value)" }
```

Values are the CPI index (2015 = 100), matching the file's columns exactly.
ONS publishes the previous month's figures on a set date (~mid-month);
e.g. **June data was released 22 July**.

## Monthly procedure

For each in-scope country the user asks for (or all active ones):

1. **Read** `mappings/<country>.md` for column → source-series mapping.
2. **Open** the country file; find the **latest already-filled month** and the
   **next blank month row(s)** that now have published data.
3. **Fetch** each column's series from its source; read the values for the
   month(s) to fill.
4. **Verify before writing:** re-fetch one already-filled month and confirm the
   source value still matches the file — proves the mapping is still correct.
   If it does not match, STOP and report; do not write.
5. **Write** the new month's value into each column's blank cell (Excel COM,
   see `update-cpi.ps1`). Match the file's number formatting.
6. **Save** and close.

## Safety rules

- **Verify-then-write.** Never write a month until a known prior month re-matches.
- **Never overwrite** a non-blank cell. Only fill blanks / append the next month.
- **Never touch** `EU Inflation rate.xlsx`.
- **One backup per run:** copy the file to `<name>.bak-YYYYMMDD.xlsx` in the
  scratchpad before first write, in case a rollback is needed.
- **Report** at the end (see below).

## Final report (always output at the end of a run)

Per country updated, show a table: column | month filled | value written |
source series/CDID. Then a summary: countries updated, months filled per
country, any columns skipped (source not yet published) or warnings
(mapping mismatch, missing rows). Append the same summary to `RUN_LOG.md`.

## Scheduling

Runs monthly via a Windows Scheduled Task (same pattern as the second-brain
git backup) once release dates have passed. UK release ~22nd of the month for
the prior month; other countries vary — record each country's release day in
its mapping file as it is confirmed.

## Running it (UK)

```powershell
.\update-cpi.ps1 -DryRun          # verify + show what would be written
.\update-cpi.ps1                  # verify + fill blanks (backs up first)
.\update-cpi.ps1 -FixMismatches   # ALSO correct existing cells that differ
```

`-FixMismatches` rewrites history — only use it when the user has explicitly
agreed to correct the flagged cells.

## Open items

- ✅ UK column → CDID map confirmed (`mappings/UK.md`), 636 historical cells
  verified, updater working end-to-end.
- ⚠️ UK file has 8 pre-existing wrong cells (see `RUN_LOG.md`) — awaiting a
  user decision on whether to correct them.
- Identify a free/automatable source for DE, IT, CH, NL, BE, SACN (files use
  Macrobond/Destatis codes; likely map to Eurostat HICP or each national
  statistics office API). Fill each `mappings/<country>.md` once confirmed.
- Set the Scheduled Task (UK release ~22nd monthly).
