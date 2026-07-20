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

## 🇨🇭 Switzerland — `CH_inflation_indicators.xlsx` ✅ AUTOMATED (rebased 2026-07-20)

**Source:** BFS/FSO **LIK detailed-results cube** (xlsx, sheet `INDEX_m`)
`https://dam-api.bfs.admin.ch/hub/api/dam/assets/<id>/master`
⚠️ the asset id **changes every month** — scrape it from that month's release page.
**Free:** yes. STAT-TAB PX-Web does **not** carry the LIK.

**All 8 columns are now on Dec 2025 = 100.**

| Col | Header | COICOP | Cube row | |
|----:|--------|--------|---------:|---|
| B | Total (NW01) | `00` Total | 5 | ✅ |
| C | Bread (NW03) | `01.1.1.3.1` **bread only** | 12 | ✅ |
| D | Food (3G28) | `01` food **and non-alcoholic beverages** | 6 | ✅ |
| E | Fish/Seafood (NW05) | `01.1.3` | 34 | ✅ |
| F | Meat (NW04) | `01.1.2` | 20 | ✅ |
| G | Milk/Cheese/Eggs (NW06) | `01.1.4` | 40 | ✅ |
| H | Vegetables (NW09) | `01.1.7` | 73 | ✅ |
| I | Fruit (NW08) | `01.1.6` | 58 | ✅ |

BFS republishes the **whole history** on the current base, so values are read
directly — no splice factor is ever computed. That is why CH is automatable
and Belgium is not.

**Fixed 2026-07-20.** BFS rebased to Dec 2025 = 100 at the January 2026
release. Six of the eight columns were **already correct** (52/52 months
matched) and were left untouched. Two were broken:

- `Total (NW01)` — still on Dec 2020 = 100 to Dec 2025, then jumped bases
- `Food (3G28)` — on 2015 annual mean = 100 throughout, never rebased

Symptom: `Total` appeared to fall **−6.55%** Dec-25 → Jan-26. Now −0.06%.
The Dec-2025 row reads 100.00 across all eight columns.

⚠️ `NW03` is bread only, *not* 01.1.1 "bread, flour and cereals" — do not
"correct" it. ⚠️ The BFS download asset id **changes monthly**; the script
aborts if the cube's base banner is no longer `Basis Dezember 2025=100`.

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

## 🇩🇰🇳🇴🇸🇪 Nordics — `SACN_inflation_indicators.xlsx` ✅ Denmark only

| Col | Header | Source | |
|----:|--------|--------|---|
| B | Food DK (3G06) | **Denmark** — `api.statbank.dk/v1/data`, table `PRIS111` `VAREGR=010000` to 2025-12; then table `PRIS01` `VAREGR=011` **× 1.362583** | ✅ |
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

## 🇮🇹 Italy — `IT_Inflation_indicators.xlsx` 🟡 history ✅ / 2026 🔴

**Source:** ISTAT SDMX — use **`esploradati.istat.it`**, NOT the documented
`sdmx.istat.it` (that host returns HTTP 500 on every data request).
Measure is **NIC** (national CPI), not HICP. **Free:** yes, no key.

```
https://esploradati.istat.it/SDMXWS/rest/data/IT1,167_744_DF_DCSP_NIC1B2015_4,1.0/M.IT.39.4.   ← 2015=100, to 2025-12
https://esploradati.istat.it/SDMXWS/rest/data/IT1,167_745_DF_DCSP_NIC1B2025_4,1.0/M.IT.85.4.   ← 2025=100, 2026-01 on
```

**Base:** 2015 = 100 through 2025-12  **Release:** final ~mid-month M+1
**Latest available:** 2026-06

