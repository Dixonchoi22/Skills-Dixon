/* probe-complete.js — on the current invoice grid, for each COMPLETE job dump
   its row HTML, its View-Criteria content (date range/params), and any download
   control. READ ONLY (opens the criteria popup, downloads nothing). */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('VendorInvoiceReport')) ||
               ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];
  console.log('page: ' + page.url());
  await page.click('#refereshJobStatus').catch(() => {});
  await page.waitForTimeout(2000);

  const rows = await page.evaluate(() => {
    const grid = document.querySelector('#JobStatusViewGrid');
    if (!grid) return [];
    return [...grid.querySelectorAll('tr')].map((tr, i) => {
      const txt = (tr.innerText || '').replace(/\s+/g, ' ').trim();
      const crit = tr.querySelector('a[onclick*=showCriteria]');
      const jobId = crit ? (crit.getAttribute('onclick').match(/showCriteria\((\d+)\)/) || [])[1] : null;
      // any download-ish control in the row
      const dls = [...tr.querySelectorAll('a,img,button')].map(el => ({
        tag: el.tagName, id: el.id || '', href: el.getAttribute('href') || '',
        onclick: (el.getAttribute('onclick') || '').slice(0, 70), src: (el.getAttribute('src') || '').slice(0, 50),
        title: el.getAttribute('title') || '',
      })).filter(d => /download|report|save|export|\.csv|xls/i.test(d.href + d.onclick + d.src + d.title));
      return { i, txt: txt.slice(0, 110), jobId, dls, isComplete: /Complete/i.test(txt) };
    }).filter(r => r.txt);
  });

  console.log('\n=== ROWS ===');
  rows.forEach(r => console.log('  ' + JSON.stringify(r)));

  // open View Criteria for the first COMPLETE job to see the parameters
  const done = rows.find(r => r.isComplete && r.jobId);
  if (done) {
    console.log('\nopening criteria for completed job ' + done.jobId + ' ...');
    await page.evaluate(id => window.gg && gg.sacs && gg.sacs.jobStatus && gg.sacs.jobStatus.showCriteria(id), Number(done.jobId));
    await page.waitForTimeout(1500);
    const crit = await page.evaluate(() => {
      const box = document.querySelector('.k-window, .modal, #viewInfo, [class*=criteria], [id*=Criteria]');
      return box ? (box.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 400) : '(criteria box not found)';
    });
    console.log('CRITERIA: ' + crit);
  } else {
    console.log('\nno completed job with a criteria link found on this grid');
  }
  await browser.close();
})().catch(e => console.error('ERR', e)).finally(() => process.exit(0));
