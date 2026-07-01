---
name: spend-data-update
description: >-
  Update the monthly EU procurement spend masters: move Dixon's spend files from
  the local "Report Spend History Data" source into the SharePoint "RAW Spend
  Data" master folders, renaming each file to the destination convention. Use
  when the user asks to update / file / move / sort this month's spend data, or
  names a country like UK, NL, CH, IRL, SCAN, BE, Germany, IT.
---

# Spend Data Update — SOP

Each month, procurement spend files are downloaded per country into a local
source tree. This skill files them into the SharePoint master tree, renaming
each file to that country's naming convention.

## Paths

- **Source root**:
  `C:\Users\DChoi\OneDrive - Gategroup\Documents\Spend\Report Spend History Data\`
- **Destination root**:
  `C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\RAW Spend Data\`

## Core concept

Source files are monthly, named `MMYY` (`MM` = month 01–12, `YY` = 2-digit year).
- e.g. `0626` = June 2026, `1125` = November 2025.

Each is moved into its destination folder and renamed to
`<prefix>-<Mon>-<YY>` (or the country-specific variant), where the prefix and
folder come from that country's mapping file. Extension is preserved
(`.csv` or `.XLSX`).

Month code → name: 01 Jan · 02 Feb · 03 Mar · 04 Apr · 05 May · 06 Jun ·
07 Jul · 08 Aug · 09 Sep · 10 Oct · 11 Nov · 12 Dec

## Per-country mappings (source of truth)

Each country's exact folder map, file prefix and rename style is in
`mappings/<country>.md`. ALWAYS read the relevant mapping file before moving.

| Country / region | Mapping file      | Rename style (example)                          | Status |
|------------------|-------------------|-------------------------------------------------|--------|
| UK               | `mappings/UK.md`  | `UK_BRS-3040-Jun-26.csv` (JET2 uses `'`)        | ✅ active |
| NL               | `mappings/NL.md`  | `NL_North-3050-Jun-26.csv`                       | ✅ active |
| CH               | `mappings/CH.md`  | `CH_GVA-3002-Jun-26.csv`                          | ✅ active |
| IRL (DUB)        | `mappings/IRL.md` | `IRL_DUB-3044-Jun-26.csv` (source under UK & IRL) | ✅ active |
| SCAN (SE/NO)     | `mappings/SCAN.md`| `SCAN_SE'ARN-3056-Jun-26.csv`; XLSX → DK&SE-SAP   | ✅ active |
| BE               | `mappings/BE&DE.md`| `BE_BRU-1261_2026 - Jun.26.XLSX`                 | ✅ active |
| Germany (DE)     | `mappings/BE&DE.md`| `DE_DUS-0313-Jun_2026.XLSX` (full 4-digit year)  | ✅ active |
| IT — P71         | `mappings/IT.md`  | `IT_1411&1413_Jun_26.XLSX` (source `IT\P71\`)     | ✅ active |
| IT — EOS         | `mappings/IT.md`  | unit CSV → `IT_Master_EOS\<unit>\`                | ⏸️ on hold |
| SCAN — DK/CPH    | `mappings/SCAN.md`| —                                                | ⏸️ on hold |
| Lux              | (not mapped)      | —                                                | 🚫 skipped (user) |

## Monthly procedure

For each ACTIVE country the user asks for (or all active countries):

1. **Read** that country's `mappings/<country>.md` for its folder map + naming style.
2. **Scan** each source folder for clean `MMYY` files only.
   - SKIP anything that is not a clean `MMYY.<ext>`: e.g. `01.07.2025.csv`,
     `09.25.csv`, `125.csv`, `0524-0525`, year files (`2023.XLSX`, `2025 -1125.XLSX`),
     and consolidated/history files (`2023 -2025_10423.csv`, `DE_SCN-3017_2023-2025(30.6).XLSX`).
3. **Convert** each `MMYY` filename to the destination name using that country's rule.
4. **Check** the destination folder — if the converted file already exists there, SKIP
   (already filed). This means only genuinely new months move.
5. **Move** the file to the destination folder under its new name.

## Safety rules

- **Copy-test first.** When running a country for the first time (or after any mapping
  change), COPY instead of move, show the user the planned before→after list, and get
  confirmation before switching to real moves.
- **Never overwrite.** If a destination file with the target name already exists, skip
  and report it — do not overwrite.
- **Never touch** on-hold / do-not-touch items: IT-EOS, DK/CPH, and
  `SCAN_Master_Spend\NO_Spend_Data- Old System\`.
- **Report** at the end (REQUIRED — see "Final report" below).

## Final report (always output at the end of a run)

After every run, tell the user, per file that was actioned:

1. **The destination location** it was moved/copied to (full folder path).
2. **The naming change** — the original source filename → the new destination filename.

Present it as a table grouped by unit, e.g.:

| Unit | Original file | New name | Destination folder |
|------|---------------|----------|--------------------|
| BRS  | 0626.csv      | UK_BRS-3040-Jun-26.csv | ...\UK_Master_Spend\UK_BRS-3040-SACS\ |

Then a summary line: total copied/moved, already-existed (skipped), non-standard
(skipped), and any warnings (e.g. missing destination folders, historical gaps filled).
State whether the run was COPY or MOVE.

## Open items

- **Lux** — 🚫 skipped by user; do not process.
- **Germany DE_SCN-3017** — 🚫 no longer used (2026-07-01); do not process.
- **IT-EOS** — on hold; no more EOS data expected. Resume only if user says so.
- **SCAN DK/CPH** — on hold; user will provide the file-naming style when it restarts.
