# UK — Spend Data Update Mapping

Move monthly spend files from the source into the SharePoint master structure,
renaming each file as it lands.

## Paths

- **Source**: `C:\Users\DChoi\OneDrive - Gategroup\Documents\Spend\Report Spend History Data\UK & IRL\`
- **Destination**: `C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\RAW Spend Data\UK_Master_Spend\`

## Source file naming

Each site folder holds monthly files named `MMYY.csv`:
- `MM` = month (01–12), `YY` = 2-digit year
- e.g. `0626.csv` = June 2026, `1125.csv` = November 2025

Month code → name: 01 Jan · 02 Feb · 03 Mar · 04 Apr · 05 May · 06 Jun ·
07 Jul · 08 Aug · 09 Sep · 10 Oct · 11 Nov · 12 Dec

## Rename rule

`MMYY.csv`  →  `<prefix>-<Mon>-<YY>.csv`

e.g. BRS `0626.csv`  →  `UK_BRS-3040-Jun-26.csv`

## Folder + prefix mapping

### Standard airports (non-JET2)

| Source folder | Destination folder            | File prefix     |
|---------------|-------------------------------|-----------------|
| BRS           | UK_BRS-3040-SACS              | `UK_BRS-3040`   |
| GLA           | UK_GLA-3042-SACS              | `UK_GLA-3042`   |
| LBA           | UK_LBA-3298-SACS              | `UK_LBA-3298`   |
| LGW           | UK_LGW-3039-SACS              | `UK_LGW-3039`   |
| LHN           | UK_LHN-3295-SACS              | `UK_LHN-3295`   |
| LTN           | UK_LTN-3272-SACS              | `UK_LTN-3272`   |
| MAN           | UK_MAN-3420-SACS              | `UK_MAN-3420`   |
| LCY           | UK_LCY-3037-SACS              | `UK_LCY-3037`   |
| LNER          | LNER-2082                     | `UK_LNER-2082`  |

### JET2 sites (all under JET2-SACS\)

Destination is a sub-folder inside `JET2-SACS\`. NOTE the file prefix uses an
apostrophe `'` (e.g. `UK_BFS'JET2`), while the folder uses an underscore `_`.

| Source folder | Destination folder (under JET2-SACS\) | File prefix        |
|---------------|----------------------------------------|--------------------|
| BFS_jet2      | UK_BFS_JET2-3262                        | `UK_BFS'JET2-3262` |
| BHX_Jet2      | UK_BHX_JET2-3268                        | `UK_BHX'JET2-3268` |
| BRS_Jet2      | UK_BRS_JETS-3263  (note: JETS not JET2) | `UK_BRS'JETS-3263` |
| EMA_Jet2      | UK_EMA_JET2-3264                        | `UK_EMA'JET2-3264` |
| GLA_jet2      | UK_GLA_JET2-3267                        | `UK_GLA'JET2-3267` |
| LBA_jet2      | UK_LBA_JET2-3266                        | `UK_LBA'JET2-3266` |
| LPL_jet2      | UK_LPL_JET2-3269                        | `UK_LPL'JET2-3269` |
| Man_jet2      | UK_MAN_JET2-3273                        | `UK_MAN'JET2-3273` |
| NCL_Jet2      | UK_NCL_JET2-3271                        | `UK_NCL'JET2-3271` |
| STN_Jet2      | UK_STN_JET2-3275                        | `UK_STN'JET2-3275` |

### Not UK

| Source folder | Notes                                          |
|---------------|------------------------------------------------|
| DUB           | Ireland — belongs in IRL_Master_Spend, NOT UK. |

## Which files to move each month

Only move files that do **not** already exist in the destination (compare by the
converted destination name). This naturally moves just the new month(s) and skips
historical files already filed.

As of 2026-07-01: destination sites go up to **May-26**; source has **0626.csv
(Jun-26)** pending → June 2026 is the month to move.

## Notes / edge cases

- Source folders also contain non-standard names to **skip**: `01.07.2025.csv`,
  `09.25.csv`, `125.csv`, `0524-0525`, `2023 -2025.csv`, year files `2023/2024/2025`.
  Only clean `MMYY.csv` files are moved.
- Fixed 2026-07-01: source folder `LYC` renamed to `LCY` to match destination.
- Move vs copy: TBD with user (test with copy first, then switch to move).
