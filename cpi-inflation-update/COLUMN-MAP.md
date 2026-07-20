# Column → Data Source — master reference

Every column in every CPI workbook, and exactly where its number comes from.

**Legend**

| | Meaning |
|---|---|
| ✅ | **Confirmed** — fetched from the source and matched the file's own history exactly. Safe to automate. |
| 🟡 | **Derived** — the source is right but the number must be transformed (rebased / multiplied by a splice factor) before writing. Not a direct read. |
| 🔴 | **Not confirmed** — could not reproduce the file's values. Do NOT auto-update. |
| ⬜ | **No source** — column is blank in the file and has no known series. Leave blank. |

All values are **index numbers, not percentages** (headers saying `(%)` are misleading).

---

## 🇬🇧 UK — `UK_Inflation_Indicators.xlsx` ✅ AUTOMATED

**Source:** ONS, dataset **MM23**, one request per CDID
`https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/<CDID>/mm23/data`
**Base:** 2015 = 100  **Release:** ~22nd of month M+1  **Free:** yes, no key

| Col | Header | Source series | CDID | |
|----:|--------|---------------|------|---|
| B | UK CPI (%) | CPI 00 All items | `D7BT` | ✅ |
| C | UK RPI (%) | — *(blank; RPI is 1987=100, different scale)* | — | ⬜ |
| D | UK Food CPI (%) | **CPIH** 01 Food **and non-alcoholic beverages** | `L523` | ✅ |
| E | Bakery CPI (%) | CPI 01.1.1.4 Other bakery products *(excl. bread)* | `L78K` | ✅ |
| F | Meat CPI (%) | CPI 01.1.2 Meat | `D7D6` | ✅ |
| G | Fish CPI (%) | CPI 01.1.3 Fish | `D7D7` | ✅ |
| H | Milk, cheese and eggs CPI (%) | CPI 01.1.4 | `D7D8` | ✅ |
| I | Fruit CPI (%) | CPI 01.1.6 Fruit | `D7DA` | ✅ |
| J | Vegetables CPI (%) | CPI 01.1.7 Vegetables incl. potatoes | `D7DB` | ✅ |
| K | Confectionery CPI (%) | CPI 01.1.8.4 Confectionery *(excl. chocolate)* | `L79Y` | ✅ |
| L | Ready Meal CPI (%) | CPI 01.1.9.4 Ready-made meals | `L7A4` | ✅ |
| M | Alcoholic Beverage CPI (%) | CPI 02.1 Alcoholic beverages | `D7CA` | ✅ |
| N | non-alcohol beverage CPI (%) | CPI 01.2 Non-alcoholic beverages | `D7C9` | ✅ |
| O | GROCERY CPI (%) | — *(no ONS series exists)* | — | ⬜ |
| P | DESSERTS CPI (%) | — *(no confirmed series)* | — | ⬜ |
| Q | SANDWICHES CPI (%) | — *(no ONS series exists)* | — | ⬜ |
| R | POULTRY CPI (%) | CPI 01.1.2.4 Poultry | `L78U` | ✅ |
| S | SEAFOOD CPI (%) | CPI 01.1.3.4 **Frozen** seafood | `L78Z` | ✅ |

**Three headers do not mean what they say** — D is CPIH not CPI and includes
soft drinks; E excludes bread; K excludes chocolate. Confirmed by matching
history. Do not "fix" them.

---

## 🇩🇪 Germany — `Germany_inflation_indicators.xlsx` ✅ AUTOMATED

**Source:** Destatis GENESIS table **`61111-0004`**, one request for the whole tree
`https://genesis.destatis.de/genesis/api/rest/tables/61111-0004/data`
**Base:** 2020 = 100  **Release:** ~10th–13th of month M+1  **Free:** yes, anonymous

| Col | Header | Destatis code | |
|----:|--------|---------------|---|
| B | Food (CC13-011) | `CC13-011` | ✅ |
| C | Poultry (CC13-01124) | `CC13-01124` | ✅ |
| D | Meat and meat products (CC13-0112) | `CC13-0112` | ✅ |
| E | Fish, fish products and seafood (CC13-0113) | `CC13-0113` | ✅ |
| F | Dairy products and eggs (CC13-0114) | `CC13-0114` | ✅ |
| G | Fruit (CC13-0116) | `CC13-0116` | ✅ |
| H | Vegetables (CC13-0117) | `CC13-0117` | ✅ |
| I | Confectionery products (CC13-01184) | `CC13-01184` | ✅ |
| J | Alcoholic beverages (CC13-021) | `CC13-021` | ✅ |
| K | Non-alcoholic beverages (CC13-012) | `CC13-012` | ✅ |

