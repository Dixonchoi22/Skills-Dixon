---
name: sacs-download
description: >-
  Download procurement data from the Global SACS airline-catering system
  (sacsemea.gategroup.com) and file it into the local spend folders. Two
  reports: PO data (Received Purchase Orders, per operating unit) and Invoice
  data (Vendor Invoice Report, per country master). Use when the user asks to
  download / pull / update SACS PO or invoice data, or to backfill missing
  months. SACS is a PRODUCTION system behind Microsoft SSO — read/export only.
---

# SACS Download — SOP (work in progress)

Automates the monthly pull of PO and invoice data from **Global S.A.C.S.**
(`https://sacsemea.gategroup.com/`, gate gourmet, EMEA PROD) into the local
spend folders. This is the **upstream half** of
[`spend-data-update`](../spend-data-update/SKILL.md).

## 📅 Which months — always full, always up to "last month"

**Always download whole calendar months, and always up to and including the
month BEFORE the current one** (Dixon, 2026-07-20). Never a partial or current
month. In July 2026, coverage must run through **June 2026**.

- PO: the single previous month each run (`MMYY.csv`).
- Invoice: date range `01/MM/YYYY` → last day of `MM`, for every month from the
  last one already on file up to (current month − 1).
- Backfill = fill every missing whole month up to last month. Current target:
  Feb–Jun 2026 (June is the last completed month).

Each monthly run just adds the newly-completed previous month.

## ⛔ Ground rules — this is a PRODUCTION system

- **Export / read only.** Never save, submit, generate, approve, post or
  transfer anything in SACS. Nothing here may change SACS state.
- **Dixon signs in himself** via corporate Microsoft SSO. The automation never
  handles the password. Session persists in `.auth-chrome\` (gitignored).
- **Never overwrite** an existing local file without saying so.
- **Prove on one unit/month, with Dixon watching, before looping.**

## Browser control (no more open/close churn)

One Chrome runs with a debug port; scripts attach over CDP and detach without
closing the window.

```powershell
.\start-browser.ps1          # launch Chrome once (CDP on :9222), sign in
node read-page.js            # attach + describe whatever page is open
node inspect-invoice.js      # attach + describe the invoice report
node download-po.js run      # (PO) set month, export, stage the file
```

`channel: 'chrome'` uses the installed Chrome — no browser binary download
(the corporate firewall blocks those). `connectOverCDP('http://localhost:9222')`
attaches; `browser.close()` only detaches, leaving the window open.

## PO data — see `STEPS-PO.md` + `UNIT-MAP.md`

Per **operating unit** (units with a number; skip MASTER). Reports → Material
Management › Miscellaneous › Received Purchase Order → previous month → CSV →
Export. Saves `<MMYY>.csv` into
`...\Spend\Report Spend History Data\<country>\<unit>\`.

**✅ Proven 2026-07-20:** an automated UK-LCY June export was **byte-for-byte
identical** (same SHA-256) to the manually filed `0626.csv`.

## Invoice data — see `STEPS-INVOICE.md`

Per **country master** (UK/CH/IRL → their MASTER; NL → EU-MASTER; SE/NO/DK have
no master, so per unit, one at a time). Reports → Finance › Vendor Invoice
Report → previous whole month (Date From/To) → Export → **async job** → Refresh
→ download from the job grid. Saves `<Country>-<Mon>-<YYYY>.csv` (per-unit uses
a comma: `SE,ARN-...`) into
`...\PMO Procurement Europe - Documents\Data_EU_Master_Channel\Invoice Level Data\UK_SACS\`
(add only; never alter what is already there).

**Status:** form fully mapped; the async download is **not yet built or
tested**. Outstanding backfill: **Feb–Jun 2026** (last done Jan 2026).

## State (2026-07-20)

- ✅ PO download proven end-to-end (byte-identical).
- ✅ Stable attach-based browser control.
- ✅ Both report forms mapped; unit/country routing decided with Dixon.
- ⏳ Invoice async downloader: build, prove one, then backfill Feb–Jun 2026.
- ⏳ Wire the whole thing into a monthly loop; hand off to `spend-data-update`.
