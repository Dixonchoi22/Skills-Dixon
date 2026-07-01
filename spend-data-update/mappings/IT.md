# IT (Italy) — Spend Data Update Mapping

IT has TWO parts:
- **Part A — P71 (monthly XLSX)**: simple move + rename (like UK). ✅ ACTIVE
- **Part B — EOS (unit CSV)**: ⏸️ ON HOLD — no more EOS data going forward
  (user, 2026-07-01). Skill should NOT process EOS. Kept below for reference only.

## Paths

- **Source**: `...\Report Spend History Data\IT\`
- **Destination**: `...\Data_EU_Master_Channel\RAW Spend Data\IT_Master_Spend\`
  - `IT_Master_P71\`  and  `IT_Master_EOS\`

Month code → name: 01 Jan … 12 Dec.

---

## Part A — P71 (monthly XLSX)  ✅ ACTIVE

Source: `IT\P71\MMYY.XLSX`  (user created a dedicated `IT\P71\` sub-folder on
2026-07-01; the monthly XLSX files now live there, not at the IT top level).

Source `IT\P71\MMYY.XLSX` → `IT_Master_P71\IT_1411&1413_<Mon>_<YY>.XLSX`

- Format: `IT_1411&1413_<Mon>_<YY>.XLSX` (Mon_YY, 2-digit year, underscore)
- e.g. `0426.XLSX` → `IT_1411&1413_Apr_26.XLSX`
- e.g. `1025.XLSX` → `IT_1411&1413_Oct_25.XLSX`

Skip: year files `2023.XLSX / 2024.XLSX / 2025.XLSX` and any non `MMYY.XLSX`.

---

## Part B — EOS (unit CSVs)  ⏸️ ON HOLD (no more EOS data going forward)

Per user (2026-07-01): there should be no more EOS data going forward, so the skill
must NOT process EOS. The notes below are kept for reference only, in case it resumes.

CONFIRMED by user: EOS destination connects to source `IT\Dowload\`.
Folder mapping is 1:1 by unit name:

    Source:  IT\Dowload\<unit>\        →   Dest:  IT_Master_EOS\<unit>\

15 unit sub-folders exist under BOTH source `IT\Dowload\` and dest `IT_Master_EOS\`
with identical names (unit + code):

Aviport2 Catering (10421) · Fiano Romano (10901) · Fiumicino (10423) ·
Fiumicino Catering (10401) · Focene Catering (10402) · GATE SRL VIA SEGANTI (80101) ·
Linate Catering (10201) · Linate PrimeGusto (70201) · Malpensa Buy On Board (50101) ·
Malpensa Catering (10101) · Malpensa Catering SPA (10104) · Malpensa Gate co Airfood (10102) ·
Malpensa Lonate (10103) · Venezia Catering (10301) · Venezia Thello (40301)

**Operation (CONFIRMED by user): move the monthly CSV directly — NO consolidation.**
Each month, the new monthly `MMYY.csv` in `IT\Dowload\<unit>\` is moved straight into
`IT_Master_EOS\<unit>\` as-is (dropped in directly, no appending/merging).

- Source `IT\Dowload\<unit>\MMYY.csv` → dest `IT_Master_EOS\<unit>\` (same unit folder)
- The big consolidated master already in each dest unit folder (e.g.
  `2024-2026.02_10423.csv`, pattern `<startYear>-<endYear>.<endMonth>_<unitCode>.csv`)
  is a ONE-TIME historical bulk download — leave it untouched, do not overwrite.
- Filename on move: keep the source name as-is (assumption — no monthly example exists
  yet in dest to confirm a rename; VERIFY on the first real run).

Source `IT\Dowload\<unit>\` naming is inconsistent (e.g. `1225.csv` vs `01.25.csv`);
only move clean current-month files, skip range/history files like `2023 -2025.csv`,
`2023 -2025_10423.csv`, `2025 -2023.csv`.

Also: `IT\EOS\` (separate from `Dowload\`) holds `2024.XLSX`, a dashboard folder and a
`.zip` — reference/history, NOT part of the monthly move. Ignore.

---

## Which files to move each month

- **Part A (P71)**: move `IT\P71\MMYY.XLSX` → `IT_Master_P71\IT_1411&1413_<Mon>_<YY>.XLSX`.
- **Part B (EOS)**: ⏸️ ON HOLD — do not process (no more EOS data going forward).
- Only move files not already present in the destination.
