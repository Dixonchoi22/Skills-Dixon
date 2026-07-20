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
