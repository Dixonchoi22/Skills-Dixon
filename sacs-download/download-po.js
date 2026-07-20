/*
  download-po.js — automate ONE unit's Received Purchase Orders export.

  Modes:
    node download-po.js inspect   -> navigate to the PO report for the CURRENT
                                     unit and describe the form. Clicks nothing,
                                     exports nothing. READ ONLY.
    node download-po.js run        -> also set previous month + Export + capture
                                     the download to STAGING (never the real
                                     spend folder). A later, separate step files
                                     it after Dixon has seen it.

  Login: reuses the .auth-chrome profile. If the session has expired the script
  pauses so Dixon can sign in; Claude never handles the password.
*/
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const MODE      = (process.argv[2] || 'inspect').toLowerCase();
const PROFILE   = path.join(__dirname, '.auth-chrome');
const STAGING   = path.join(__dirname, 'downloads');
const APP_HOST  = 'sacsemea.gategroup.com';

const prevMonth = () => {
  // previous calendar month, as {mm, yyyy}. Date.now is fine here (real run only).
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  return { mm: String(d.getMonth() + 1).padStart(2, '0'), yyyy: String(d.getFullYear()) };
};

(async () => {
  if (!fs.existsSync(STAGING)) fs.mkdirSync(STAGING, { recursive: true });

  const ctx = await chromium.launchPersistentContext(PROFILE, {
    channel: 'chrome',
    headless: false,
    viewport: null,
    acceptDownloads: true,
    args: ['--start-maximized', '--no-sandbox'],
  });
  const page = ctx.pages()[0] || await ctx.newPage();

  console.log('Opening SACS...');
  await page.goto('https://' + APP_HOST + '/', { waitUntil: 'domcontentloaded' }).catch(() => {});

  // wait for an authenticated app page
  const deadline = Date.now() + 4 * 60 * 1000;
  while (Date.now() < deadline) {
    let host = ''; try { host = new URL(page.url()).host; } catch {}
    if (host === APP_HOST) break;
    process.stdout.write('.'); await page.waitForTimeout(2000);
  }
  console.log('');
  if (new URL(page.url()).host !== APP_HOST) { console.log('Not signed in — sign in in the window, then re-run.'); return; }

  await page.waitForLoadState('networkidle').catch(() => {});

  // current unit + route prefix
  const unit = (await page.locator('text=/Unit:\\s*\\S+/').first().textContent().catch(() => '') || '').replace(/\s+/g, ' ').trim();
  const prefix = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a[href]')].map(x => x.getAttribute('href'))
      .find(h => /^\/\d+\//.test(h || ''));
    return a ? a.match(/^\/(\d+)\//)[1] : null;
  });
  console.log('Signed in.  ' + unit + '   route prefix: /' + prefix + '/');
  if (!prefix) { console.log('Could not read route prefix.'); return; }

  const reportUrl = 'https://' + APP_HOST + '/' + prefix + '/Reports/DashBoard/ReceivedPurchaseOrders';
  console.log('Going to ' + reportUrl);
  await page.goto(reportUrl, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);

  // describe the form
  const form = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    return {
      inputs: [...document.querySelectorAll('input,textarea,select')].map(i => ({
        tag: i.tagName, id: i.id || '', name: i.name || '', type: i.type || '',
        readonly: i.readOnly || false, checked: i.type === 'checkbox' ? i.checked : undefined,
        value: clean(i.value), ph: clean(i.placeholder),
      })),
      buttons: [...document.querySelectorAll('button,a.btn,input[type=button],input[type=submit],[onclick]')]
        .map(b => ({ tag: b.tagName, t: clean(b.textContent || b.value), id: b.id || '' }))
        .filter(o => o.t && /export|download/i.test(o.t)).slice(0, 10),
    };
  });
  console.log('\n=== FORM INPUTS ===');
  form.inputs.forEach(i => console.log('  ' + JSON.stringify(i)));
  console.log('\n=== EXPORT/DOWNLOAD BUTTONS ===');
  form.buttons.forEach(b => console.log('  ' + JSON.stringify(b)));

  const shot = path.join(STAGING, 'po-form.png');
  await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
  console.log('\nScreenshot: ' + shot);

  if (MODE !== 'run') {
    console.log('\nINSPECT mode — nothing clicked. Re-run with "run" to export.');
    return;
  }

  // ---- run mode: set previous month, export, capture to STAGING only --------
  const { mm, yyyy } = prevMonth();
  const monthStr = mm + '/' + yyyy;                 // e.g. "06/2026"
  console.log('\nSetting Select Month = ' + monthStr);

  await page.fill('#Month', monthStr);
  await page.dispatchEvent('#Month', 'change').catch(() => {});
  await page.dispatchEvent('#Month', 'blur').catch(() => {});
  await page.waitForTimeout(600);
  const readback = await page.inputValue('#Month').catch(() => '');
  console.log('  #Month now reads: "' + readback + '"');
  if (!readback.includes(yyyy)) { console.log('  Month did not stick — stopping, will not export a wrong period.'); return; }

  // defaults already correct: includeAdditionalPo/NonInventory ticked, CSV selected
  console.log('Clicking Export and waiting for the download...');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 90000 }),
    page.click('#exportButton'),          // the real green Export button (an <a>)
  ]);

  const suggested = download.suggestedFilename();
  const staged = path.join(STAGING, 'STAGED_' + mm + yyyy.slice(2) + '.csv');
  await download.saveAs(staged);
  console.log('  suggested filename : ' + suggested);
  console.log('  saved to staging   : ' + staged);

  const buf = fs.readFileSync(staged, 'utf8');
  const firstLine = buf.split(/\r?\n/).find(l => l.trim().length) || '';
  console.log('  bytes: ' + fs.statSync(staged).size + '  rows: ' + buf.split(/\r?\n/).filter(l => l.trim()).length);
  console.log('  header: ' + firstLine.slice(0, 90));
  console.log('\nStaged only — NOT placed in the spend folder. Compare, then file it in a separate step.');
  console.log('\nDONE. Leaving the browser OPEN so it is not opened/closed again.');
  await page.waitForTimeout(60 * 60 * 1000);   // keep the window alive for reuse
})().catch(e => console.error('ERROR', e));
