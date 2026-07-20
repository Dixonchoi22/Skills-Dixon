/*
  read-page.js — attach to the running Chrome and describe the page Dixon is on.

  READ ONLY. It clicks nothing, submits nothing, downloads nothing. SACS is a
  production system, so this tool is deliberately incapable of changing state.

  Run:  node read-page.js
*/
const { chromium } = require('playwright');

const PORT = process.env.SACS_PORT || 9222;

(async () => {
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:' + PORT);
  } catch (e) {
    console.log('Could not attach to Chrome on port ' + PORT + '.');
    console.log('Start it first:  .\\start-browser.ps1');
    process.exit(1);
  }

  const ctx = browser.contexts()[0];
  const pages = ctx.pages().filter(p => !p.url().startsWith('devtools://'));
  if (!pages.length) { console.log('No open pages.'); await browser.close(); return; }

  // the SACS tab, else the last one
  const page = pages.find(p => p.url().includes('sacsemea')) || pages[pages.length - 1];

  console.log('URL   : ' + page.url());
  console.log('TITLE : ' + (await page.title()));
  if (pages.length > 1) {
    console.log('(' + pages.length + ' tabs open)');
    pages.forEach((p, i) => console.log('   tab' + i + ': ' + p.url().slice(0, 110)));
  }

  const describe = async (frame, tag) => {
    let d;
    try {
      d = await frame.evaluate(() => {
        const clean = s => (s || '').replace(/\s+/g, ' ').trim().slice(0, 80);
        const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const uniq = a => [...new Map(a.map(o => [JSON.stringify(o), o])).values()];
        return {
          buttons: uniq([...document.querySelectorAll('button,input[type=button],input[type=submit],a.btn,[role=button]')]
            .filter(vis).map(b => ({ t: clean(b.textContent || b.value), id: b.id || '', cls: (b.className || '').toString().slice(0, 40) }))
            .filter(o => o.t)).slice(0, 50),
          inputs: uniq([...document.querySelectorAll('input:not([type=hidden]),textarea')]
            .filter(vis).map(i => ({ id: i.id || i.name || '', type: i.type || 'text', val: clean(i.value), ph: clean(i.placeholder) }))).slice(0, 40),
          selects: [...document.querySelectorAll('select')].filter(vis).map(s => ({
            id: s.id || s.name || '', sel: clean(s.options[s.selectedIndex] && s.options[s.selectedIndex].textContent),
            n: s.options.length, opts: [...s.options].slice(0, 12).map(o => clean(o.textContent)),
          })).slice(0, 20),
          tables: [...document.querySelectorAll('table')].filter(vis).slice(0, 6).map(t => ({
            id: t.id || '', rows: t.rows.length,
            head: [...(t.rows[0] ? t.rows[0].cells : [])].slice(0, 12).map(c => clean(c.textContent)),
          })),
          grids: uniq([...document.querySelectorAll('[class*=grid],[class*=Grid],[id*=grid],[id*=Grid]')]
            .filter(vis).map(g => ({ id: g.id || '', cls: (g.className || '').toString().slice(0, 50) }))).slice(0, 10),
          exportish: uniq([...document.querySelectorAll('a,button,span,i,div')]
            .filter(vis)
            .filter(el => /export|download|excel|csv|xls|print|generate|report/i.test(
              (el.textContent || '') + ' ' + (el.className || '') + ' ' + (el.id || '') + ' ' + (el.title || '')))
            .map(el => ({ tag: el.tagName, t: clean(el.textContent), id: el.id || '', title: clean(el.title), cls: (el.className || '').toString().slice(0, 45) }))
            .filter(o => o.t || o.id || o.title)).slice(0, 30),
        };
      });
    } catch { return; }

    const show = (label, rows) => { if (rows && rows.length) { console.log('\n=== ' + tag + label + ' (' + rows.length + ') ==='); rows.forEach(r => console.log('  ' + JSON.stringify(r))); } };
    show('EXPORT/DOWNLOAD-LIKE', d.exportish);
    show('BUTTONS', d.buttons);
    show('SELECTS', d.selects);
    show('INPUTS', d.inputs);
    show('TABLES', d.tables);
    show('GRIDS', d.grids);
  };

  await describe(page.mainFrame(), '');
  for (const f of page.frames()) {
    if (f === page.mainFrame()) continue;
    console.log('\n--- iframe: ' + f.url().slice(0, 110) + ' ---');
    await describe(f, 'iframe:');
  }

  await browser.close();   // detaches CDP only; the Chrome window stays open
})();
