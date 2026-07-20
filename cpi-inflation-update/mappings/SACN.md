# Nordics — `SACN_inflation_indicators.xlsx`

Three independent countries in one workbook. **Only Denmark is automated.**

| Col | Header | Country | Status |
|----:|--------|---------|--------|
| A | `Date (UK)` | — | 1st of month; early rows are **text** dates |
| B | `Food DK (3G06)` | 🇩🇰 Denmark | ✅ automated — 2015=100 via derived factor |
| C | `Food NO (3G21)` | 🇳🇴 Norway | ✅ automated — **2025=100** (rebased 2026-07-20) |
| D | `Food SE (3G27)` | 🇸🇪 Sweden | ✅ automated — **2020=100** (rebased 2026-07-20) |

**Each column sits on its own country's current official base.** They are three
separate national series that are never compared to each other directly, so
differing bases *across* columns is fine. Differing bases *within* a column is
what breaks things — that is what was fixed.

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

## 🇳🇴 Norway — ✅ automated, base 2025 = 100

- **Source**: SSB table **`14700`**, free, no key.
  `POST https://data.ssb.no/api/v0/en/table/14700`
  `VareTjenesteGrp=01` ("Food and non-alcoholic beverages"),
  `ContentsCode=KpiIndMnd` ("Consumer Price Index (2025=100)"),
  `"response":{"format":"json-stat2"}`. Rate limit 40 req/min.
- **Full history 2000-01 → present on the 2025 = 100 base**, which is why no
  splice factor is needed. Old table `03013` (2015=100) is discontinued.
- **Precision: 1 decimal place only.** That is all SSB publishes on this table.
  It is why the *old* approach failed — it was trying to reproduce 2-decimal
  spliced values that the free API cannot yield. Reading the official series
  directly makes the precision question moot.
- **Release**: ~10th of month M+1.
- SSB's own note: rates of change recomputed from this series may differ in the
  last decimal from rates published before 2026, due to rounding. Levels are fine.

## 🇸🇪 Sweden — ✅ automated, base 2020 = 100

- **Source**: SCB **`KPI2020COICOP2M`** ("CPI by division (COICOP), 2020=100"),
  free, no key.
  `POST https://api.scb.se/OV0104/v1/doris/en/ssd/PR/PR0101/PR0101A/KPI2020COICOP2M`
  `VaruTjanstegrupp=01`, `ContentsCode=0000080C`, json-stat2.
  ⚠️ `ContentsCode` differs per table — it is `0000080H` in `KPI2020COICOPM`.
- **Sweden did NOT rebase to 2025.** It remains on **2020 = 100**, with the full
  1980-01 → present series on that base.
- The old attempt stalled because it used **`KPICOI80MN`** (1980=100), which
  SCB explicitly stopped updating after 2025M12.
- **Release**: ~15th of month M+1.

### ⚠️ Sweden's April 2026 drop is REAL — do not "fix" it

Group `01` falls from 132.46 (Mar-26) to **125.14** (Apr-26), −5.5% in a month,
and SCB carries it straight into its official 12-month rate (Jun-26: **−6.8%**).

**Cause: Sweden cut food VAT from 12% to 6% effective 1 April 2026** (approved
25 Feb 2026, running to 31 Dec 2027). The arithmetic matches: 106/112 = −5.36%
expected against −5.53% observed, the difference being ordinary price movement.

Verified as genuine by fetching group `01` from both `KPI2020COICOP2M` and
`KPI2020COICOPM` — identical to the last decimal across all 558 months,
including the drop. It is not a table-selection artefact.

**Implication:** Swedish food inflation will read ~5.5pp lower than comparable
countries from Apr 2026 until Apr 2027, and will rebound when the cut expires
at end-2027. Flag this in any cross-country comparison. For underlying price
pressure, use a constant-tax measure (HICP-CT) instead.

---

## Run note (2026-07-20)

Denmark updated: Apr/May/Jun 2026 appended (136.50 / 135.13 / 135.14) and
Jun 2024 corrected 130.60 → 130.50 (DST revision). The three new rows have
Norway and Sweden **blank on purpose** — a visible gap is better than numbers
we cannot verify.
