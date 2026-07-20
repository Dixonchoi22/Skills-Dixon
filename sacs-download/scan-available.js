/*
  scan-available.js — for each unit we need, scan the invoice job grid for
  COMPLETE jobs (anyone's) whose criteria match a whole month we need, so we
  can download those instead of submitting + waiting. READ ONLY.

  Match rule for a reusable whole-month job:
    FromPeriod = YYYY-MM-01, ToPeriod = YYYY-MM-<lastday>,
    IncludeNonInvOrders = false, IncludeAdditionalOrders = false.

  Writes findings to reusable-jobs.json.
*/
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const APP = 'sacsemea.gategroup.com';

const UNITS = [
  { token: 'UK',     prefix: '101'  },
  { token: 'CH',     prefix: '1701' },
  { token: 'IRL',    prefix: '701'  },
  { token: 'NL',     prefix: '4000' },
  { token: 'SE,ARN', prefix: '4602' },
  { token: 'SE,GOT', prefix: '4603' },
  { token: 'SE,MMX', prefix: '4604' },
  { token: 'NO,OSL', prefix: '4702' },
  { token: 'NO,BGO', prefix: '4703' },
  { token: 'DK,BLL', prefix: '4503' },
];
const NEED = ['02','03','04','05','06'];               // Feb–Jun 2026
const LASTDAY = { '02':'28','03':'31','04':'30','05':'31','06':'30' };
const YEAR = '2026';

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];
  page.on('dialog', d => d.dismiss().catch(() => {}));

  const found = {};   // token -> { MM -> {jobId, file, path, by, from, to} }

  for (const u of UNITS) {
    found[u.token] = {};
    await page.goto('https://' + APP + '/' + u.prefix + '/Reports/DashBoard/VendorInvoiceReport', { waitUntil: 'networkidle' }).catch(() => {});
    await page.click('#refereshJobStatus').catch(() => {});
    await page.waitForTimeout(1500);

    // collect completed rows across all grid pages
    const complete = [];
    for (let pageNo = 0; pageNo < 6; pageNo++) {
      const rows = await page.evaluate(() => {
        const g = document.querySelector('#JobStatusViewGrid'); if (!g) return [];
        return [...g.querySelectorAll('tr')].map(tr => {
          const txt = (tr.innerText || '').replace(/\s+/g, ' ').trim();
          if (!/Complete/i.test(txt)) return null;
          const crit = tr.querySelector('a[onclick*=showCriteria]');
          const jobId = crit ? (crit.getAttribute('onclick').match(/showCriteria\((\d+)\)/) || [])[1] : null;
          const dl = tr.querySelector('a[onclick*=downloadReport]');
          const onclick = dl ? dl.getAttribute('onclick') : '';
          const by = (txt.match(/global\.gg\.group\\+(\w+)/) || [])[1] || '';
          return { jobId, onclick, by };
        }).filter(Boolean);
      });
      rows.forEach(r => { if (!complete.find(c => c.jobId === r.jobId)) complete.push(r); });
      // next page if present
      const next = await page.$('#JobStatusViewGrid a[title=NEXT], #JobStatusViewGrid .k-i-arrow-e');
      const moved = await page.evaluate(() => {
        const a = [...document.querySelectorAll('#JobStatusViewGrid a')].find(x => /^NEXT$/i.test((x.textContent||'').trim()) && !/disabled/i.test(x.className));
        if (a) { a.click(); return true; } return false;
      });
      if (!moved) break;
      await page.waitForTimeout(1200);
    }

    // read criteria for each completed job, match to a needed month
    for (const c of complete) {
      if (!c.jobId) continue;
      if (Object.keys(found[u.token]).length === NEED.length) break;   // all months found
      await page.evaluate(id => window.gg && gg.sacs && gg.sacs.jobStatus && gg.sacs.jobStatus.showCriteria(id), Number(c.jobId));
      await page.waitForTimeout(700);
      const crit = await page.evaluate(() => {
        const box = document.querySelector('.k-window, .modal, #viewInfo, [id*=Criteria], [class*=criteria]');
        const t = box ? (box.innerText || '') : '';
        return t.replace(/\s+/g, ' ').trim();
      });
      await page.evaluate(() => { const b = [...document.querySelectorAll('a,button')].find(x => /^close$/i.test((x.textContent||'').trim())); if (b) b.click(); }).catch(() => {});
      await page.waitForTimeout(200);

      const from = (crit.match(/FromPeriod\s*:\s*(\d{4}-\d{2}-\d{2})/) || [])[1];
      const to   = (crit.match(/ToPeriod\s*:\s*(\d{4}-\d{2}-\d{2})/) || [])[1];
      const nonInv = /IncludeNonInvOrders\s*:\s*false/i.test(crit);
      const addl   = /IncludeAdditionalOrders\s*:\s*false/i.test(crit);
      if (!from || !to) continue;
      const [fy, fm, fd] = from.split('-');
      const [ty, tm, td] = to.split('-');
      const wholeMonth = fy === YEAR && fm === tm && fd === '01' && td === LASTDAY[fm] && NEED.includes(fm);
      if (wholeMonth && nonInv && addl && !found[u.token][fm]) {
        const file = (c.onclick.match(/downloadReport\("([^"]+)"/) || [])[1] || '';
        found[u.token][fm] = { jobId: c.jobId, file, by: c.by, from, to };
        console.log('  ' + u.token + ' ' + fm + '/' + YEAR + '  REUSABLE  (job ' + c.jobId + ' by ' + c.by + ', ' + file + ')');
      }
    }
    const got = Object.keys(found[u.token]).sort();
    const missing = NEED.filter(m => !found[u.token][m]);
    console.log(u.token.padEnd(8) + '  reusable: [' + got.join(',') + ']   missing: [' + missing.join(',') + ']');
  }

  fs.writeFileSync(path.join(__dirname, 'reusable-jobs.json'), JSON.stringify(found, null, 2));
  console.log('\nwritten reusable-jobs.json');
  await browser.close();
})().catch(e => console.error('ERR', e)).finally(() => process.exit(0));
