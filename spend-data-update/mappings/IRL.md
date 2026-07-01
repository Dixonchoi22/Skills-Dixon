# IRL (Ireland / DUB) — Spend Data Update Mapping

Same concept as UK. Note the SOURCE lives inside the `UK & IRL` folder, but the
DESTINATION is the separate `IRL_Master_Spend` tree (Dublin is Ireland, not UK).

## Paths

- **Source**: `C:\Users\DChoi\OneDrive - Gategroup\Documents\Spend\Report Spend History Data\UK & IRL\DUB\`
- **Destination**: `C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\RAW Spend Data\IRL_Master_Spend\`

## Rename rule

`MMYY.csv`  →  `<prefix>-<Mon>-<YY>.csv`
(month code → name: 01 Jan … 12 Dec; e.g. `0626.csv` → `...-Jun-26.csv`)

## Folder + prefix mapping

| Source folder     | Destination folder    | File prefix    |
|-------------------|-----------------------|----------------|
| UK & IRL\DUB      | IRL_DUB-3044-SACS     | `IRL_DUB-3044` |

e.g. DUB `0626.csv` → `IRL_DUB-3044-SACS\IRL_DUB-3044-Jun-26.csv`

## Which files to move each month

Only move files not already present in the destination (compare by converted name).

## Notes / edge cases

- Skip non-standard names: `01.07.2025.csv`, `0524-0525`, and any file not matching `MMYY.csv`.
