# UK — `UK_Inflation_Indicators.xlsx`

- **File**: `...\Data_EU_Master_Channel\CPI\UK_Inflation_Indicators.xlsx`
- **Sheet**: `in` (single sheet)
- **Source**: ONS, dataset **MM23**, fetched by CDID
- **Release**: previous month's data, ~mid-month. June 2026 data → **22 July 2026**.
- **Scale**: CPI/CPIH index, **2015 = 100** (NOT a percentage, despite the
  `(%)` in the headers).

## Fetch method

No python/jq on this machine — use curl + PowerShell:

```powershell
curl -s -m 30 "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/<CDID>/mm23/data" -o "$env:TEMP\cpi.json"
$o = Get-Content "$env:TEMP\cpi.json" -Raw | ConvertFrom-Json
$o.months | Select-Object -Last 6 | ForEach-Object { "$($_.year) $($_.month) = $($_.value)" }
```

To find a CDID by title (more reliable than guessing codes):
`https://api.beta.ons.gov.uk/v1/search?q=<terms>&content_type=timeseries`

## Column → CDID map (all verified against Jun 2022 + Feb 2026 + Mar 2026)

| Col | Header | CDID | ONS series |
|----:|--------|------|------------|
| A | `Date` | — | 1st of month, `DD/MM/YYYY` |
| B | `UK CPI (%)` | `D7BT` | CPI INDEX 00: ALL ITEMS |
| C | `UK RPI (%)` | *(blank — see below)* | — |
| D | `UK Food CPI (%)` | `L523` | **CPIH** INDEX 01: Food & non-alcoholic beverages |
| E | `Bakery CPI (%)` | `L78K` | CPI 01.1.1.4 Other bakery products |
| F | `Meat CPI (%)` | `D7D6` | CPI 01.1.2 MEAT |
| G | `Fish CPI (%)` | `D7D7` | CPI 01.1.3 FISH |
| H | `Milk, cheese and eggs CPI (%)` | `D7D8` | CPI 01.1.4 Milk, cheese & eggs |
| I | `Fruit CPI (%)` | `D7DA` | CPI 01.1.6 FRUIT |
| J | `Vegetables CPI (%)` | `D7DB` | CPI 01.1.7 Vegetables incl potatoes |
| K | `Confectionery CPI (%)` | `L79Y` | CPI 01.1.8.4 Confectionery products |
| L | `Ready Meal CPI (%)` | `L7A4` | CPI 01.1.9.4 Ready-made meals |
| M | `Alcoholic Beverage CPI (%)` | `D7CA` | CPI 02.1 Alcoholic beverages |
| N | `non-alcohol beverage CPI (%)` | `D7C9` | CPI 01.2 Non-alcoholic beverages |
| O | `GROCERY CPI (%)` | *(none)* | no ONS series — leave blank |
| P | `DESSERTS CPI (%)` | *(none)* | no confirmed series — leave blank |
| Q | `SANDWICHES CPI (%)` | *(none)* | no ONS series — leave blank |
| R | `POULTRY CPI (%)` | `L78U` | CPI 01.1.2.4 Poultry |
| S | ` SEAFOOD CPI (%)` | `L78Z` | CPI 01.1.3.4 **Frozen** seafood |

## Gotchas — do not "fix" these

Three headers do NOT mean the obvious COICOP class. The mapping above is what
reproduces the file's own history exactly, so keep it:

1. **`UK Food CPI` is CPIH, not CPI.** The whole rest of the file is CPI; this
   one column is CPIH division 01. Rejected candidates: `D7C8` (CPI 01.1 Food)
   = 113.5/143.2/143.6, `D7BU` (CPI division 01) = 113.7/143.9/144.5. Only
   `L523` gives the file's 114.0/144.3/144.8.
2. **`Bakery` excludes bread.** It is class 01.1.1.4 "Other bakery products".
   Rejected: `D7D5` (01.1.1 Bread & cereals) = 116.0/142.2 — way off.
3. **`Confectionery` is the narrow class 01.1.8.4.** Rejected: `D7DC`
   (01.1.8 Sugar, jam, honey, chocolate & confectionery) = 107.0/151.9/154.6.
   Chocolate (01.1.8.3, `L79X`) is a separate series and is NOT included.

Also: **`SEAFOOD` = frozen seafood only** (01.1.3.4), not a broad aggregate.

## Blank columns — leave blank

- **`UK RPI`** — never populated. Likely `CHAW` (RPI All Items) if ever needed,
  but ⚠️ RPI is based **Jan 1987 = 100**, so its values (~410) are on a totally
  different scale from every other column. Do not fill without asking the user.
- **`GROCERY`, `SANDWICHES`** — no such ONS series exists. Internal/derived
  categories. Leave blank.
- **`DESSERTS`** — no confirmed series. Nearest guess `L7A2` (01.1.8.5 Edible
  ices & ice cream), unverified. Leave blank.
