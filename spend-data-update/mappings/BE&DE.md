# BE & DE (Belgium + Germany) — Spend Data Update Mapping

Belgium and Germany share ONE destination tree: `BE&DE_Master_Spend\`.
The source folders are separate (`BE\` and `Germany\`). Files are `.XLSX`.
**Each country has its OWN file-naming style — different from UK.**

## Paths

- **Source**: `...\Report Spend History Data\BE\`  and  `...\Report Spend History Data\Germany\`
- **Destination**: `...\Data_EU_Master_Channel\RAW Spend Data\BE&DE_Master_Spend\`

Month code → name: 01 Jan · 02 Feb · 03 Mar · 04 Apr · 05 May · 06 Jun ·
07 Jul · 08 Aug · 09 Sep · 10 Oct · 11 Nov · 12 Dec

---

## 1. Germany (DE)

Source Germany sub-folders are named by SITE CODE (e.g. `0313`, `3447`). Each holds
monthly files `MMYY.XLSX`.

**Rename rule**: `MMYY.XLSX` → `<prefix>-<Mon>_<YYYY>.XLSX`
- NOTE: month uses `<Mon>_<YYYY>` — underscore + **FULL 4-digit year**.
- e.g. `0426.XLSX` (code 0313) → `DE_DUS-0313-Apr_2026.XLSX`

| Source folder (code) | Destination folder    | File prefix       |
|----------------------|-----------------------|-------------------|
| Germany\0313         | DE_DUS_0313-P71       | `DE_DUS-0313`  ⚠️ |
| Germany\0314         | DE_CGN-0314-P71       | `DE_CGN-0314`     |
| Germany\0315         | DE_FRA_ZD-0315-P71    | `DE_FRA_ZD-0315`  |
| Germany\0316         | DE_FRA_ZE-0316-P71    | `DE_FRA_ZE-0316`  |
| Germany\0319         | DE_MUC-0319-P71       | `DE_MUC-0319`     |
| Germany\0325         | DE_BER-0325-P71       | `DE_BER-0325`     |
| Germany\3007         | DE_MUC_2-3007-P71     | `DE_MUC_2-3007`   |
| Germany\3015         | DE_HAM-3015-P71       | `DE_HAM-3015`     |
| Germany\3016         | DE_STR-3016-P71       | `DE_STR-3016`     |
| ~~Germany\3017~~     | ~~DE_SCN-3017-P71~~   | 🚫 no longer used |
| Germany\3447         | DE_HAJ-3447-P71       | `DE_HAJ-3447`     |

🚫 **DE_SCN-3017** is no longer used (user, 2026-07-01) — SKIP it. Do not move
anything into `DE_SCN-3017-P71`. Active DE sites are the other 10 codes above.

⚠️ Folder `DE_DUS_0313-P71` uses an underscore before the code, but the FILE prefix
is `DE_DUS-0313` (hyphen). All other DE file prefixes = folder name minus `-P71`.
Safest: read the existing files in each dest folder to confirm the exact prefix.

---

## 2. Belgium (BE)

Source `BE\` holds monthly files `MMYY.XLSX` at the top level (single site, Brussels).

**Rename rule**: `MMYY.XLSX` → `BE_BRU-1261_<YYYY> - <Mon>.<YY>.XLSX`
- NOTE the unusual style: `_<YYYY>` then space-hyphen-space, then `<Mon>.<YY>` (period).
- e.g. `0126.XLSX` → `BE_BRU-1261_2026 - Jan.26.XLSX`
- e.g. `1225.XLSX` → `BE_BRU-1261_2025 - Dec.25.XLSX`

| Source folder | Destination folder    | File pattern                          |
|---------------|-----------------------|---------------------------------------|
| BE            | BE_BRU-1261-P71       | `BE_BRU-1261_<YYYY> - <Mon>.<YY>.XLSX` |

---

## Which files to move each month

Only move files not already present in the destination (compare by converted name).
Skip non-standard names, e.g. `01.07.2025.XLSX`, year files (`2023.XLSX`,
`2025 -1125.XLSX`), and any consolidated/history files like `0313 1.23-6.25.XLSX`,
`0313 2024.XLSX`, `DE_SCN-3017_2023-2025(30.6).XLSX`. Only clean `MMYY.XLSX` move.
