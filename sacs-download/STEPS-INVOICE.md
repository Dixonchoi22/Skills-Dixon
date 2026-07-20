# Invoice data download — steps as taught by Dixon (2026-07-20)

Same unit loop and same save location as PO — only the report and the form
differ. See `STEPS-PO.md` for the unit loop and `UNIT-MAP.md` for destinations.

## Where to find it

**Reports → Finance → Vendor Invoice Report**

(PO was under Material Management › Miscellaneous. Invoice is under **Finance**.)

The Finance › report submenu also lists: Goods Received Not Invoiced (GRNI),
Posted Vendor Invoice Reconciliation, Stock Revaluation, Transferred Purchase
Orders, Invoice Change Log, Sales Invoice Posting, Export KPI data… — we want
**Vendor Invoice Report**.

## 🔑 Invoice is downloaded at MASTER level (opposite of PO)

Dixon, 2026-07-20. PO loops operating units and skips MASTER. **Invoice does the
reverse** — the Vendor Invoice Report at master level already aggregates every
unit, so one download = the whole country.

| Country | Download from unit | File | Level |
|---------|--------------------|------|-------|
| UK | **UK-MASTER** | `UK-<Mon>-<YYYY>.csv` | master |
| CH | **CH-MASTER** | `CH-<Mon>-<YYYY>.csv` | master |
| IRL | **IRL-MASTER** | `IRL-<Mon>-<YYYY>.csv` | master |
| NL | **EU-MASTER** ⚠️ | `NL-<Mon>-<YYYY>.csv` | EU master (special!) |
| SE | SE-ARN 3056 · SE-GOT 3057 · SE-MMX 3058 | `SE,<UNIT>-<Mon>-<YYYY>.csv` | per unit — **no master** |
| NO | NO-OSL 3052 · NO-BGO 3053 | `NO,<UNIT>-<Mon>-<YYYY>.csv` | per unit — **no master** |
| DK | (per unit) | `DK,<UNIT>-...` | per unit — **no master** |

⚠️ **SE, NO, DK have NO master level** — they must be done per operating unit,
**one at a time** (Dixon, 2026-07-20). Only UK/CH/IRL/NL have a master to pull
the whole country from.

**8 downloads per month** (4 country masters + SE ×3 + NO ×2), not one per unit.

Filename convention (from newest existing files): full month name + 4-digit
year, e.g. `CH-Jan-2026.csv`, `UK-Dec-2025.csv`; per-unit uses a **comma**:
`SE,ARN-Jan-2026.csv`, `NO,BGO-Jan-2026.csv`.

Date range = **the whole previous month** (Date From `01/MM/YYYY`, Date To =
last day). Confirmed by Dixon.

Save to `...\Data_EU_Master_Channel\Invoice Level Data\UK_SACS\` — add files
only; never touch what is already there.

## Backfill outstanding (as of 2026-07-20)

Newest existing = **Jan 2026** (filed 2026-02-19). Missing months:
**Feb, Mar, Apr, May, Jun 2026** (5 months). 8 downloads × 5 months = 40 files.

## The form

| Field | Value |
|-------|-------|
| ＊Date From | start of the period (`DD/MM/YYYY`) |
| ＊Date To | end of the period (`DD/MM/YYYY`) |
| Include Non-Inventory Orders | ☐ **unticked** (default) |
| Include All Vendors | ☑ **ticked** (default) |
| | → **Export** |

**Difference from PO:** invoice uses a **date range (From / To)**, not a single
month. (Dixon will confirm exactly which range each month — likely the previous
whole month.)

## Confirmed field IDs (from live inspect, 2026-07-20)

Report URL: `/<prefix>/Reports/DashBoard/VendorInvoiceReport`

| Field | Selector | Set to |
|-------|----------|--------|
| Date From | `#FromPeriod` | `01/MM/YYYY` |
| Date To | `#ToPeriod` | last day of month, `DD/MM/YYYY` |
| Include Non-Inventory Orders | `#IsIncludeNonInvOrders` | leave **unticked** |
| Include All Vendors | `#IsIncludeAllVendors` | leave **ticked** |
| Export | `#ExportVendorInvoiceReport` (an `<a>`) | click |
| Refresh job status | `#refereshJobStatus` (button) | click to poll |
| Job grid | `#JobStatusViewGrid` | download link appears here when done |

## ⚠️ Export is ASYNCHRONOUS (unlike PO)

PO downloads the instant you click Export. Invoice does **not** — clicking
Export creates a **job**. The page has a **"Job status"** grid
(columns: JOB TYPE · STATUS · USER · CREATE DATE · DOWNLOAD REPORT) and a
**Refresh** button. Flow:

1. Click Export → a job appears in the grid.
2. Click **Refresh** until STATUS shows done.
3. Download from the **DOWNLOAD REPORT** column of that row.

So the automation must: submit, then poll the job grid until the row is ready,
then click its download link — not just wait for an immediate download.

## Save location (Dixon, 2026-07-20) — DIFFERENT from PO

```
C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\Invoice Level Data\UK_SACS\
```

⚠️ This is the **PMO/SharePoint** tree, NOT `Documents\Spend\Invoice Level Data`.

- `UK_SACS` is a **folder** (odd name — leave it, don't rename).
- Existing files inside are named `<Country>-<Mon>-<Year>.csv`, e.g.
  `CH-Jun-2025.csv`, `CH-Jan-2026.csv`, `IRL-Apr-25.csv`, plus
  `CH_ALL_UNIT-Oct-25.csv`. Mixed year formats (`-25` vs `-2025`).
- Sibling folders `DE_P71`, `DK and SE P07`, `EOS_IT` are other systems — leave.

**Dixon's instructions:** keep everything already there unchanged; do not rename
or move anything; I MAY create country-level and unit-level subfolders inside,
and add new files. Never alter the originals.

⚠️ Invoice is currently saved at **country level** (one file per country/month),
not per unit — Dixon: "I didn't do unit level because I'm lazy; you can do that
for me." So the target structure to build is
`UK_SACS\<country>\<unit>\...` — TBC exactly with Dixon.

## Still to confirm (Dixon continuing later)

- [ ] Exact date range each month (previous whole month? `01` → last day?)
- [ ] The downloaded filename (PO's is `ReceivedPurchaseOrders.csv`)
- [ ] Final filename convention (existing: `<Country>-<Mon>-<Year>.csv`)
- [ ] Country level only, or per-unit as Dixon now wants?
- [ ] Invoice CSV vs xlsx (UK folder had `11.25.csv`; PMO folder has `.csv`)
- [ ] How long the async job typically takes
