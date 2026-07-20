/* switch-unit.js — prove we can switch the SACS working unit reliably.
   Attaches over CDP, switches to the unit named in argv, verifies the change.
   Switching units is what Dixon does by hand all day — safe, no data change.

   Usage: node switch-unit.js "CH-MASTER"
*/
const { chromium } = require('playwright');
const TARGET = process.argv[2] || 'CH-MASTER';
const APP = 'sacsemea.gategroup.com';

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];

  await page.goto('https://' + APP + '/', { waitUntil: 'networkidle' }).catch(() => {});
  const before = (await page.locator('text=/Unit:\\s*\\S+/').first().textContent().catch(() => '') || '').replace(/\s+/g, ' ').trim();
  console.log('before: ' + before);

  // The unit selector is a <select id="WorkingUnit"> whose option text is the
  // unit name. Selecting it triggers SACS's onchange -> navigation.
  const opts = await page.evaluate(() => {
    const s = document.querySelector('#WorkingUnit');
    if (!s) return null;
    return [...s.options].map(o => ({ v: o.value, t: (o.textContent || '').replace(/\s+/g, ' ').trim() }));
  });
  if (!opts) { console.log('no #WorkingUnit select found'); await browser.close(); return; }
  const match = opts.find(o => o.t === TARGET) || opts.find(o => o.t.startsWith(TARGET));
  console.log('target option: ' + JSON.stringify(match));
  if (!match) { console.log('unit "' + TARGET + '" not in dropdown'); await browser.close(); return; }

  await Promise.all([
    page.waitForNavigation({ timeout: 20000 }).catch(() => {}),
    page.selectOption('#WorkingUnit', match.v).then(() => page.dispatchEvent('#WorkingUnit', 'change')).catch(() => {}),
  ]);
  await page.waitForTimeout(2500);
  await page.waitForLoadState('networkidle').catch(() => {});

  const after = (await page.locator('text=/Unit:\\s*\\S+/').first().textContent().catch(() => '') || '').replace(/\s+/g, ' ').trim();
  const prefix = await page.evaluate(() => { const a=[...document.querySelectorAll('a[href]')].map(x=>x.getAttribute('href')).find(h=>/^\/\d+\//.test(h||'')); return a?a.match(/^\/(\d+)\//)[1]:null; });
  console.log('after : ' + after + '   prefix /' + prefix + '/');
  console.log(after.includes(TARGET.replace('-MASTER','')) || after.toUpperCase().includes(TARGET.toUpperCase()) ? 'SWITCH OK' : 'SWITCH UNCERTAIN — check the after-unit text');

  await browser.close();
})().catch(e => console.error('ERR', e)).finally(() => process.exit(0));
