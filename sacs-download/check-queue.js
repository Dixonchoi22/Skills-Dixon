/* check-queue.js — read the In-Queue / Complete counts on a few unit grids to
   see what actually queued. READ ONLY. */
const { chromium } = require('playwright');
const APP = 'sacsemea.gategroup.com';
const CHECK = [ ['UK','101'], ['CH','1701'], ['IRL','701'], ['NL','4000'], ['SE,ARN','4602'], ['DK,BLL','4503'] ];
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];
  for (const [name, prefix] of CHECK) {
    await page.goto('https://' + APP + '/' + prefix + '/Reports/DashBoard/VendorInvoiceReport', { waitUntil: 'networkidle' }).catch(() => {});
    await page.click('#refereshJobStatus').catch(() => {});
    await page.waitForTimeout(1500);
    const c = await page.evaluate(() => {
      const g = document.querySelector('#JobStatusViewGrid'); if (!g) return null;
      const rows = [...g.querySelectorAll('tr')].map(r => (r.innerText || '').replace(/\s+/g, ' '));
      const today = rows.filter(r => /20\/07\/2026/.test(r));
      return {
        inQueue: rows.filter(r => /In Queue/i.test(r)).length,
        completeToday: today.filter(r => /Complete/i.test(r)).length,
        inQueueToday: today.filter(r => /In Queue/i.test(r)).length,
      };
    });
    console.log(name.padEnd(8) + '  In-Queue(total)=' + (c ? c.inQueue : '?') + '  today: queued=' + (c ? c.inQueueToday : '?') + ' complete=' + (c ? c.completeToday : '?'));
  }
  await browser.close();
})().catch(e => console.error('ERR', e)).finally(() => process.exit(0));
