# PO data download — steps as taught by Dixon

Working notes, captured live 2026-07-20. Becomes SKILL.md once complete.

System: **Global S.A.C.S.** (Global Standard Airline Catering System),
`https://sacsemea.gategroup.com/` — gate gourmet. **EMEA PROD — production.**
Signed in as `global.gg.group\DChoi` via corporate Microsoft SSO.

## 🔗 Where this fits

This is the **missing upstream half** of the existing
[`spend-data-update`](../spend-data-update/SKILL.md) skill:

```
SACS website  →  Report Spend History Data  →  SharePoint spend masters
 (this skill)        (the handover point)        (spend-data-update)
```

`Report Spend History Data` is literally that skill's documented **Source root**.

---

## The loop: once per operating unit

### Step 1 — Choose the working unit
Top-left dropdown under the SACS logo.

**Rule: pick units with a NUMBER after the name. Skip MASTER entries.**

| SACS unit | → destination folder |
|-----------|----------------------|
| UK-STN-JET2 3275 | `STN_Jet2` |
| UK-NCL-JET2 3271 | `NCL_Jet2` |
| UK-BRS 3040 | `BRS` |
| UK-BFS-JET2 3262 | `BFS_jet2` |
| UK-GLA 3042 | `GLA` |
| UK-MAN 3420 | `MAN` |
| UK-LGW 3039 | `LGW` |
| UK-LHN 3295 | `LHN` |
| UK-LBA 3298 | `LBA` |
| UK-LTN 3272 | `LTN` |
| UK-BRS-JET2 3263 | `BRS_Jet2` |
| UK-GLA-JET2 3267 | `GLA_jet2` |
| UK-MAN-JET2 3273 | `Man_jet2` |
| UK-LPL-JET2 3269 | `LPL_jet2` |
| UK-BHX-JET2 3268 | `BHX_Jet2` |
| UK-EMA-JET2 3264 | `EMA_Jet2` |
| UK-LBA-JET2 3266 | `LBA_jet2` |
| UK-LCY 3037 | `LCY` |

❌ Skip: `UK-MASTER`, `IRL-MASTER`.
⚠️ Folder casing is inconsistent in the destination (`BFS_jet2` vs `BHX_Jet2`,
`Man_jet2` vs `MAN`). Match the existing folder — do not create new ones.

### Countries in scope — SACS feeds only these six

Dixon, 2026-07-20: **UK & IRL, SE, NO, NL, DK, CH**.

| Country folder | Unit folders | Count |
|---|---|---:|
| `UK & IRL` | BFS_jet2, BHX_Jet2, BRS, BRS_Jet2, DUB, EMA_Jet2, GLA, GLA_jet2, LBA, LBA_jet2, LCY, LGW, LHN, LNER, LPL_jet2, LTN, MAN, Man_jet2, NCL_Jet2, STN_Jet2 | 20 |
| `SE` | ARN, GOT, MMX | 3 |
| `NO` | BGO, OSL | 2 |
| `NL` | North, West | 2 |
| `CH` | GVA, ZRH | 2 |
| `DK` | CPH | 1 |
| | | **30** |

❌ **NOT from SACS** — do not touch: `BE`, `Germany`, `IT`, `Lux`,
`SCAN 3022-3058`. These come from somewhere else.

**Scale:** 30 units × 2 reports (PO + invoice) = **60 downloads a month**, each
needing unit switch → report → month → export → rename → file. This is the
whole point of automating it.

⚠️ **DK / CPH looks dormant** — its newest file is `1225.csv` written
2026-01-02, while every other unit has `0626.csv` from 2026-07-01. The
`spend-data-update` skill also lists DK/CPH as on hold. **Confirm with Dixon
before including it.**

### Step 2 — Reports
Left navigation, bottom item: **Reports**.

### Step 3 — Received Purchase Orders
**Material Management › Miscellaneous › Received Purchase Order**

Lands on `/<n>/Reports/DashBoard/ReceivedPurchaseOrders`.

⚠️ **The route prefix is per-unit** — `/134/` for UK-LCY, `/102/` for
UK-STN-JET2. Never hard-code it; read it from the current URL.

### Step 4 — Fill the form and Export

| Field | Value |
|-------|-------|
| ＊Select Month | the **previous** month, `MM/YYYY` (e.g. `06/2026`) |
| ＊Select Date | disappears once a month is chosen — leave it |
| Vendors | **always blank** (= all vendors) — confirmed by Dixon |
| Include Additional Purchase Order | ✅ leave ticked (default) |
| Include NonInventory Purchase Order | ✅ leave ticked (default) |
| Export Report As | **CSV** |

Then click **Export**.

### Step 5 — Save the file

```
C:\Users\DChoi\OneDrive - Gategroup\Documents\Spend\Report Spend History Data\UK & IRL\<unit folder>\<MMYY>.csv
```

**Naming: `MMYY.csv`** — `MM` month, `YY` two-digit year. June 2026 → `0626.csv`.
Exactly the format `spend-data-update` expects to read.

---

## Timing

Existing files are all stamped the **1st–2nd of the following month**
(`0626.csv` written 2026-07-01 08:56). So: run at the start of each month for
the month just ended.

## Observed reality check

| Unit | 0626.csv |
|------|---------:|
| GLA | 1,274,510 bytes |
| STN_Jet2 | 149,651 bytes |
| LCY | 30,256 bytes |
| BRS | **340 bytes** |

340 bytes = header only. Some units genuinely have no PO data; the file is
still saved. **An empty file is a valid result, not a failure** — but a
*missing* file is a failure.

## Ground rules

- SACS is **production**. Export only. Never save, submit, generate, approve or
  transfer anything. The automation must be incapable of changing SACS state.
- Dixon signs in himself; the automation never handles the password. Session
  persists in `.auth-chrome\` (gitignored).
- Never overwrite an existing `MMYY.csv` without saying so.

---

## Still to confirm

- [ ] What filename SACS gives the download before it is renamed
- [ ] Does Export download straight away, or land in the `Download Report` tile?
- [ ] Non-UK countries (BE, CH, DK, Germany, IT, NL, NO, SE, SCAN, Lux folders
      exist) — are those also pulled from SACS, or another system?
- [ ] `DUB` and `LNER` folders — which SACS units feed them?
- [ ] **Invoice data** — the second download, not yet taught
