# Skills Log

A record of when each skill was built or worked on, and what state it was left
in. Purpose: so neither Dixon nor Claude has to rely on memory about what was
done, when, or what is still outstanding.

**Keep this updated** — add an entry whenever a skill is created or
substantially changed. Newest first.

---

## 2026-07-20 — `cpi-inflation-update` — 🆕 built

**Session: ~13:00 → 15:15 (12 commits)**

Monthly food-CPI index updates for 8 country workbooks in the EU Procurement
SharePoint area (`Data_EU_Master_Channel\CPI\`).

**Left in this state:**

| | |
|---|---|
| Automated | 7 files — UK, Germany, Netherlands, Switzerland, Belgium, Denmark, Norway, Sweden |
| Data current to | June 2026 (UK to May; June lands 22 July) |
| Scheduled | Windows Task `CPI Inflation Update`, monthly day 23, 09:00 |
| ⏳ Outstanding | **Italy** — ISTAT's API was returning HTTP 500 all day. Mapping is fully confirmed; just needs a retry. See `cpi-inflation-update/mappings/IT.md`. |
| Out of scope | `EU Inflation rate.xlsx` — country level only, per Dixon |

**Key constraint Dixon set:** only ever ADD a date and ADD an index value.
Never rename a header, change a column, or change the date format — the
workbooks feed downstream connections.

**Worth remembering:** these files used to be fed by Macrobond, which silently
handled rebasings. Nearly every European statistics office rebased in early
2026, so the breaks all surfaced at once. Several column headers are actively
misleading (UK "Food CPI" includes soft drinks and is CPIH; NL's "Total CPI"
column is actually food). Sweden's −5.5% at April 2026 is a real VAT cut, not
an error.

---

## 2026-07-01 — `spend-data-update` — 🆕 built

Files the monthly procurement spend downloads from the local source tree into
the SharePoint `RAW Spend Data` masters, renaming each to that country's
convention.

**Left in this state:** all mapped countries active (UK, NL, CH, IRL, SCAN, BE,
DE, IT-P71). On hold: IT-EOS, SCAN DK/CPH. Skipped by Dixon: Lux.

---

## Template for a new entry

```
## YYYY-MM-DD — `skill-name` — 🆕 built / 🔧 changed

One line on what it does.

**Left in this state:** what works, what does not, what needs a decision.
**Key constraint:** anything Dixon explicitly told me to do or not do.
**Worth remembering:** the non-obvious thing a future session would waste time
rediscovering.
```
