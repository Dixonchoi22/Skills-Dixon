# Germany — `Germany_inflation_indicators.xlsx`

- **File**: `...\Data_EU_Master_Channel\CPI\Germany_inflation_indicators.xlsx`
- **Sheet**: `Sheet1`
- **Source**: Destatis (Statistisches Bundesamt), GENESIS-Online table
  **`61111-0004`** — Verbraucherpreisindex, COICOP 2–5-digit hierarchy
- **Measure**: national **VPI**, **base 2020 = 100**
- **Release**: full COICOP detail ~**10th–13th** of month M+1
  (June 2026 detail was published 2026-07-10)
- **Status**: ✅ confirmed — all 30 known values matched, 458 historical cells
  re-verified by the updater

## Fetch method

**One request returns the entire COICOP tree** (~1.7 MB), no key, no login:

```powershell
curl.exe -s -m 180 "https://genesis.destatis.de/genesis/api/rest/tables/61111-0004/data" -o "$env:TEMP\de.json"
```

Payload is JSON-stat-like: `data[]` holds 4 datasets, split by COICOP depth —
`CC13A3` (3-digit), `CC13A4` (4-digit), `CC13A5` (5-digit). Each has
`id` = dimension order `[statistic, DINSG, content, MONAT, JAHR, CC13Ax]`,
`size`, and a flat row-major `value[]` (last dimension fastest):

```
offset = ((monatIdx * nYears) + jahrIdx) * nCodes + codeIdx
```

Look a code up in whichever dataset contains it (see `update-cpi.ps1`).

## Column → Destatis code map (all verified)

| Col | Header | Destatis code |
|----:|--------|---------------|
| A | `Date` | — (1st of month, `dd/mm/yyyy`) |
| B | `Food (CC13-011)` | `CC13-011` |
| C | `Poultry (CC13-01124)` | `CC13-01124` |
| D | `Meat and meat products (CC13-0112)` | `CC13-0112` |
| E | `Fish, fish products and seafood (CC13-0113)` | `CC13-0113` |
| F | `Dairy products and eggs (CC13-0114)` | `CC13-0114` |
| G | `Fruit (CC13-0116)` | `CC13-0116` |
| H | `Vegetables (CC13-0117)` | `CC13-0117` |
| I | `Confectionery products (CC13-01184)` | `CC13-01184` |
| J | `Alcoholic beverages (CC13-021)` | `CC13-021` |
| K | `Non-alcoholic beverages (CC13-012)` | `CC13-012` |

Conveniently, this file's headers already carry the source codes — unlike the
UK file, nothing here is misleading.

## Gotchas

1. **⚠️ Unpublished months come back as `0`, not null.** A CPI index is never
   0, so the updater rejects any value `<= 0`. Without that check, July–December
   2026 would be written as `0` and read downstream as −100% inflation. This
   bit us once — do not remove the guard.
2. **Rows must be appended.** Unlike the UK file, this workbook has no
   pre-created future rows. New rows copy the number formats of the row above
   (`dd/mm/yyyy` for the date, `0.00` for values).
3. **Excel COM hangs on this file** unless links are suppressed — open with
   `$excel.AskToUpdateLinks = $false` and `Workbooks.Open($f, 0, $false)`.
   The workbook has external links and Excel otherwise waits forever on a
   hidden dialog. Use `read-xlsx.ps1` for read-only checks.
4. **Eurostat HICP is NOT a substitute.** Rebased to 2020, Eurostat gives
   115.75 / 137.32 / 138.95 where the file (and Destatis VPI) has
   115.7 / 135.9 / 137.5. Different index — never fall back to it.
5. **Endpoint is undocumented.** It is the GENESIS web app's own REST API,
   anonymous and stable in practice, but could change. The documented
   alternative (`genesis.destatis.de/genesisWS/rest/2020`, POST only) works
   but requires a free registered account.
6. **Destatis rebases roughly every 5 years** (2020=100 since 2023). A rebase
   resets the whole series and will show up as mass mismatches — that is the
   signal to re-anchor, not to `-FixMismatches`.

## Known discrepancies (left as-is, awaiting user decision)

| Month | Column | In file | Destatis now |
|-------|--------|--------:|-------------:|
| Oct 2025 | Non-alcoholic beverages | 141.2 | 142.2 |
| Nov 2025 | Poultry | 149.3 | 149.4 |

Almost certainly Destatis post-publication revisions. Correct with
`-FixMismatches` if the user agrees.
