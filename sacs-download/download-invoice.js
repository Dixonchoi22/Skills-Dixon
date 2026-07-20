/*
  download-invoice.js — prove the async Vendor Invoice Report download.

  Attaches to the running Chrome (CDP 9222). For the CURRENT unit, sets a date
  range, clicks Export, polls the job-status grid, and when the job is ready
  downloads it to STAGING. READ/EXPORT ONLY — changes nothing in SACS.

  Usage: node download-invoice.js 01/06/2026 30/06/2026
*/
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FROM = process.argv[2] || '01/06/2026';
const TO   = process.argv[3] || '30/06/2026';
const APP = 'sacsemea.gategroup.com';
const STAGING = path.join(__dirname, 'downloads');

(async () => {
  if (!fs.existsSync(STAGING)) fs.mkdirSync(STAGING, { recursive: true });
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];

  const unit = (await page.locator('text=/Unit:\\s*\\S+/').first().textContent().catch(() => '') || '').replace(/\s+/g, ' ').trim();
  const prefix = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a[href]')].map(x => x.getAttribute('href')).find(h => /^\/\d+\//.test(h || ''));
    return a ? a.match(/^\/(\d+)\//)[1] : null;
  });
  console.log(unit + '  prefix /' + prefix + '/');

  const url = 'https://' + APP + '/' + prefix + '/Reports/DashBoard/VendorInvoiceReport';
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1200);

  console.log('Setting date range ' + FROM + ' -> ' + TO);
  await page.fill('#FromPeriod', FROM); await page.dispatchEvent('#FromPeriod', 'change').catch(() => {});
  await page.fill('#ToPeriod', TO);     await page.dispatchEvent('#ToPeriod', 'change').catch(() => {});
  await page.waitForTimeout(400);
  console.log('  From=' + await page.inputValue('#FromPeriod') + '  To=' + await page.inputValue('#ToPeriod'));

  console.log('Clicking Export (creates a job)...');
  await page.click('#ExportVendorInvoiceReport');
  await page.waitForTimeout(2500);

  // poll the job grid
  console.log('Polling job status...');
  let dl = null;
  for (let i = 0; i < 40; i++) {                    // ~40 * 5s = up to ~3.5 min
    await page.click('#refereshJobStatus').catch(() => {});
    await page.waitForTimeout(1500);

    const grid = await page.evaluate(() => {
      const g = document.querySelector('#JobStatusViewGrid');
      if (!g) return { html: '(no grid)', links: [] };
      const links = [...g.querySelectorAll('a,button,[onclick],img[src]')].map(el => ({
        tag: el.tagName, t: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20),
        href: el.getAttribute && el.getAttribute('href') || '', id: el.id || '',
        cls: (el.className || '').toString().slice(0, 40), onclick: (el.getAttribute && el.getAttribute('onclick') || '').slice(0, 60),
        title: el.getAttribute && el.getAttribute('title') || '',
      }));
      const rowText = (g.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200);
      return { rowText, links };
    });
    console.log('  [' + i + '] ' + (grid.rowText || grid.html));

    // a ready job exposes a download control in its row
    const dlLink = grid.links.find(l => /download|export|\.csv|save/i.test(l.href + ' ' + l.onclick + ' ' + l.title + ' ' + l.cls + ' ' + l.t));
    if (dlLink) {
      console.log('  download control found: ' + JSON.stringify(dlLink));
      try {
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 30000 }),
          dlLink.id ? page.click('#' + dlLink.id)
                    : page.click(`#JobStatusViewGrid a:has-text("${dlLink.t}")`).catch(() => page.evaluate(() => {
                        const g = document.querySelector('#JobStatusViewGrid');
                        const a = [...g.querySelectorAll('a,button')].find(x => /download|export|save/i.test((x.getAttribute('href')||'')+(x.getAttribute('onclick')||'')+(x.title||'')));
                        if (a) a.click();
                      })),
        ]);
        dl = download; break;
      } catch (e) { console.log('  click/download failed: ' + e.message); }
    }
    if (/complete|success|done|ready|finish/i.test(grid.rowText || '') && grid.links.length) {
      console.log('  job looks complete but no obvious download link — dumping links:');
      grid.links.forEach(l => console.log('    ' + JSON.stringify(l)));
    }
  }

  if (!dl) { console.log('No download obtained. See job-grid dumps above.'); await browser.close(); return; }

  const staged = path.join(STAGING, 'INVOICE_' + FROM.replace(/\//g, '') + '.csv');
  await dl.saveAs(staged);
  const buf = fs.readFileSync(staged, 'utf8');
  console.log('\nsuggested: ' + dl.suggestedFilename());
  console.log('saved    : ' + staged);
  console.log('bytes: ' + fs.statSync(staged).size + '  rows: ' + buf.split(/\r?\n/).filter(l => l.trim()).length);
  console.log('header: ' + (buf.split(/\r?\n/).find(l => l.trim()) || '').slice(0, 100));

  await browser.close();
})().catch(e => console.error('ERR', e)).finally(() => process.exit(0));
