/*
  backfill-invoice.js — autonomous invoice backfill.

  Runs on its own until every needed whole month (up to last month) is filed,
  or the time budget runs out. Each round:
    1. HARVEST: for every unit, scan the job grid; any COMPLETE job (anyone's)
       whose criteria match a needed whole month gets downloaded + filed.
       (This is the "check if already done, just download it" rule.)
    2. TOP UP: submit needed months that are neither filed nor already queued,
       until SACS shows "Maximum Queue Reached" (global limit 5).
    3. SLEEP, then repeat. Jobs take up to ~1h, so this spans hours.

  Attaches over CDP 9222. EXPORT/DOWNLOAD only. Add-only on disk — never
  overwrites an existing file.

  node backfill-invoice.js            # run to completion
  node backfill-invoice.js dry        # scan + report only, no submit/download
*/
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DRY = (process.argv[2] || '').toLowerCase() === 'dry';
const APP = 'sacsemea.gategroup.com';
const DEST = 'C:\\Users\\DChoi\\OneDrive - Gategroup\\PMO Procurement Europe - Documents\\Data_EU_Master_Channel\\Invoice Level Data\\UK_SACS';
const LOGDIR = path.join(__dirname, 'downloads');
const RUNLOG = path.join(LOGDIR, 'backfill-run.log');

const YEAR = '2026';
const MON = { '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun' };
const LASTDAY = { '02': '28', '03': '31', '04': '30', '05': '31', '06': '30' };
const NEED = Object.keys(MON);                       // Feb..Jun 2026 (up to last month)

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

const TIME_BUDGET_MS = 5 * 60 * 60 * 1000;           // 5 hours
const ROUND_SLEEP_MS = 3 * 60 * 1000;                // 3 min between rounds
const startedAt = Date.now();

if (!fs.existsSync(LOGDIR)) fs.mkdirSync(LOGDIR, { recursive: true });
const log = m => { const line = new Date().toISOString().slice(11, 19) + '  ' + m; console.log(line); fs.appendFileSync(RUNLOG, line + '\n'); };

const fileFor = (token, mm) => path.join(DEST, token + '-' + MON[mm] + '-' + YEAR + '.csv');
const filed = (token, mm) => fs.existsSync(fileFor(token, mm));

// read every job row on the current unit grid, with parsed criteria
async function readJobs(page) {
  await page.click('#refereshJobStatus').catch(() => {});
  await page.waitForTimeout(1500);
  const rows = await page.evaluate(() => {
    const g = document.querySelector('#JobStatusViewGrid'); if (!g) return [];
    return [...g.querySelectorAll('tr')].map(tr => {
      const txt = (tr.innerText || '').replace(/\s+/g, ' ').trim();
      const crit = tr.querySelector('a[onclick*=showCriteria]');
      const jobId = crit ? (crit.getAttribute('onclick').match(/showCriteria\((\d+)\)/) || [])[1] : null;
      const dl = tr.querySelector('a[onclick*=downloadReport]');
      const status = /Complete/i.test(txt) ? 'Complete' : /In Queue/i.test(txt) ? 'InQueue' : /Failed/i.test(txt) ? 'Failed' : '';
      return jobId ? { jobId, status, hasDownload: !!dl } : null;
    }).filter(Boolean);
  });
  // enrich with criteria (month, params) for Complete + InQueue rows
  for (const r of rows) {
    if (r.status !== 'Complete' && r.status !== 'InQueue') continue;
    await page.evaluate(id => window.gg && gg.sacs && gg.sacs.jobStatus && gg.sacs.jobStatus.showCriteria(id), Number(r.jobId));
    await page.waitForTimeout(500);
    const crit = await page.evaluate(() => { const b = document.querySelector('.k-window,.modal,#viewInfo,[id*=Criteria],[class*=criteria]'); return b ? (b.innerText || '').replace(/\s+/g, ' ').trim() : ''; });
    await page.evaluate(() => { const b = [...document.querySelectorAll('a,button')].find(x => /^close$/i.test((x.textContent || '').trim())); if (b) b.click(); }).catch(() => {});
    await page.waitForTimeout(150);
    const from = (crit.match(/FromPeriod\s*:\s*(\d{4})-(\d{2})-(\d{2})/) || []);
    const to = (crit.match(/ToPeriod\s*:\s*(\d{4})-(\d{2})-(\d{2})/) || []);
    const nonInvFalse = /IncludeNonInvOrders\s*:\s*false/i.test(crit);
    const addlFalse = /IncludeAdditionalOrders\s*:\s*false/i.test(crit);
    if (from[1] === YEAR && from[2] === to[2] && from[3] === '01' && to[3] === LASTDAY[from[2]] && NEED.includes(from[2]) && nonInvFalse && addlFalse) {
      r.mm = from[2];
    }
  }
  return rows;
}

