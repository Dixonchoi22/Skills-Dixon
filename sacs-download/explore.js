/*
  explore.js — open SACS EMEA, wait for Dixon to sign in, then report what the
  page offers. Read-only: it clicks nothing and downloads nothing.

  Auth model: a REAL Edge window opens and Dixon signs in himself via the
  corporate Microsoft SSO. Claude never sees or handles the password. The
  session is kept in .auth/ (gitignored) so later runs skip the login until it
  expires.

  Run:  node explore.js
*/
const { chromium } = require('playwright');
const path = require('path');

const START_URL = 'https://sacsemea.gategroup.com/';
const APP_HOST  = 'sacsemea.gategroup.com';
// SACS behaves better in Chrome than Edge (Dixon, 2026-07-20).
const BROWSER   = process.env.SACS_BROWSER || 'chrome';   // 'chrome' | 'msedge'
const PROFILE   = path.join(__dirname, '.auth-' + BROWSER);
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    channel: BROWSER,           // use the installed browser - no binary download
    headless: false,            // Dixon must be able to see and use it
    viewport: null,
    args: ['--start-maximized'],
  });
  console.log('Browser: ' + BROWSER);

  const page = ctx.pages()[0] || await ctx.newPage();
  console.log('Opening ' + START_URL);
  await page.goto(START_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});

  // Wait until we are back on the app host (i.e. sign-in finished).
  const deadline = Date.now() + LOGIN_TIMEOUT_MS;
  let signedIn = false;
  while (Date.now() < deadline) {
    const host = (() => { try { return new URL(page.url()).host; } catch { return ''; } })();
    if (host === APP_HOST) { signedIn = true; break; }
    if (!signedIn) process.stdout.write('.');
    await page.waitForTimeout(2000);
  }
  console.log('');

  if (!signedIn) {
    console.log('TIMED OUT waiting for sign-in. Current URL: ' + page.url());
    console.log('Leaving the browser open so you can finish; re-run when signed in.');
    return;                       // deliberately not closing
  }

  await page.waitForLoadState('networkidle').catch(() => {});
  console.log('SIGNED IN');
  console.log('URL   : ' + page.url());
  console.log('TITLE : ' + (await page.title()));

  const dump = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    const uniq = arr => [...new Map(arr.map(o => [JSON.stringify(o), o])).values()];
    return {
      links: uniq([...document.querySelectorAll('a[href]')]
        .map(a => ({ text: clean(a.textContent), href: a.getAttribute('href') }))
        .filter(o => o.text || o.href)).slice(0, 80),
      buttons: uniq([...document.querySelectorAll('button,input[type=button],input[type=submit]')]
        .map(b => ({ text: clean(b.textContent || b.value), id: b.id || '' }))
        .filter(o => o.text)).slice(0, 40),
      selects: [...document.querySelectorAll('select')].map(s => ({
        id: s.id || s.name || '',
        options: [...s.options].slice(0, 15).map(o => clean(o.textContent)),
      })).slice(0, 15),
      frames: [...document.querySelectorAll('iframe')].map(f => f.getAttribute('src')).slice(0, 10),
      headings: uniq([...document.querySelectorAll('h1,h2,h3')].map(h => clean(h.textContent)))
        .filter(Boolean).slice(0, 25),
    };
  });

  const show = (label, rows) => {
    console.log('\n=== ' + label + ' (' + rows.length + ') ===');
    rows.forEach(r => console.log('  ' + JSON.stringify(r)));
  };
  show('HEADINGS', dump.headings);
  show('LINKS', dump.links);
  show('BUTTONS', dump.buttons);
  show('SELECTS', dump.selects);
  if (dump.frames.length) show('IFRAMES', dump.frames);

  console.log('\nBrowser left OPEN on purpose - navigate to the page you download from,');
  console.log('then tell Claude and it will re-read the page from there.');
})();
