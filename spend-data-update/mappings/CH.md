# CH — Spend Data Update Mapping

Same concept as UK: move monthly `MMYY.csv` spend files into the master folders,
renaming to `<prefix>-<Mon>-<YY>.csv`.

## Paths

- **Source**: `C:\Users\DChoi\OneDrive - Gategroup\Documents\Spend\Report Spend History Data\CH\`
- **Destination**: `C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\RAW Spend Data\CH_Master_Spend\`

## Rename rule

`MMYY.csv`  →  `<prefix>-<Mon>-<YY>.csv`
(month code → name: 01 Jan … 12 Dec; e.g. `0626.csv` → `...-Jun-26.csv`)

## Folder + prefix mapping

| Source folder | Destination folder   | File prefix    |
|---------------|----------------------|----------------|
| GVA           | CH_GVA-3002-SACS     | `CH_GVA-3002`  |
| ZRH           | CH_ZRH-3001-SACS     | `CH_ZRH-3001`  |

e.g. GVA `0626.csv` → `CH_GVA-3002-SACS\CH_GVA-3002-Jun-26.csv`

## Which files to move each month

Only move files not already present in the destination (compare by converted name).

## Notes / edge cases

- Skip non-standard names: `01.07.2025.csv` and any file not matching `MMYY.csv`.