async function switchUnit(page, u) {
  await page.goto('https://' + APP + '/' + u.prefix + '/Reports/DashBoard/VendorInvoiceReport', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(700);
}

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];
  page.on('dialog', d => d.dismiss().catch(() => {}));

  log('=== backfill start ' + (DRY ? '(DRY)' : '') + ' — dest ' + DEST + ' ===');

  let round = 0;
  while (Date.now() - startedAt < TIME_BUDGET_MS) {
    round++;
    const remaining = [];
    for (const u of UNITS) for (const mm of NEED) if (!filed(u.token, mm)) remaining.push(u.token + '-' + MON[mm]);
    log('round ' + round + ' — ' + remaining.length + ' months still not filed');
    if (!remaining.length) { log('ALL FILED — done.'); break; }

    let queueFull = false;
    for (const u of UNITS) {
      const needHere = NEED.filter(mm => !filed(u.token, mm));
      if (!needHere.length) continue;
      await switchUnit(page, u);
      const jobs = await readJobs(page);

      // 1) HARVEST completed matching months
      for (const j of jobs) {
        if (j.status !== 'Complete' || !j.mm || !j.hasDownload) continue;
        if (filed(u.token, j.mm)) continue;
        const target = fileFor(u.token, j.mm);
        if (DRY) { log('  would download ' + u.token + ' ' + MON[j.mm] + ' (job ' + j.jobId + ')'); continue; }
        try {
          const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 30000 }),
            page.click('#JobStatusViewGrid tr:has(a[onclick*="showCriteria(' + j.jobId + ')"]) a[onclick*=downloadReport]'),
          ]);
          const tmp = path.join(LOGDIR, 'tmp_' + u.token.replace(/[^\w]/g, '') + '_' + j.mm + '.csv');
          await download.saveAs(tmp);
          const head = fs.readFileSync(tmp, 'utf8').split(/\r?\n/).find(l => l.trim()) || '';
          if (head.length < 5) { log('  !! ' + u.token + ' ' + MON[j.mm] + ' download looked empty — kept in tmp, NOT filed'); continue; }
          fs.renameSync(tmp, target);
          log('  ✓ filed ' + path.basename(target) + '  (' + fs.statSync(target).size + ' bytes, job ' + j.jobId + ')');
        } catch (e) { log('  !! download failed ' + u.token + ' ' + MON[j.mm] + ': ' + e.message); }
      }

      // 2) TOP UP: submit months not filed and not already queued
      if (DRY || queueFull) continue;
      const queuedMonths = new Set(jobs.filter(j => j.status === 'InQueue' && j.mm).map(j => j.mm));
      for (const mm of NEED) {
        if (filed(u.token, mm) || queuedMonths.has(mm)) continue;
        await page.fill('#FromPeriod', '01/' + mm + '/' + YEAR).catch(() => {});
        await page.dispatchEvent('#FromPeriod', 'change').catch(() => {});
        await page.fill('#ToPeriod', LASTDAY[mm] + '/' + mm + '/' + YEAR).catch(() => {});
        await page.dispatchEvent('#ToPeriod', 'change').catch(() => {});
        await page.waitForTimeout(250);
        await page.click('#ExportVendorInvoiceReport').catch(() => {});
        await page.waitForTimeout(1600);
        const maxed = await page.evaluate(() => /Maximum Queue Reached/i.test(document.body.innerText || '')).catch(() => false);
        if (maxed) { log('  queue full at ' + u.token + ' ' + MON[mm] + ' — stop submitting this round'); queueFull = true; break; }
        log('  submitted ' + u.token + ' ' + MON[mm]);
      }
      if (queueFull) break;
    }

    if (DRY) { log('DRY complete.'); break; }
    log('round ' + round + ' done; sleeping ' + (ROUND_SLEEP_MS / 60000) + ' min');
    await page.waitForTimeout(ROUND_SLEEP_MS);
  }

  log('=== backfill run ended ===');
  await browser.close();
})().catch(e => console.error('ERR', e)).finally(() => process.exit(0));
