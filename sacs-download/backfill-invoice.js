/*
  backfill-invoice.js  (v2 — jobId based, no criteria popup)

  Autonomous invoice backfill. Each round:
    1. RECONCILE: mark months already on disk as filed.
    2. HARVEST: on every unit grid, download each COMPLETE job by its jobId.
       - tracked job (we submitted it) -> file under its known month.
       - untracked completed job       -> derive the month from the CSV's
         Period column; file only if it's a needed month not yet on disk.
       Harvesting frees global queue slots.
    3. SUBMIT: for each needed month not filed and not already tracked-queued,
       switch unit, set the whole-month range, Export, capture the new jobId.
       Stop when SACS shows "Maximum Queue Reached" (global limit 5).
    4. SLEEP, repeat until all filed or the time budget expires.

  Reliable because it never reads the (broken) criteria popup: job->month comes
  from our own capture at submit time, or from the downloaded CSV itself.

  Attaches over CDP 9222. EXPORT/DOWNLOAD only. Add-only on disk.

  node backfill-invoice.js         # run
  node backfill-invoice.js once    # one round only (for careful testing)
*/
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ONCE = (process.argv[2] || '').toLowerCase() === 'once';
const APP = 'sacsemea.gategroup.com';
const DEST = 'C:\\Users\\DChoi\\OneDrive - Gategroup\\PMO Procurement Europe - Documents\\Data_EU_Master_Channel\\Invoice Level Data\\UK_SACS';
const DL = path.join(__dirname, 'downloads');
const TRACK = path.join(__dirname, 'invoice-jobs.json');
const RUNLOG = path.join(DL, 'backfill-run.log');

const YEAR = '2026';
const MON = { '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun' };
const LASTDAY = { '02': '28', '03': '31', '04': '30', '05': '31', '06': '30' };
const NEED = Object.keys(MON);
const UNITS = [
  { token: 'UK',     prefix: '101',  label: 'UK-MASTER'   },
  { token: 'CH',     prefix: '1701', label: 'CH-MASTER'   },
  { token: 'IRL',    prefix: '701',  label: 'IRL-MASTER'  },
  { token: 'NL',     prefix: '4000', label: 'EU-MASTER'   },
  { token: 'SE,ARN', prefix: '4602', label: 'SE-ARN 3056' },
  { token: 'SE,GOT', prefix: '4603', label: 'SE-GOT 3057' },
  { token: 'SE,MMX', prefix: '4604', label: 'SE-MMX 3058' },
  { token: 'NO,OSL', prefix: '4702', label: 'NO-OSL 3052' },
  { token: 'NO,BGO', prefix: '4703', label: 'NO-BGO 3053' },
  { token: 'DK,BLL', prefix: '4503', label: 'DK-BLL 3023' },
];
const BUDGET_MS = 4 * 60 * 60 * 1000, SLEEP_MS = 3 * 60 * 1000, T0 = Date.now();

if (!fs.existsSync(DL)) fs.mkdirSync(DL, { recursive: true });
const log = m => { const l = new Date().toISOString().slice(11, 19) + '  ' + m; console.log(l); fs.appendFileSync(RUNLOG, l + '\n'); };
const loadTrack = () => fs.existsSync(TRACK) ? JSON.parse(fs.readFileSync(TRACK, 'utf8')) : {};
const saveTrack = t => fs.writeFileSync(TRACK, JSON.stringify(t, null, 2));
const finalFile = (token, mm) => path.join(DEST, token + '-' + MON[mm] + '-' + YEAR + '.csv');
const filed = (token, mm) => fs.existsSync(finalFile(token, mm));

async function grid(page) {
  await page.click('#refereshJobStatus').catch(() => {});
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const g = document.querySelector('#JobStatusViewGrid'); if (!g) return [];
    return [...g.querySelectorAll('tr')].map(tr => {
      const txt = (tr.innerText || '').replace(/\s+/g, ' ').trim();
      const crit = tr.querySelector('a[onclick*=showCriteria]');
      const jobId = crit ? (crit.getAttribute('onclick').match(/showCriteria\((\d+)\)/) || [])[1] : null;
      const status = /Complete/i.test(txt) ? 'Complete' : /In Queue/i.test(txt) ? 'InQueue' : /Failed/i.test(txt) ? 'Failed' : '';
      const dl = tr.querySelector('a[onclick*=downloadReport]');
      return jobId ? { jobId, status, hasDownload: !!dl } : null;
    }).filter(Boolean);
  });
}
const goUnit = (page, u) => page.goto('https://' + APP + '/' + u.prefix + '/Reports/DashBoard/VendorInvoiceReport', { waitUntil: 'networkidle' }).then(() => page.waitForTimeout(700)).catch(() => {});

