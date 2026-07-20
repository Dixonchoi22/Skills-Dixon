/* inspect-invoice.js — attach to the running Chrome (CDP 9222), open the Vendor
   Invoice Report, describe the form + job grid + export. READ ONLY. */
const { chromium } = require('playwright');
const path = require('path');
const APP = 'sacsemea.gategroup.com';

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];

  const prefix = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a[href]')].map(x => x.getAttribute('href')).find(h => /^\/\d+\//.test(h || ''));
    return a ? a.match(/^\/(\d+)\//)[1] : null;
  });
  console.log('current route prefix: /' + prefix + '/');

  // try the likely dashboard URL for the invoice report
  const url = 'https://' + APP + '/' + prefix + '/Reports/DashBoard/VendorInvoiceReport';
  console.log('navigating: ' + url);
  const resp = await page.goto(url, { waitUntil: 'networkidle' }).catch(e => ({ err: e.message }));
  console.log('landed: ' + page.url() + '   title: ' + (await page.title().catch(() => '')));
  await page.waitForTimeout(1200);

  const dump = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    return {
      breadcrumb: clean(document.querySelector('.breadcrumb, [class*=bread]')?.textContent),
      inputs: [...document.querySelectorAll('input,textarea,select')].map(i => ({
        tag: i.tagName, id: i.id || '', name: i.name || '', type: i.type || '',
        checked: i.type === 'checkbox' ? i.checked : undefined, value: clean(i.value),
      })),
      exportBtns: [...document.querySelectorAll('a,button,input')]
        .filter(el => /export|refresh|download/i.test((el.id || '') + ' ' + (el.className || '') + ' ' + clean(el.textContent) + ' ' + (el.value || '')))
        .map(el => ({ tag: el.tagName, id: el.id || '', cls: (el.className || '').toString().slice(0, 45), t: clean(el.textContent || el.value).slice(0, 25) }))
        .slice(0, 20),
      grids: [...document.querySelectorAll('table,[class*=grid],[id*=grid],[id*=Job],[class*=Job]')]
        .map(g => ({ tag: g.tagName, id: g.id || '', cls: (g.className || '').toString().slice(0, 45) })).slice(0, 15),
    };
  });
  console.log('\nbreadcrumb: ' + dump.breadcrumb);
  console.log('\n=== INPUTS ==='); dump.inputs.forEach(i => console.log('  ' + JSON.stringify(i)));
  console.log('\n=== EXPORT/REFRESH/DOWNLOAD ==='); dump.exportBtns.forEach(b => console.log('  ' + JSON.stringify(b)));
  console.log('\n=== GRIDS / JOB TABLES ==='); dump.grids.forEach(g => console.log('  ' + JSON.stringify(g)));

  const shot = path.join(__dirname, 'downloads', 'invoice-form.png');
  await page.screenshot({ path: shot }).catch(() => {});
  console.log('\nscreenshot: ' + shot);

  await browser.close();   // detaches CDP only; window stays open
})().catch(e => console.error('ERR', e)).finally(() => process.exit(0));
