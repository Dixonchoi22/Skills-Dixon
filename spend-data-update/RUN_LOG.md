# Spend Data Update — Run Log

Newest run first. Each entry records what was done so you can pick up next month.

---

## Run: 2026-07-01  (data month: June 2026 / `0626`)

- **Mode**: COPY (source files kept; nothing deleted from source)
- **Backfill**: yes — also filled any older missing months, not just the newest
- **Result**: **45 files** copied into the SharePoint masters (`RAW Spend Data\`)
- Re-ran verification after: 0 pending, no duplicates.

### What was copied

**UK** (`UK_Master_Spend\`) — 21 files
- Jun-26 for: GLA, LBA, LGW, LHN, LTN, MAN, LCY, LNER, and JET2 sites
  (BFS, BHX, BRS, EMA, GLA, LBA, LPL, MAN, NCL, STN)
- BRS Jun-26 was done earlier as the first test copy
- Backfilled gaps: BRS **Jul-23**, LCY **May-26**, GLA_jet2 **Jan-26**

**Rest** — 24 files
- NL (North, West), CH (GVA, ZRH), IRL (DUB): Jun-26
- SCAN SE (ARN, GOT, MMX), NO (OSL, BGO): Jun-26
- SCAN combined DK&SE (SAP): Jun-26 XLSX
- BE: **May-26** + Jun-26
- Germany (10 active sites: DUS, CGN, FRA_ZD, FRA_ZE, MUC, BER, MUC_2, HAM, STR, HAJ): Jun-26
  - Backfilled gap: HAM (3015) **Aug-25**

### Not done this run (by design)
- **IT / P71**: no data this month (source only up to Apr-26) → nothing to copy. Normal.
- **IT / EOS**: on hold — no more EOS data going forward.
- **SCAN DK / CPH**: on hold — not in use; awaiting naming style from user.
- **Lux**: skipped (user decision).
- **Germany DE_SCN-3017**: no longer used (user decision).

### Notes / decisions captured this run
- Source folder `UK & IRL\LYC` was renamed to **`LCY`** to match the destination.
- Chosen defaults: COPY (keep source) + backfill all missing months.

---

## Next month — quick start

1. Download the new month's files into `...\Report Spend History Data\<country>\` as usual.
2. Preview (safe dry-run — does nothing, just shows the plan):
   `pwsh -File move-spend.ps1`   (add `-Country UK` to limit to one country)
3. When the plan looks right, run for real (COPY, keeps source):
   `pwsh -File move-spend.ps1 -Execute`   (add `-Move` to move instead of copy)
4. Read the **final report** it prints: destination location + original→new filename
   per file, plus a copied/skipped summary. Check the SharePoint masters.
5. Then append a new dated entry at the top of this RUN LOG.

The script has all country mappings built in and skips on-hold/removed items
(IT-EOS, DK/CPH, Lux, DE_SCN-3017) automatically.

Reminders for next time:
- IT should eventually catch up past Apr-26 — check if May/Jun/Jul data appears.
- DK/CPH and IT-EOS are on hold — resume only if you say so.
