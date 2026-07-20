# Switzerland — `CH_inflation_indicators.xlsx`

- **Source**: BFS/FSO **LIK detailed-results cube** (xlsx), sheet `INDEX_m`
- **Measure**: Swiss LIK (national CPI)
- **Base**: **December 2025 = 100** (all 8 columns, since the 2026-07-20 rebase)
- **Release**: ~**start of month M+1**
- **Status**: ✅ automated

## Fetch method

```powershell
curl.exe -sL "https://dam-api.bfs.admin.ch/hub/api/dam/assets/<ASSET_ID>/master" -o lik.xlsx
```

⚠️ **The asset id changes every month.** Find the current one on that month's
BFS release page (`bfs.admin.ch/news/de/<year>-<nn>`) and update `$CH_ASSET` in
`update-cpi.ps1`. The script reads cell `A3` of the cube and **throws** if the
banner is no longer `Basis Dezember 2025=100`, so a stale or rebased cube fails
loudly rather than writing wrong numbers.

STAT-TAB PX-Web does **not** carry the LIK — this cube is the only free
machine-readable route.

### Cube layout (`INDEX_m`, sheet1)

- Rows 1–3: banner (`A3` = the base statement)
- Row 4: header. Cols A–M metadata (`E` = COICOP code, `L` = English label),
  col N = weight, **col O onward = one column per month**, headed with an Excel
  date serial. History runs from **1982-12** to the current month.
- Find each series' row by its COICOP code in column E (first occurrence — the
  sheet repeats blocks further down, around row 576).

**BFS republishes the entire history on the current base**, so we read official
rebased numbers directly and never compute a splice factor. This is why CH is
safe to automate where Belgium is not.

## Column map

| Col | Header | COICOP | Cube row | Meaning |
|----:|--------|--------|---------:|---------|
| B | `Total (NW01)` | `00` | 5 | Total, all items |
| C | `Bread (NW03)` | `01.1.1.3.1` | 12 | **Bread only** |
| D | `Food (3G28)` | `01` | 6 | Food **and non-alcoholic beverages** |
| E | `Fish/Seafood (NW05)` | `01.1.3` | 34 | Fish and seafood |
| F | `Meat (NW04)` | `01.1.2` | 20 | Meat, meat products |
| G | `Milk/Cheese/Eggs (NW06)` | `01.1.4` | 40 | Milk, cheese and eggs |
| H | `Vegetables (NW09)` | `01.1.7` | 73 | Vegetables, mushrooms and potatoes |
| I | `Fruit (NW08)` | `01.1.6` | 58 | Fruit |

`NW03` is **bread only** (01.1.1.3.1), NOT 01.1.1 "bread, flour and cereal
products". Do not "correct" it — 01.1.1 does not match the file's history.

## The 2026-07-20 rebase — what was actually wrong

BFS rebased to Dec 2025 = 100 with the January 2026 release. Contrary to the
first assessment, **six of the eight columns were already fully on the new
base** — Bread, Fish, Meat, Milk, Vegetables and Fruit each matched BFS for all
52 months, and were left completely untouched.

Only two columns were broken:

| Column | Problem | Rows rewritten |
|--------|---------|---------------:|
| `Total (NW01)` | still on **Dec 2020 = 100** to Dec 2025, then jumped to the new base at Jan 2026 | 2022-01 → 2025-12 (48) |
| `Food (3G28)` | on **2015 annual mean = 100** throughout; never rebased at all | 2022-01 → 2026-04 (52) |

The visible symptom was `Total` appearing to fall **−6.55%** from Dec 2025 to
Jan 2026 — an artefact of comparing two bases, not a price movement. After the
fix that reads −0.06%, and the whole Dec-2025 row is 100.00 across all eight
columns. The other six columns' month-on-month changes are byte-identical
before and after, which is the proof they were not disturbed.

**User constraints honoured:** column headers and the date format were not
changed. Only index values were rewritten.
