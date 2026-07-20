# Netherlands — `NL_inflation_indicators.xlsx`

- **Source**: CBS (Statistics Netherlands) OpenData OData API — free, anonymous
- **Measure**: national **CPI** (not HICP)
- **Base**: 2015 = 100 (the file's scale)
- **Release**: ~**4th–7th** of month M+1
- **Status**: ✅ automated

## Fetch method

```powershell
$b='https://opendata.cbs.nl/ODataApi/odata'
$cat='Bestedingscategorieen eq ''CPI010000'''   # url-encode it
curl.exe -s "$b/83131NED/UntypedDataSet?`$filter=$cat&`$select=Perioden,CPI_1"  # 2015=100, to 2025-12 (STOPPED)
curl.exe -s "$b/86141NED/UntypedDataSet?`$filter=$cat&`$select=Perioden,CPI_1"  # 2025=100, LIVE
```

Category keys: `CPI010000` = food & non-alcoholic beverages ·
`CPI011000` = food only · `T001112  ` (**two trailing spaces**) = all items.
Periods look like `2026MM04`; annual is `2025JJ00`.

### Chain-linking 2026 onward

CBS closed `83131NED` at Dec 2025 and rebased to 2025 = 100 in `86141NED`.
Multiply the new table by CBS's **own published 2025 annual average**:

```
factor = CPI010000[2025JJ00] / 100 = 144.81 / 100 = 1.4481
```

This is **derived from published data, not fitted** — unlike Belgium's, which
is why NL is safe to automate and BE is not. The updater re-derives it at run
time rather than hard-coding it. Sanity check: Dec-2025 on the new base
(100.55) × 1.4481 = 145.61 vs the old table's 145.60 — a 0.01 rounding gap.

## Column map

| Col | Header | Actually contains | CBS key |
|----:|--------|-------------------|---------|
| A | `Date` | 1st of month | — |
| B | `NL Total CPI (2D76)` | **food & non-alcoholic beverages** | `CPI010000` |
| C | `NL Food CPI (3G20)` | a **copy of column B** | `CPI010000` |

## ⚠️ Both headers are wrong — and we deliberately keep them

1. **There is no total CPI in this workbook.** The column labelled
   "NL Total CPI" is COICOP 01 (food & non-alcoholic beverages). The real
   Dutch all-items CPI — 114.53 / 135.26 / 135.27 for Jan-22 / Nov-25 /
   Dec-25 — appears nowhere in the file. It is `T001112  ` if ever wanted.
2. **Column C has never been an independent series.** It is column B, shown at
   1 dp until Sep 2022 and copied verbatim from Oct 2022 on. There is no
   separate food series to recover.

**User decision (2026-07-20): do not add a real total column** — "I have what
I need already". Both columns therefore take `CPI010000`, reproducing the
file's existing behaviour. Headers are never touched.

## Fixed on 2026-07-20

Jan–Mar 2026 had been built from the **all-items** index multiplied by the
*food* chain factor. Feb and Mar reproduced from the all-items series to the
exact hundredth — proof, not resemblance. Corrected to the true food values:

| Month | Was | Now |
|-------|----:|----:|
| Jan 2026 | 143.66 | **144.65** |
| Feb 2026 | 145.82 | **145.20** |
| Mar 2026 | 147.04 | **146.32** |

The eight 2022 cells in column C that differ by ≤0.05 are the old 1 dp
rounding — left alone via `-FixAbove 0.1`. Do not "correct" them.
