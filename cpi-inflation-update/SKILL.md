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

## The job, in one line

**When a new CPI is published: add a date row, and put that month's index
values in. That is all this skill does.**

Everything below is in service of doing that correctly — knowing which source
feeds which column, and refusing to write when a number cannot be trusted.
Nothing here licenses redesigning these workbooks.

Each month, national statistics offices publish new food-CPI **index** values.
This skill pulls them and appends them to the per-country files in the CPI
master folder, one file per country/region.

### Routine monthly run

```powershell
.\update-cpi.ps1 -Country UK    # then DE, NL, SACN, CH
```

That is the whole routine. It adds the new month and stops. Anything else —
correcting an old value, rebasing a column — is an exception that needs the
user to say so first.

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

## 🚫 HARD RULE — data only, never structure

The ONLY permitted edits are:

1. **Adding a date** in column A (next month's row), and
2. **Adding a CPI index value** into an existing column.

Everything else is forbidden — **never**:
- rename, reword or "correct" a column header,
- add, remove, reorder or re-type a column,
- change a sheet name, or reformat the sheet.

**Why:** these workbooks feed downstream connections (Power BI / linked
reports). Any structural change breaks them silently. A header that looks
wrong or misleading is NOT a bug to fix — leave it exactly as it is and note
the real meaning in `mappings/<country>.md` instead.

## Safety rules

- **Verify-then-write.** Never write a month until a known prior month re-matches.
- **Never overwrite** a non-blank cell. Only fill blanks / append the next month.
  (`-FixMismatches` is the one exception, and needs explicit user consent.)
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

`run-monthly.ps1` runs every automated country in one pass and logs the result.
It deliberately does **not** pass `-FixMismatches` — the scheduled job's only
job is to add the new month. Disagreements are logged for a human, never
auto-corrected. One country failing does not stop the others.

```powershell
.\run-monthly.ps1 -DryRun    # see what would change
.\run-monthly.ps1            # the real run
```

Logs: `%LOCALAPPDATA%\cpi-inflation-update\run-<timestamp>.log`, plus a
one-line `last-run.txt` for a quick glance.

### Release days (why the 23rd)

| Country | Data for month M is published |
|---------|-------------------------------|
| Switzerland | start of M+1 |
| Netherlands | 4th–7th of M+1 |
| Denmark, Norway | ~10th of M+1 |
| Germany | 10th–13th of M+1 |
| Sweden | ~15th of M+1 |
| **UK** | **~22nd of M+1** |
| Belgium | last working day of **M itself** |

The UK is last, so a run on the **23rd** picks up every country in one go.

### Scheduled Task

Registered as **`CPI Inflation Update`**, monthly on day 23 at 09:00,
**interactive** (`/it`) — it must run with the user logged on, because Excel
COM needs a desktop session and the workbooks live in synced OneDrive.

```powershell
schtasks /query /tn "CPI Inflation Update"          # check it
schtasks /run   /tn "CPI Inflation Update"          # run it now
schtasks /delete /tn "CPI Inflation Update" /f      # remove it
```

**Italy is not in the scheduled run** — not yet automated. See `mappings/IT.md`.

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
