# Belgium — `BE_Inflation_indicators.xlsx`

- **Source**: Statbel open data, "CPI All groups" — free, no key, no registration
- **Base**: **2025 = 100** (rebased 2026-07-20; was an older Statbel base)
- **Release**: **last working day of month M itself** — earlier than every other
  country here. Statutory: the CPI must appear in the Belgian Official Journal
  on the last working day for wage/rent indexation to have legal basis.
- **Status**: ✅ automated

## Fetch method

```powershell
curl.exe -sS -L -o "$env:TEMP\be_cpi.zip" `
  'https://statbel.fgov.be/sites/default/files/files/opendata/Indexen%20per%20productgroep/CPI%20All%20groups.zip'
Expand-Archive "$env:TEMP\be_cpi.zip" -DestinationPath "$env:TEMP\be_cpi" -Force
```

5.1 MB zip → **42 MB** pipe-delimited txt (UTF-8 BOM), ~99,000 rows.
**Stream it line by line** — never load it whole.

Fields (0-based): `[0]` year · `[1]` month · `[2]` `CD_COICOP` ·
`[18]` `MS_CPI_IDX` · `[22]` `NM_BASE_YR`.

## Column map

| Col | Header | Source |
|----:|--------|--------|
| A | `Date` | 1st of month |
| B | `3G02 - CPI food BE Index` | `CD_COICOP = "01"` — food **and non-alcoholic beverages** |

⚠️ Must be `"01"` exactly. `"01.1"` is FOOD only (excludes drinks) and does not
match. `"-"` is the all-items total.

## Why this is now safe to automate

Earlier this column was judged **not** automatable, because continuing it on its
old base needed a splice factor of 1.41116 that had been **fitted empirically**
(4 of 5 test points matched; 2026-01 did not). Writing values from a fitted
factor means *computing* numbers rather than *reading* them.

That turned out to be the wrong framing. **Statbel retrospectively republishes
the entire file on the current base** — `NM_BASE_YR` is `2025` on every single
row, including rows dated 2006. So the whole 2006→present history is available
on one consistent official base and no factor is needed at all.

The updater **throws** if `NM_BASE_YR` is ever anything other than a single
value `2025` — that is the signal Statbel has rebased again and the column must
be re-anchored rather than appended to.

## Rebased 2026-07-20

51 historical cells rewritten from the old base onto 2025 = 100, and Apr/May/Jun
2026 appended (100.93 / 100.39 / 99.96).

This changed every historical number in the column, but **not the shape of the
series** — it is a change of unit, like metres to feet. The old/new ratio is
constant across the whole span (111.60/79.07 = 1.4114 at the start,
141.38/100.19 = 1.4111 at the end), so every growth rate and every trend is
unchanged. Reports quoting the old index *levels* need re-running; reports
quoting *inflation rates* do not.

Headers and date format untouched, per user instruction.

## Not usable

Eurostat HICP (`prc_hicp_minr`, BE/CP011) gives 141.46 / 141.05 for Nov/Dec 2025
against the file's 141.67 / 141.38 — close but a different index. Do not
substitute it.
