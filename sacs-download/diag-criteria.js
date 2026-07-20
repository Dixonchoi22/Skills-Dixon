/* diag-criteria.js — on UK invoice grid, read every job's criteria with a
   ROBUST method (wait until the popup actually contains FromPeriod, then close
   and verify). Prints jobId/status/from/to/month. READ ONLY. */
const { chromium } = require('playwright');
const APP = 'sacsemea.gategroup.com';
const YEAR = '2026';
const LASTDAY = { '02':'28','03':'31','04':'30','05':'31','06':'30' };

async function readCriteria(page, jobId) {
  // close any open criteria popup so showCriteria opens a fresh one
  await page.click('#viewInfoClose').catch(()=>{});
  await page.waitForTimeout(200);
  await page.evaluate(id => window.gg && gg.sacs && gg.sacs.jobStatus && gg.sacs.jobStatus.showCriteria(id), Number(jobId));
  // poll until #viewInfo actually shows THIS job's id
  let text = '';
  const want = new RegExp('JobId\\s*:\\s*' + jobId + '\\b');
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(200);
    text = await page.evaluate(() => { const b = document.querySelector('#viewInfo'); return b ? (b.innerText || '').replace(/\s+/g, ' ').trim() : ''; });
    if (want.test(text)) break;
    text = '';
  }
  await page.click('#viewInfoClose').catch(()=>{});
  await page.waitForTimeout(150);
  return text;
}

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];
  await page.goto('https://' + APP + '/101/Reports/DashBoard/VendorInvoiceReport', { waitUntil: 'networkidle' }).catch(()=>{});
  await page.click('#refereshJobStatus').catch(()=>{});
  await page.waitForTimeout(1500);

  const jobs = await page.evaluate(() => {
    const g = document.querySelector('#JobStatusViewGrid'); if (!g) return [];
    return [...g.querySelectorAll('tr')].map(tr => {
      const txt = (tr.innerText||'').replace(/\s+/g,' ').trim();
      const crit = tr.querySelector('a[onclick*=showCriteria]');
      const jobId = crit ? (crit.getAttribute('onclick').match(/showCriteria\((\d+)\)/)||[])[1] : null;
      const status = /Complete/i.test(txt)?'Complete':/In Queue/i.test(txt)?'InQueue':/Failed/i.test(txt)?'Failed':'?';
      return jobId ? { jobId, status } : null;
    }).filter(Boolean);
  });
  console.log('UK jobs on grid: ' + jobs.length);
  for (const j of jobs) {
    const c = await readCriteria(page, j.jobId);
    const from = (c.match(/FromPeriod\s*:\s*(\d{4})-(\d{2})-(\d{2})/)||[]);
    const to = (c.match(/ToPeriod\s*:\s*(\d{4})-(\d{2})-(\d{2})/)||[]);
    const jip = (c.match(/JobId\s*:\s*(\d+)/)||[])[1] || '?';
    const whole = from[1]===YEAR && from[2]===to[2] && from[3]==='01' && to[3]===LASTDAY[from[2]];
    console.log('  job ' + j.jobId + '  ' + j.status.padEnd(8) + '  popupJob=' + (jip===j.jobId?'ok':jip) + '  ' + (from[0]?from[1]+'-'+from[2]+'-'+from[3]+'..'+to[3]:'(EMPTY)') + (whole?'  [whole '+from[2]+']':''));
  }
  await browser.close();
})().catch(e=>console.error('ERR',e)).finally(()=>process.exit(0));
