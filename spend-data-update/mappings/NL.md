# NL — Spend Data Update Mapping

Same concept as UK: move monthly `MMYY.csv` spend files into the master folders,
renaming to `<prefix>-<Mon>-<YY>.csv`.

## Paths

- **Source**: `C:\Users\DChoi\OneDrive - Gategroup\Documents\Spend\Report Spend History Data\NL\`
- **Destination**: `C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\RAW Spend Data\NL_Master_Spend\`

## Rename rule

`MMYY.csv`  →  `<prefix>-<Mon>-<YY>.csv`
(month code → name: 01 Jan … 12 Dec; e.g. `0626.csv` → `...-Jun-26.csv`)

## Folder + prefix mapping

| Source folder | Destination folder      | File prefix     |
|---------------|-------------------------|-----------------|
| North         | North_Unit_3050-SACS    | `NL_North-3050` |
| West          | West_Unit_3477-SACS     | `NL_West-3477`  |

e.g. North `0626.csv` → `North_Unit_3050-SACS\NL_North-3050-Jun-26.csv`

## Which files to move each month

Only move files not already present in the destination (compare by converted name).

## Notes / edge cases

- Skip non-standard names: `01.07.2025.csv` and any file not matching `MMYY.csv`.
- Note: destination folder name uses `_Unit_` (e.g. `North_Unit_3050-SACS`) but the
  file prefix is `NL_<Site>-<code>` (e.g. `NL_North-3050`).
