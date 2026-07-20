# Italy — `IT_Inflation_indicators.xlsx`

- **Source**: ISTAT SDMX — host **`esploradati.istat.it`**
  (the documented `sdmx.istat.it` returns 404 for these dataflows)
- **Measure**: **NIC** (Italian national CPI). **NOT HICP** — see below.
- **Status**: 🔴 **BLOCKED — ISTAT data service returning HTTP 500** (2026-07-20)

## ⛔ Current blocker

Every `/data/` request returns `HTTP 500  "Error during writing responce"`,
across all dataflows, all formats (genericdata XML, csv, json v1/v2), and even
for a single observation (`?lastNObservations=1`).

It is **not** a malformed request: `/dataflow/` structure queries return 200,
and the dataflow id/version were verified against that response. It is a
server-side failure at ISTAT. It worked earlier the same day, so it is
intermittent — **retry before doing anything else**.

```powershell
# health check - should return 200 with observations
curl.exe -sL -H 'Accept: application/vnd.sdmx.genericdata+xml;version=2.1' `
  'https://esploradati.istat.it/SDMXWS/rest/data/IT1,167_744_DF_DCSP_NIC1B2015_4,1.0/M.IT.39.4.01?lastNObservations=1'
```

**Nothing has been written to this workbook.** Do not fill it from Eurostat as
a stand-in — Eurostat publishes HICP, the file uses NIC, and they differ
materially (HICP Italy CP01 = 136.9 where the file has 135.76).

## Dataflows

| Period | Dataflow | Key | Base |
|--------|----------|-----|------|
| to 2025-12 | `IT1,167_744_DF_DCSP_NIC1B2015_4,1.0` | `M.IT.39.4.<code>` | 2015 = 100 |
| 2026-01 on | `IT1,167_745_DF_DCSP_NIC1B2025_4,1.0` | `M.IT.85.4.<code>` | 2025 = 100 |

Key order: `FREQ.REF_AREA.DATA_TYPE.MEASURE.<coicop>`.
`DATA_TYPE` 39 = NIC 2015=100 monthly, 85 = the 2025=100 equivalent.
`MEASURE` 4 = index.

**Release**: flash ~end of month M; final ~mid month M+1.

## Column map (verified — 46–47 of 48 months exact per column)

| Col | Header | ISTAT code | ISTAT label |
|----:|--------|-----------|-------------|
| B | `3G16 - CPI food IT` | `01` | food **and non-alcoholic beverages** |
| C | `TT74 - CPI vegetables IT` | `0117` | vegetables |
| D | `TQ81 - CPI seafood fzn IT` | `01134` | frozen seafood |
| E | `TQ61 - CPI meats IT` | `0112` | meat |
| F | `TQ67 - CPI poultry IT` | `01124` | poultry |
| G | `TQ84 - CPI milk/cheese/eggs IT` | `0114` | milk, cheese and eggs |
| H | `TT96 - CPI non-alcohol beverage IT` | `012` | non-alcoholic beverages |
| I | `TU06 - CPI alcohol beverage IT` | `021` | alcoholic beverages |
| J | `TT61 - CPI fruit IT` | `0116` | fruit |
| K | `TQ76 - CPI fish fresh IT` | `01131` | fresh or chilled fish |
| L | `TT91 - CPI confectionery IT` | `01184` | confectionery products |
| M | `TQ09 - CPI bakery/pastry IT` | `01114` | other bakery and pastry products |

Column B is division **`01`** (food *and* non-alcoholic beverages), not `011`.

## Two problems to resolve once the service is back

### 1. The 2026-01…2026-03 rows have unknown provenance — do not build on them

ISTAT closed the 2015=100 NIC at Dec 2025 and started a new NIC on base
2025 = 100 under the **ECOICOP-2** classification. That explains the 1 dp → 2 dp
change and the level shifts at exactly 2026-01.

But the file's actual 2026 numbers match **none** of: the new ISTAT series
chain-linked by any method tried, Eurostat HICP, or any 5-digit code searched
exhaustively. Implied link factors drift month to month instead of staying
constant (meat 125.5 → 126.4 → 127.3), which rules out a simple rebase.

**Plan: rebuild the whole column set from ISTAT rather than append to these
rows** — the same approach that fixed Switzerland and Belgium.

### 2. ECOICOP-2 may have redefined the categories

Unlike the other countries, Italy changed **classification** as well as base.
Do NOT assume a numeric code means the same thing before and after. **Verify
each code's label in the new classification** before linking old to new.

### Open question to settle first

Does `167_745` (2025=100) carry full monthly history back to 2022, or does it
start at 2026-01? Its title — "Nic - monthly data from 2026 onwards" — suggests
it starts at 2026. If so, Italy cannot be re-anchored the way Switzerland and
Belgium were, and instead needs a chain factor derived from ISTAT's own
published 2025 annual average (the legitimate approach already used for NL and
DK) — **not** an empirically fitted one.

This could not be checked because the service is down.
