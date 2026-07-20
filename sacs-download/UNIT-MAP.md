# SACS unit → local folder map

The download loops over these. Each SACS working unit maps to one folder under
`...\Documents\Spend\Report Spend History Data\<country>\<unit folder>\`.
File saved as `<MMYY>.csv` (previous month).

**Source of truth = the local folders Dixon provided.** If a SACS unit has no
folder and Dixon has not said to add it, skip it.

## ✅ In scope

| SACS unit | Country | Folder | Notes |
|-----------|---------|--------|-------|
| IRL-DUB 3044 | UK & IRL | `UK & IRL\DUB` | |
| UK-STN-JET2 3275 | UK & IRL | `UK & IRL\STN_Jet2` | |
| UK-NCL-JET2 3271 | UK & IRL | `UK & IRL\NCL_Jet2` | |
| UK-BRS 3040 | UK & IRL | `UK & IRL\BRS` | |
| UK-BFS-JET2 3262 | UK & IRL | `UK & IRL\BFS_jet2` | |
| UK-GLA 3042 | UK & IRL | `UK & IRL\GLA` | |
| UK-MAN 3420 | UK & IRL | `UK & IRL\MAN` | |
| UK-LGW 3039 | UK & IRL | `UK & IRL\LGW` | |
| UK-LHN 3295 | UK & IRL | `UK & IRL\LHN` | |
| UK-LBA 3298 | UK & IRL | `UK & IRL\LBA` | |
| UK-LTN 3272 | UK & IRL | `UK & IRL\LTN` | |
| UK-BRS-JET2 3263 | UK & IRL | `UK & IRL\BRS_Jet2` | |
| UK-GLA-JET2 3267 | UK & IRL | `UK & IRL\GLA_jet2` | |
| UK-MAN-JET2 3273 | UK & IRL | `UK & IRL\Man_jet2` | |
| UK-LPL-JET2 3269 | UK & IRL | `UK & IRL\LPL_jet2` | |
| UK-BHX-JET2 3268 | UK & IRL | `UK & IRL\BHX_Jet2` | |
| UK-EMA-JET2 3264 | UK & IRL | `UK & IRL\EMA_Jet2` | |
| UK-LBA-JET2 3266 | UK & IRL | `UK & IRL\LBA_jet2` | |
| UK-LCY 3037 | UK & IRL | `UK & IRL\LCY` | |
| CH-ZRH 3001 | CH | `CH\ZRH` | |
| CH-GVA 3002 | CH | `CH\GVA` | |
| NL-NORTH 3050 | NL | `NL\North` | |
| NL-WEST 3477 | NL | `NL\West` | |
| SE-ARN 3056 | SE | `SE\ARN` | |
| SE-GOT 3057 | SE | `SE\GOT` | |
| SE-MMX 3058 | SE | `SE\MMX` | |
| NO-OSL 3052 | NO | `NO\OSL` | |
| NO-BGO 3053 | NO | `NO\BGO` | |
| IRL-DUG 3204 | UK & IRL | `UK & IRL\DUB` | **merges into DUB** — see below |
| CH-LXL_GVA 3341 | CH | `CH\GVA` | **merges into GVA** — see below |
| **DK-BLL 3023** | DK | `DK\BLL` | **added by Dixon 2026-07-20 — folder must be created (does not exist yet)** |

## Units that MERGE into another unit's file

Dixon, 2026-07-20: some satellite units are combined into the main unit's
monthly file rather than getting their own folder.

| Main unit | + also download | Combined into | Result |
|-----------|-----------------|---------------|--------|
| IRL-DUB 3044 | IRL-DUG 3204 | `UK & IRL\DUB\<MMYY>.csv` | one CSV, both units' data rows |
| CH-GVA 3002 | CH-LXL_GVA 3341 | `CH\GVA\<MMYY>.csv` | one CSV, both units' data rows |

**Merge rule:** download each unit's CSV, then write ONE file = the header row
once + the data rows of both. Do not write two files; do not double the header.

## ⏸️ On hold — do not download

| SACS unit | Reason |
|-----------|--------|
| DK-CPH 3022 | on hold (Dixon); `spend-data-update` agrees |

## ❌ Skip — not in scope

| SACS unit | Reason |
|-----------|--------|
| NL-MMM 4010 | Dixon: "we don't have NL-MMM, skip that" |
| UK-MASTER, IRL-MASTER, CH-MASTER, NL-MASTER, EU-MASTER, DK-MASTER | MASTER level — never |

## ❌ Not from SACS — leave alone

| Item | Reason |
|------|--------|
| `UK & IRL\LNER` | Dixon: "LNER is a different website." Fed from another system, not SACS. This skill does not touch it. |

## Folder gotchas

- Casing is inconsistent in the destination (`BFS_jet2` vs `BHX_Jet2`,
  `Man_jet2` vs `MAN`, `GLA_jet2` vs `GLA`). **Match the existing folder name
  exactly; never create a second one with different casing.**
- Some folders carry legacy messy filenames (`09.25.csv`, `01.07.2025.csv`,
  `0524-0525\`). Ignore those — only ever write a clean `MMYY.csv`. This is the
  same rule `spend-data-update` uses on the read side.

## PO CSV format (for validation)

Header begins:
`Order No.,Item No.,Vendor No.,Vendor Name,Created Date,Time,Created User,Received Date,...,Net Amount,VAT,Total Am,Currency Code[,Sub Store]`

~29–30 columns; some units add a trailing column (e.g. GVA has `Sub Store`).
A valid download has this header. A header-only file (~340 bytes) is a real
"no PO this month" result, not a failure. Use the header to confirm the export
actually produced the PO report and not an error page.
