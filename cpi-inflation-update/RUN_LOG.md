# CPI Inflation Update — Run Log

## 2026-07-20 — UK (first run)

**Mode:** verify + write (`update-cpi.ps1`, no `-FixMismatches`)
**File:** `UK_Inflation_Indicators.xlsx`
**Backup:** `%TEMP%\cpi-backups\UK_Inflation_Indicators.bak-20260720-130021.xlsx`

### Verification
636 existing cells re-checked against ONS MM23 — all 14 mapped columns
confirmed correct. Column → CDID map established and recorded in
`mappings/UK.md`.

### Written — 28 blank cells filled

| Month | Columns filled | Notes |
|-------|----------------|-------|
| Mar 2026 | Bakery only (158.0) | the one gap in an otherwise complete row |
| Apr 2026 | 13 columns | Food (144.9) was already present and matched |
| May 2026 | 14 columns (all) | row was entirely empty |

Jun 2026 row left blank — **ONS had not published it**. Release date
**22 July 2026**. Re-run then to fill it.

### ⚠️ Pre-existing discrepancies found — NOT changed, awaiting user decision

8 already-filled cells disagree with ONS. Left untouched.

**A. `UK CPI` Jan–Jun 2024 is shifted one month late** (systematic entry error —
each cell holds the *previous* month's figure; self-corrects from Jul 2024):

| Month | In file | ONS actual |
|-------|--------:|-----------:|
| Jan 2024 | 132.2 | 131.5 |
| Feb 2024 | 131.5 | 132.3 |
| Mar 2024 | 132.3 | 133.0 |
| Apr 2024 | 133.0 | 133.5 |
| May 2024 | 133.5 | 133.9 |
| Jun 2024 | 133.9 | 134.1 |

**B. Two single-cell differences** (possibly ONS post-publication revisions):

| Month | Column | In file | ONS |
|-------|--------|--------:|----:|
| Jul 2025 | Alcoholic Beverage | 123.4 | 123.3 |
| Dec 2025 | Ready Meal | 158.3 | 158.5 |

To correct these, re-run with `-FixMismatches`.

### Still open
- Countries DE / IT / CH / NL / BE / SACN — source not yet identified.
- Scheduled Task not yet created.

## 2026-07-20 — Germany (first run)

**Written:** 3 new dated rows appended — Apr / May / Jun 2026, 10 columns each.
458 existing cells verified against Destatis first.
**Backup:** `%TEMP%\cpi-backups\Germany_inflation_indicators.bak-20260720-133908.xlsx`

⚠️ 2 cells still disagree and were NOT changed (a `-FixMismatches` run was
blocked by a permission prompt): Oct 2025 non-alcoholic beverages 141.2 vs
142.2, Nov 2025 poultry 149.3 vs 149.4. Likely Destatis revisions.

## 2026-07-20 — Netherlands (first run)

**Written:** 6 cells corrected + 3 new rows appended (Apr / May / Jun 2026).
88 existing cells verified.
**Backup:** `%TEMP%\cpi-backups\NL_inflation_indicators.bak-20260720-140412.xlsx`

Jan–Mar 2026 had been built from the **all-items** index × the *food* chain
factor. Corrected to the true food series:

| Month | Was | Now |
|-------|----:|----:|
| Jan 2026 | 143.66 | 144.65 |
| Feb 2026 | 145.82 | 145.20 |
| Mar 2026 | 147.04 | 146.32 |

Appended: Apr 145.77 · May 145.06 · Jun 144.98.

Eight 2022 cells in column C differ by ≤0.05 (old 1 dp rounding) — left alone
via `-FixAbove 0.1`.

**Not done, by user instruction:** no real total-CPI column was added, despite
neither existing column containing one. User: "I have what I need already".

## 2026-07-20 — Nordics / Denmark only (first run)

**Written:** Jun 2024 corrected 130.60 → 130.50 (DST revision) + 3 new rows
appended (Apr 136.50 / May 135.13 / Jun 135.14). 50 existing cells verified.
**Backup:** `%TEMP%\cpi-backups\SACN_inflation_indicators.bak-20260720-140726.xlsx`

**Norway and Sweden left blank on the new rows on purpose** — neither source is
confirmed (see `mappings/SACN.md`). A visible gap beats unverifiable numbers.

## 2026-07-20 — Switzerland (rebase to Dec 2025 = 100)

**Written:** 100 cells rewritten + 2 new rows (May / Jun 2026).
316 existing cells verified untouched.
**Backup:** `%TEMP%\cpi-backups\CH_inflation_indicators.bak-20260720-144207.xlsx`

Correction to the earlier assessment: **six of eight columns were already
correct** on Dec 2025 = 100 and were not touched (52/52 months matched BFS).
Only two columns were broken:

| Column | Was on | Rows rewritten |
|--------|--------|---------------:|
| `Total (NW01)` | Dec 2020 = 100 until Dec 2025 | 48 |
| `Food (3G28)`  | 2015 annual mean = 100 throughout | 52 |

Effect, Dec-2025 to Jan-2026 month-on-month:

| Series | Before | After |
|--------|-------:|------:|
| Total | -6.55% | -0.06% |
| Food | +0.69% | +0.72% |
| Bread / Fish / Meat / Milk / Veg / Fruit | unchanged | unchanged |

The six unchanged columns are the proof the rewrite was contained. The whole
Dec-2025 row now reads 100.00 across all eight columns - one base, one series.

Headers and date format untouched, per user instruction.

## 2026-07-20 — Belgium, Norway, Sweden (rebase + update)

All three had been declared "cannot automate". That judgement was wrong — it
came from trying to CONTINUE each column on its old base, which needed fitted
splice factors. All three statistics offices publish their **full history on the
current base**, so each column was re-anchored and no factor is used anywhere.

| Country | New base | Cells rewritten | Months appended |
|---------|----------|----------------:|-----------------|
| Belgium | 2025=100 | 51 | Apr/May/Jun 2026 (100.93 / 100.39 / 99.96) |
| Norway  | 2025=100 | 51 | Apr/May/Jun 2026 (102.30 / 102.10 / 102.40) |
| Sweden  | 2020=100 | 51 | Apr/May/Jun 2026 (125.14 / 124.63 / 123.91) |

Denmark untouched — its 54 cells re-verified and still match.
Backups: `%TEMP%\cpi-backups\BE_...bak-20260720-145533.xlsx`,
`SACN_...bak-20260720-145632.xlsx`.

Rebasing changes index LEVELS but not the shape of the series — growth rates and
trends are unchanged. Reports quoting index levels need re-running; reports
quoting inflation rates do not.

### ⚠️ Sweden April 2026: −5.5% is a real VAT cut, not a data fault

Food VAT cut 12% → 6% from 1 Apr 2026 (to 31 Dec 2027). SCB carries it into its
official 12-month rate (−6.8% at Jun-26). Swedish food inflation will read
~5.5pp below comparable countries until Apr 2027 and rebound at end-2027.
Do not "correct" it. See `mappings/SACN.md`.