Headers already carry the source codes — nothing misleading here.
⚠️ Unpublished months return `0`, not null — the updater rejects `<= 0`.

---

## 🇨🇭 Switzerland — `CH_inflation_indicators.xlsx` 🟡 NOT AUTOMATED

**Source:** BFS/FSO **LIK detailed-results cube** (xlsx, sheet `INDEX_m`)
`https://dam-api.bfs.admin.ch/hub/api/dam/assets/<id>/master`
⚠️ the asset id **changes every month** — scrape it from that month's release page.
**Free:** yes. STAT-TAB PX-Web does **not** carry the LIK.

| Col | Header | Source series | Base | |
|----:|--------|---------------|------|---|
| B | Total (NW01) | LIK Total | Dec 2025 = 100 *(from Jan-26)* | ✅ |
| C | Bread (NW03) | COICOP **01.1.1.3.1 Brot** *(bread only)* | Dec 2025 = 100 | ✅ |
| D | Food (3G28) | COICOP **01** ÷ 2015 annual mean × 100 | **2015 mean = 100** | 🟡 |
| E | Fish/Seafood (NW05) | COICOP 01.1.3 | Dec 2025 = 100 | ✅ |
| F | Meat (NW04) | COICOP 01.1.2 | Dec 2025 = 100 | ✅ |
| G | Milk/Cheese/Eggs (NW06) | COICOP 01.1.4 | Dec 2025 = 100 | ✅ |
| H | Vegetables (NW09) | COICOP 01.1.7 | Dec 2025 = 100 | ✅ |
| I | Fruit (NW08) | COICOP 01.1.6 | Dec 2025 = 100 | ✅ |

**🔴 THIS FILE HOLDS THREE DIFFERENT BASES AT ONCE.** BFS rebased to
Dec 2025 = 100 with the January 2026 release:

- `NW01` — Dec 2020 = 100 up to and including Dec 2025, then Dec 2025 = 100
- `NW03`–`NW09` — an unidentified older base up to Nov 2025, then Dec 2025 = 100
- `3G28` — 2015 annual mean = 100 throughout; **never rebased**

Consequences: the **Dec-2025 row is internally inconsistent** (`NW01` = 106.94 on
the old base sits beside `NW03`–`NW09` = 100.00 on the new one), so any
Dec-25 → Jan-26 change computed from `NW01` shows a false **−6.5%**. And the
pre-2026 history of `NW03`–`NW09` matches no base we could identify — it came
from a Macrobond-internal reference and is **not verifiable**.

`NW03` is bread only, *not* 01.1.1 "bread, flour and cereals" — do not "correct" it.

---

## 🇧🇪 Belgium — `BE_Inflation_indicators.xlsx` 🟡 NOT AUTOMATED

**Source:** Statbel open data, "CPI All groups"
`https://statbel.fgov.be/sites/default/files/files/opendata/Indexen per productgroep/CPI All groups.zip`
(pipe-delimited txt, ~42 MB unzipped) **Free:** yes
**Release:** end of month **M itself** (~24th–30th) — earlier than everyone else

| Col | Header | Source series | |
|----:|--------|---------------|---|
| B | 3G02 - CPI food BE Index | `CD_COICOP = "01"` (Food **and** non-alcoholic beverages) **× 1.41116** | 🟡 |

**Why 🟡:** Statbel rebased to 2025 = 100 in January 2026; the file column is on
an older base (likely 2013 = 100). The factor **1.41116** was **fitted
empirically**, not derived — 4 of 5 test points match exactly, but 2026-01 is
off by 0.32 because Belgium's annual re-weighting took effect that month.
Writing this column means *computing* a number rather than *reading* one.

Not `01.1` "Food" — that does not fit. Eurostat HICP also ruled out.

---

## 🇩🇰🇳🇴🇸🇪 Nordics — `SACN_inflation_indicators.xlsx` 🟡🔴 NOT AUTOMATED

| Col | Header | Source | |
|----:|--------|--------|---|
| B | Food DK (3G06) | **Denmark** — `api.statbank.dk/v1/data`, table `PRIS111` `VAREGR=010000` to 2025-12; then table `PRIS01` `VAREGR=011` **× 1.362583** | 🟡 |
| C | Food NO (3G21) | **Norway** — `data.ssb.no/api/v0/en/table/03013` `Konsumgrp=01` to 2025-12; then table `14700` **× 1.397917** | 🔴 2026 |
| D | Food SE (3G27) | **Sweden** — SCB `KPICOI80MN` `VaruTjanstegrupp=01`, rebased to 2015 mean | 🔴 |

