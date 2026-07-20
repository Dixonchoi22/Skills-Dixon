/* check-jobs.js — attach, refresh the invoice job grid once, dump its rows and
   any download links. READ ONLY. */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('VendorInvoiceReport')) ||
               ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];
  console.log('page: ' + page.url());
  await page.click('#refereshJobStatus').catch(() => {});
  await page.waitForTimeout(2500);
  const g = await page.evaluate(() => {
    const grid = document.querySelector('#JobStatusViewGrid');
    if (!grid) return { text: '(no #JobStatusViewGrid on this page)' };
    const rows = [...grid.querySelectorAll('tr')].map(r => (r.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const links = [...grid.querySelectorAll('a,button,img,[onclick]')].map(el => ({
      tag: el.tagName, t: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 25),
      id: el.id || '', href: (el.getAttribute && el.getAttribute('href')) || '',
      onclick: (el.getAttribute && el.getAttribute('onclick') || '').slice(0, 80),
      src: (el.getAttribute && el.getAttribute('src') || '').slice(0, 60),
      title: (el.getAttribute && el.getAttribute('title')) || '',
    }));
    return { rows, links };
  });
  console.log('\n=== JOB ROWS ==='); (g.rows || [g.text]).forEach(r => console.log('  ' + r));
  console.log('\n=== LINKS/ICONS IN GRID ==='); (g.links || []).forEach(l => console.log('  ' + JSON.stringify(l)));
  await browser.close();
})().catch(e => console.error('ERR', e)).finally(() => process.exit(0));
