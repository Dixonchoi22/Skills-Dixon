/*
  launch-hold.js — open ONE SACS browser and keep it alive, with a CDP port so
  other scripts attach instead of opening their own window.

  Run in background:  node launch-hold.js
  Then other scripts:  chromium.connectOverCDP('http://localhost:9222')

  Dixon signs in once; the .auth-chrome profile persists it.
*/
const { chromium } = require('playwright');
const path = require('path');
const PROFILE = path.join(__dirname, '.auth-chrome');
const APP = 'sacsemea.gategroup.com';

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    channel: 'chrome',
    headless: false,
    viewport: null,
    acceptDownloads: true,
    args: ['--start-maximized', '--no-sandbox', '--remote-debugging-port=9222'],
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.goto('https://' + APP + '/', { waitUntil: 'domcontentloaded' }).catch(() => {});
  console.log('HELD OPEN with CDP on 9222. Sign in if prompted. Ctrl-C to close.');
  // never resolve; keep the browser open
  await new Promise(() => {});
})();
