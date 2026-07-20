# Basic Article List download — steps as taught by Dixon (2026-07-20)

A THIRD SACS report to pull monthly, alongside PO and Invoice.

System: Global S.A.C.S. (`sacsemea.gategroup.com`). Signed in via corporate SSO.

## Where

**Reports → Material Management → Basic Article Lists**
(same Material Management report menu as PO, different item.)

Path: `Material Management > Basic Article Lists`.

## Settings (from Dixon's screenshots)

| Field | Value |
|-------|-------|
| Export Report As | **CSV** |
| Select Report | **STANDARD BASIC ARTICLE LIST** |
| Article Selection | **ALL ARTICLES** |
| Include | **ONLY ACTIVE BASIC ARTICLES** |
| | → **Export** |

Article Selection options seen: Pick Article Group(s) / Pick Vendor(s) /
Pick Articles / Number Intervals / **All Articles** / All Traceable Articles.
Include options seen: **Only Active Basic Articles** / Only Inactive Articles /
Both Active and Inactive / Created After Certain Date.

## Save location

```
C:\Users\DChoi\OneDrive - Gategroup\PMO Procurement Europe - Documents\Data_EU_Master_Channel\Basic Article List\
```

## Cadence

Monthly. "Update this basic article data every month" (Dixon).

## Still to confirm
- [ ] Per unit, per country master, or one global list?
- [ ] Filename convention in the destination folder
- [ ] Does Export download immediately (like PO) or async job (like Invoice)?
- [ ] The downloaded filename SACS gives it