| Col | Header | ISTAT code | ISTAT label | |
|----:|--------|-----------|-------------|---|
| B | 3G16 - CPI food IT | `01` | food **and non-alcoholic beverages** | ✅ |
| C | TT74 - CPI vegetables IT | `0117` | vegetables | ✅ |
| D | TQ81 - CPI seafood fzn IT | `01134` | frozen seafood | ✅ |
| E | TQ61 - CPI meats IT | `0112` | meat | ✅ |
| F | TQ67 - CPI poultry IT | `01124` | poultry | ✅ |
| G | TQ84 - CPI milk/cheese/eggs IT | `0114` | milk, cheese and eggs | ✅ |
| H | TT96 - CPI non-alcohol beverage IT | `012` | non-alcoholic beverages | ✅ |
| I | TU06 - CPI alcohol beverage IT | `021` | alcoholic beverages | ✅ |
| J | TT61 - CPI fruit IT | `0116` | fruit | ✅ |
| K | TQ76 - CPI fish fresh IT | `01131` | fresh or chilled fish | ✅ |
| L | TT91 - CPI confectionery IT | `01184` | confectionery products | ✅ |
| M | TQ09 - CPI bakery/pastry IT | `01114` | other bakery and pastry products | ✅ |

Column B is division **`01`** (food *and non-alcoholic beverages*), not `011`.
ISTAT's English labels match the column names word for word — mapping is solid,
46–47 of 48 months exact for every column.

**🔴 The 2026-01 → 2026-03 block cannot be reproduced from any source.**
ISTAT closed the 2015=100 NIC at Dec 2025 and started a new NIC on base
2025 = 100 under the **ECOICOP-2** classification. That explains the 1 dp → 2 dp
change and the level shifts. But the file's actual 2026 numbers match *neither*
the new ISTAT series (chain-linked any way we tried), *nor* Eurostat HICP, *nor*
any 5-digit code searched exhaustively. Provenance unknown — possibly a vendor
re-linking or a modelled block. **Do not append to these rows; re-derive them.**

**⚠️ The Dec-2025 row is also off-vintage** — 6 of 12 columns disagree with
ISTAT's current data (first-release vs final revision). Frozen seafood is
material: file 128.2 vs ISTAT 125.1.

## 🇳🇱 Netherlands — `NL_inflation_indicators.xlsx` ✅ AUTOMATED (2026 values corrected)

**Source:** CBS OpenData OData API. **Free:** yes, anonymous.

```
https://opendata.cbs.nl/ODataApi/odata/83131NED/UntypedDataSet   ← 2015=100, to 2025-12 (stopped)
https://opendata.cbs.nl/ODataApi/odata/86141NED/UntypedDataSet   ← 2025=100, live
```
Category keys: `CPI010000` = food & non-alcoholic beverages · `CPI011000` = food
only · `T001112  ` (two trailing spaces) = all items.
**Base:** 2015 = 100 (file scale); multiply the live 2025=100 table by **1.4481**.
**Release:** ~4th–7th of month M+1  **Latest available:** 2026-06

| Col | Header | What it ACTUALLY contains | |
|----:|--------|---------------------------|---|
| B | NL Total CPI (2D76) | CBS `CPI010000` — **food & non-alcoholic beverages**, *not* total CPI | ✅ history |
| C | NL Food CPI (3G20) | a **copy of column B** (rounded to 1 dp before 2022-10) | 🔴 |

**🔴 Two serious problems:**

1. **This file contains no total CPI at all.** The column labelled "NL Total CPI"
   is COICOP 01 food & drinks. The real Dutch all-items CPI (114.53 / 135.26 /
   135.27 for Jan-22 / Nov-25 / Dec-25) appears nowhere. And column C has never
   been an independent food series — it is column B, displayed at 1 dp until
   Sep 2022 and copied verbatim after. So the workbook has **two food columns
   and no total**, despite what the headers say.
2. **The 2026 rows are wrong.** Jan–Mar 2026 were built from the **all-items**
   index multiplied by the *food* chain factor. Feb and Mar reproduce from the
   all-items series to the exact hundredth — proof, not resemblance.

| Month | In file | **True food** (CBS `CPI010000`) | Error |
|-------|--------:|-------------------------:|------:|
| 2026-01 | 143.66 | **144.65** | −0.99 |
| 2026-02 | 145.82 | **145.20** | +0.62 |
| 2026-03 | 147.04 | **146.32** | +0.72 |
| 2026-04 | — | **145.77** | not yet entered |
| 2026-05 | — | **145.06** | not yet entered |
| 2026-06 | — | **144.98** | not yet entered |

Cross-checked against Eurostat (within 0.03). CBS is the source of record.

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