All three are free and key-free. **Release:** DK & NO ~10th, SE ~15th.

- **Denmark** — history exact (7/7). ⚠️ **Definitional break at Jan-2026**: the
  column changes from COICOP **01** (food *and* non-alcoholic drinks) to
  COICOP **01.1** (food only). Drinks silently leave the basket.
- **Norway** — history exact (4/4), but from 2026 SSB's replacement table
  publishes **only one decimal**, so the file's 2-decimal values cannot be
  reproduced. 2026 would be approximate — flagged, not confirmed.
- **Sweden** — **🔴 do not update.** Tracks SCB COICOP 01 to Nov-2025 then
  diverges by 0.5–0.8 persistently, cause unknown. Eurostat ruled out too.
  Separately, SCB's series drops 5.5% from Mar-26 to Apr-26 — a classification
  break, not a price move.

---

## 🇮🇹 Italy — `IT_Inflation_indicators.xlsx` ⏳ research in progress

12 columns, Macrobond tickers (`3G16`, `TT74`, `TQ81` …). Candidate source:
ISTAT SDMX. Known anomaly under investigation: decimals change from 1 dp to
2 dp at 2026-01 and several columns jump — likely a rebase or source switch.

## 🇳🇱 Netherlands — `NL_inflation_indicators.xlsx` ⏳ research in progress

2 columns (`2D76` Total, `3G20` Food). Candidate source: CBS OpenData.
⚠️ Suspected data-entry error: the two columns are **identical to 2 dp from
2025-11 onward** though they differed in 2022 — the Total value looks to have
been pasted into the Food column. Being verified against the real source.

## 🇪🇺 EU — `EU Inflation rate.xlsx` 🚫 OUT OF SCOPE

User instruction: country level only. **Never touch this file.**

---

## Checking a number by hand (human pages, not APIs)

To spot-check any value in a browser:

| Country | Where to look | How |
|---------|---------------|-----|
| 🇬🇧 UK | `https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/<CDID>/mm23` | Swap in the CDID from the UK table above, e.g. `.../timeseries/D7BT/mm23`. The page shows the chart plus a month-by-month table, and a "Download" button (csv/xlsx). |
| 🇩🇪 Germany | `https://www-genesis.destatis.de/datenbank/online/table/61111-0004` | Pick the COICOP code (`CC13-011` etc.) and the months. English toggle top-right. |
| 🇨🇭 Switzerland | [bfs.admin.ch — Landesindex der Konsumentenpreise](https://www.bfs.admin.ch/bfs/de/home/statistiken/preise/landesindex-konsumentenpreise.html) | "Detailresultate" → download the LIK cube (xlsx), sheet `INDEX_m`. |
| 🇧🇪 Belgium | [statbel.fgov.be — Consumer price index](https://statbel.fgov.be/en/themes/consumer-prices/consumer-price-index) | Or the open-data page for the full "CPI All groups" file. |
| 🇩🇰 Denmark | [statistikbanken.dk/PRIS01](https://www.statistikbanken.dk/PRIS01) | Older months are in `PRIS111` (discontinued after Dec 2025). |
| 🇳🇴 Norway | [ssb.no/en/statbank/table/03013](https://www.ssb.no/en/statbank/table/03013) | From Feb 2026 use table `14700`. |
| 🇸🇪 Sweden | [scb.se — Consumer Price Index](https://www.scb.se/en/finding-statistics/statistics-by-subject-area/prices-and-consumption/consumer-price-index/consumer-price-index-cpi/) | ⚠️ our mapping does not reproduce the file — treat with suspicion. |

Every one of these is a free public government page. No login, nothing paid.

**Fastest check:** open the UK or German page above, pick any month already in
the workbook, and compare. The updater does exactly this for *every* filled
cell on every run — 664 cells for the UK, 458 for Germany — and refuses to
write if anything disagrees.

## The root cause of every 🟡 and 🔴

These workbooks were fed by **Macrobond**, which silently handles rebasing and
splices broken series. Without it, each break has to be handled by a human
decision — and nearly every European statistics office rebased in early 2026,
so all of the breaks surfaced at once.

**Recommendation:** for CH, BE and the Nordics, re-anchor each column onto the
current official base instead of maintaining splice factors. The data then
becomes directly readable and verifiable, and automation carries no fabrication
risk. Cost: historical values change, so downstream reports must be re-run.
That is a business decision, not a technical one.