async function downloadJob(page, jobId, dest) {
  const [d] = await Promise.all([
    page.waitForEvent('download', { timeout: 45000 }),
    page.click('#JobStatusViewGrid tr:has(a[onclick*="showCriteria(' + jobId + ')"]) a[onclick*=downloadReport]'),
  ]);
  await d.saveAs(dest);
  return dest;
}
// derive the month (mm) a downloaded invoice CSV covers, from its Period column
function monthFromCsv(file) {
  const fd = fs.openSync(file, 'r'); const buf = Buffer.alloc(200000);
  const n = fs.readSync(fd, buf, 0, 200000, 0); fs.closeSync(fd);
  const lines = buf.slice(0, n).toString('utf8').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;
  const hdr = lines[0].replace(/^﻿/, '').split(',').map(s => s.trim().toLowerCase());
  const pIdx = hdr.indexOf('period'), yIdx = hdr.indexOf('fiscal year');
  if (pIdx < 0) return null;
  const cnt = {}; let ok = 0;
  for (const ln of lines.slice(1, 400)) {
    const c = ln.split(',');
    if (yIdx >= 0 && c[yIdx] && c[yIdx].trim() !== YEAR) continue;
    const p = (c[pIdx] || '').trim().padStart(2, '0');
    if (MON[p]) { cnt[p] = (cnt[p] || 0) + 1; ok++; }
  }
  if (!ok) return null;
  const mm = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
  return cnt[mm] / ok >= 0.6 ? mm : null;     // require a clear majority
}

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];
  page.on('dialog', d => d.dismiss().catch(() => {}));
  let track = loadTrack();
  log('=== backfill v2 start' + (ONCE ? ' (one round)' : '') + ' ===');

  let round = 0;
  while (Date.now() - T0 < BUDGET_MS) {
    round++;
    const remaining = [];
    for (const u of UNITS) for (const mm of NEED) if (!filed(u.token, mm)) remaining.push(u.token + '-' + MON[mm]);
    log('round ' + round + ' — ' + remaining.length + ' months not filed: ' + remaining.join(' '));
    if (!remaining.length) { log('ALL FILED — done.'); break; }

    let queueFull = false;
    for (const u of UNITS) {
      if (NEED.every(mm => filed(u.token, mm))) continue;
      await goUnit(page, u);
      const jobs = await grid(page);

      // HARVEST completed jobs
      track._seen = track._seen || {};
      for (const j of jobs) {
        if (j.status !== 'Complete' || !j.hasDownload) continue;
        const trackedKey = Object.keys(track).filter(k => k !== '_seen').find(k => track[k].jobId === j.jobId && track[k].token === u.token);
        let mm = trackedKey ? track[trackedKey].mm : null;
        if (mm && filed(u.token, mm)) continue;
        if (!mm && track._seen[j.jobId]) continue;   // untracked job already examined & not needed — don't re-download 27MB
        try {
          const tmp = path.join(DL, 'tmp_' + u.token.replace(/[^\w]/g, '') + '_' + j.jobId + '.csv');
          await downloadJob(page, j.jobId, tmp);
          if (!mm) { mm = monthFromCsv(tmp); if (mm) log('  derived ' + u.token + ' job ' + j.jobId + ' -> ' + MON[mm] + ' (from CSV)'); }
          if (!mm || !NEED.includes(mm)) { fs.unlinkSync(tmp); track._seen[j.jobId] = true; saveTrack(track); continue; }  // not needed — remember so we don't re-download
          if (filed(u.token, mm)) { fs.unlinkSync(tmp); continue; }                // already have it
          const size = fs.statSync(tmp).size;
          if (size < 200) { log('  !! ' + u.token + ' ' + MON[mm] + ' looked empty (' + size + 'B) — discarded'); fs.unlinkSync(tmp); continue; }
          fs.renameSync(tmp, finalFile(u.token, mm));
          track[u.token + '|' + mm] = { jobId: j.jobId, token: u.token, mm, prefix: u.prefix, status: 'filed' };
          saveTrack(track);
          log('  ✓ filed ' + path.basename(finalFile(u.token, mm)) + '  (' + size + ' bytes)');
        } catch (e) { log('  !! download failed ' + u.token + ' job ' + j.jobId + ': ' + e.message); }
      }

      // SUBMIT needed months not filed and not currently tracked-queued
      if (ONCE || queueFull) continue;
      for (const mm of NEED) {
        if (filed(u.token, mm)) continue;
        const k = u.token + '|' + mm;
        if (track[k] && track[k].status === 'queued') continue;    // already queued by us
        const before = new Set(jobs.map(x => x.jobId));
        await page.fill('#FromPeriod', '01/' + mm + '/' + YEAR).catch(() => {});
        await page.dispatchEvent('#FromPeriod', 'change').catch(() => {});
        await page.fill('#ToPeriod', LASTDAY[mm] + '/' + mm + '/' + YEAR).catch(() => {});
        await page.dispatchEvent('#ToPeriod', 'change').catch(() => {});
        await page.waitForTimeout(250);
        await page.click('#ExportVendorInvoiceReport').catch(() => {});
        await page.waitForTimeout(1600);
        const maxed = await page.evaluate(() => /Maximum Queue Reached/i.test(document.body.innerText || '')).catch(() => false);
        if (maxed) { log('  queue full at ' + u.token + ' ' + MON[mm] + ' — stop submitting'); queueFull = true; break; }
        const after = await grid(page);
        const neu = after.map(x => x.jobId).find(id => !before.has(id));
        track[k] = { jobId: neu || null, token: u.token, mm, prefix: u.prefix, status: 'queued' };
        saveTrack(track);
        log('  submitted ' + u.token + ' ' + MON[mm] + (neu ? '  (job ' + neu + ')' : '  (jobId not captured)'));
      }
      if (queueFull) break;
    }

    if (ONCE) { log('one round done.'); break; }
    log('round ' + round + ' done; sleeping ' + (SLEEP_MS / 60000) + ' min');
    await page.waitForTimeout(SLEEP_MS);
  }
  log('=== run ended ===');
  await browser.close();
})().catch(e => console.error('ERR', e)).finally(() => process.exit(0));
