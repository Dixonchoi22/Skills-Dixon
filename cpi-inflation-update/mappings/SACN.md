# Nordics — `SACN_inflation_indicators.xlsx`

Three independent countries in one workbook. **Only Denmark is automated.**

| Col | Header | Country | Status |
|----:|--------|---------|--------|
| A | `Date (UK)` | — | 1st of month; early rows are **text** dates |
| B | `Food DK (3G06)` | 🇩🇰 Denmark | ✅ automated |
| C | `Food NO (3G21)` | 🇳🇴 Norway | 🔴 2026 not reproducible — **leave blank** |
| D | `Food SE (3G27)` | 🇸🇪 Sweden | 🔴 not confirmed — **leave blank** |

⚠️ Column A mixes **text** dates (`01/02/2022`) with real Excel dates. Always
parse with an explicit `dd/MM/yyyy` format — `[DateTime]::Parse` under a US
locale reads `01/02/2022` as 2 January and silently shifts everything.

---

## 🇩🇰 Denmark — ✅ automated

- **Source**: Statistics Denmark (DST) API — free, no key. `POST` JSON to
  `https://api.statbank.dk/v1/data`
- **Base**: 2015 = 100 (the file's scale)
- **Release**: ~**10th** of month M+1

| Period | Table | `VAREGR` | COICOP |
|--------|-------|----------|--------|
| to 2025-12 | `PRIS111` *(discontinued)* | `010000` | 01 food **and non-alcoholic drinks** |
| 2026-01 on | `PRIS01` | `011` | 01.1 **food only** |

```powershell
$body = @{ table='PRIS111'; format='CSV'; delimiter='Semicolon'
  variables=@(@{code='VAREGR';values=@('010000')},@{code='ENHED';values=@('100')},@{code='Tid';values=@('*')})
} | ConvertTo-Json -Depth 6
curl.exe -s -X POST 'https://api.statbank.dk/v1/data' -H 'Content-Type: application/json' --data-binary "@body.json"
```
CSV is semicolon-delimited with **comma decimals** — replace `,` with `.`.

### Chain-linking 2026 onward

`PRIS01` is on base 2025 = 100. Factor = mean of the twelve **published**
2025 monthly values of `PRIS111 010000`:

```
factor = 136.258333 / 100 = 1.362583
```

Derived from published data, not fitted. Re-derived at run time. Verified:
all three known 2026 values reproduce exactly (137.08 / 136.67 / 136.08).

### ⚠️ Definitional break at Jan 2026

The column silently changes meaning: up to Dec 2025 it is COICOP **01**
(food *and non-alcoholic drinks*); from Jan 2026 it is COICOP **01.1**
(**food only**). Drinks leave the basket. This is how the series was already
being maintained, so we continue it — but any year-on-year comparison spanning
that boundary is comparing two different baskets.

---

## 🇳🇴 Norway — 🔴 do not auto-fill

- **Source**: SSB API, free — `POST https://data.ssb.no/api/v0/en/table/03013`
  (`Konsumgrp=01`, `ContentsCode=KpiIndMnd`), base 2015 = 100. History matches
  the file exactly (4/4 tested).
- **Break**: `03013` discontinued after Dec 2025, replaced by table `14700`
  on base 2025 = 100 (ECOICOP v2). Factor 1.397917.
- **Why blocked**: `14700` publishes **only one decimal**, so the file's
  2-decimal values cannot be reproduced. Chain-linked results come out
  141.19 / 142.45 / 138.95 against the file's 141.23 / 142.52 / 139.19 —
  close but never exact. Precision is simply not recoverable from the free API.

## 🇸🇪 Sweden — 🔴 do not auto-fill

- **Source tried**: SCB `KPICOI80MN`, `VaruTjanstegrupp=01` (1980=100), rebased
  on the 2015 monthly mean 294.7333.
- Matches the file to **Nov 2025** (147.08 exact) then **diverges persistently
  by 0.5–0.8**. Cause unknown. Eurostat HICP also ruled out (Dec-25 = 149.2 vs
  the file's 147.80).
- **Separate hazard**: SCB's own series drops from 132.46 (Mar-26) to 125.14
  (Apr-26) — a −5.5% classification break, not a price move. Must be resolved
  before anything is appended.

---

## Run note (2026-07-20)

Denmark updated: Apr/May/Jun 2026 appended (136.50 / 135.13 / 135.14) and
Jun 2024 corrected 130.60 → 130.50 (DST revision). The three new rows have
Norway and Sweden **blank on purpose** — a visible gap is better than numbers
we cannot verify.
