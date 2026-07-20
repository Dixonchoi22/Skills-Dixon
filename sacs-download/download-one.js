/* download-one.js — prove downloading a COMPLETE job by its jobId works.
   node download-one.js <jobId> <prefix>   e.g. node download-one.js 2203305 101 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const APP = 'sacsemea.gategroup.com';
const jobId = process.argv[2] || '2203305';
const prefix = process.argv[3] || '101';

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];
  await page.goto('https://' + APP + '/' + prefix + '/Reports/DashBoard/VendorInvoiceReport', { waitUntil: 'networkidle' }).catch(()=>{});
  await page.click('#refereshJobStatus').catch(()=>{});
  await page.waitForTimeout(1500);

  // confirm the row exists and grab its download onclick
  const info = await page.evaluate((jid) => {
    const g = document.querySelector('#JobStatusViewGrid'); if (!g) return null;
    const tr = [...g.querySelectorAll('tr')].find(r => r.querySelector('a[onclick*="showCriteria(' + jid + ')"]'));
    if (!tr) return { found: false };
    const dl = tr.querySelector('a[onclick*=downloadReport]');
    return { found: true, hasDownload: !!dl, onclick: dl ? dl.getAttribute('onclick') : '', status: (tr.innerText||'').replace(/\s+/g,' ').trim().slice(0,60) };
  }, jobId);
  console.log('row: ' + JSON.stringify(info));
  if (!info || !info.found || !info.hasDownload) { console.log('no downloadable row for job ' + jobId); await browser.close(); return; }

  const staged = path.join(__dirname, 'downloads', 'ONE_' + jobId + '.csv');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 40000 }),
    page.click('#JobStatusViewGrid tr:has(a[onclick*="showCriteria(' + jobId + ')"]) a[onclick*=downloadReport]'),
  ]);
  await download.saveAs(staged);
  const buf = fs.readFileSync(staged, 'utf8');
  console.log('suggested: ' + download.suggestedFilename());
  console.log('saved: ' + staged + '  bytes=' + fs.statSync(staged).size + '  rows=' + buf.split(/\r?\n/).filter(l=>l.trim()).length);
  console.log('header: ' + (buf.split(/\r?\n/).find(l=>l.trim())||'').slice(0,120));
  await browser.close();
})().catch(e=>console.error('ERR',e)).finally(()=>process.exit(0));
