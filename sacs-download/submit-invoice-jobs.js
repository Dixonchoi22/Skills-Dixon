/*
  submit-invoice-jobs.js — Phase A of the invoice backfill.

  For each (unit, month) it switches unit, opens the Vendor Invoice Report,
  sets the whole-month date range, and clicks Export to CREATE a job. It does
  NOT wait for jobs (they take up to ~1h server-side). A later Phase B returns
  and downloads the completed jobs.

  Attaches over CDP 9222. EXPORT ONLY — creates report jobs, changes nothing.

  node submit-invoice-jobs.js           # DRY RUN: switch + navigate, NO Export
  node submit-invoice-jobs.js submit    # real: also clicks Export
*/
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SUBMIT = (process.argv[2] || '').toLowerCase() === 'submit';
const APP = 'sacsemea.gategroup.com';
const LOG = path.join(__dirname, 'invoice-submissions.json');

// unit label in #WorkingUnit  ->  filename country/unit token
const UNITS = [
  { label: 'UK-MASTER',      token: 'UK'      },
  { label: 'CH-MASTER',      token: 'CH'      },
  { label: 'IRL-MASTER',     token: 'IRL'     },
  { label: 'EU-MASTER',      token: 'NL'      },   // NL is pulled from EU master
  { label: 'SE-ARN 3056',    token: 'SE,ARN'  },
  { label: 'SE-GOT 3057',    token: 'SE,GOT'  },
  { label: 'SE-MMX 3058',    token: 'SE,MMX'  },
  { label: 'NO-OSL 3052',    token: 'NO,OSL'  },
  { label: 'NO-BGO 3053',    token: 'NO,BGO'  },
];
// DK excluded on purpose — no master, unit set unconfirmed, CPH on hold.

// backfill months: last day per month (2026)
const MONTHS = [
  { mon: 'Feb', from: '01/02/2026', to: '28/02/2026' },
  { mon: 'Mar', from: '01/03/2026', to: '31/03/2026' },
  { mon: 'Apr', from: '01/04/2026', to: '30/04/2026' },
  { mon: 'May', from: '01/05/2026', to: '31/05/2026' },
  { mon: 'Jun', from: '01/06/2026', to: '30/06/2026' },
];

const unitText = async page => (await page.locator('text=/Unit:\\s*\\S+/').first().textContent().catch(() => '') || '').replace(/\s+/g, ' ').trim();
const routePrefix = page => page.evaluate(() => { const a=[...document.querySelectorAll('a[href]')].map(x=>x.getAttribute('href')).find(h=>/^\/\d+\//.test(h||'')); return a?a.match(/^\/(\d+)\//)[1]:null; });

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('sacsemea')) || ctx.pages()[0];

  await page.goto('https://' + APP + '/', { waitUntil: 'networkidle' }).catch(() => {});
  const opts = await page.evaluate(() => { const s=document.querySelector('#WorkingUnit'); return s?[...s.options].map(o=>({v:o.value,t:(o.textContent||'').replace(/\s+/g,' ').trim()})):[]; });

  const submissions = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : [];
  console.log((SUBMIT ? 'SUBMIT' : 'DRY RUN') + ' — ' + UNITS.length + ' units x ' + MONTHS.length + ' months = ' + (UNITS.length * MONTHS.length) + ' jobs\n');

  for (const u of UNITS) {
    const opt = opts.find(o => o.t === u.label) || opts.find(o => o.t.startsWith(u.label));
    if (!opt) { console.log('!! unit not found in dropdown: ' + u.label + ' — SKIPPED'); continue; }

    await Promise.all([
      page.waitForNavigation({ timeout: 20000 }).catch(() => {}),
      page.selectOption('#WorkingUnit', opt.v).then(() => page.dispatchEvent('#WorkingUnit', 'change')).catch(() => {}),
    ]);
    await page.waitForTimeout(1500);
    const ut = await unitText(page);
    const prefix = await routePrefix(page);
    const ok = ut.includes(u.label) || ut.toUpperCase().includes(u.label.split(' ')[0].toUpperCase());
    console.log((ok ? 'OK ' : '?? ') + u.label + '  -> ' + ut + '  /' + prefix + '/');
    if (!ok) { console.log('   switch uncertain — skipping this unit for safety'); continue; }

    await page.goto('https://' + APP + '/' + prefix + '/Reports/DashBoard/VendorInvoiceReport', { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(800);

    for (const m of MONTHS) {
      await page.fill('#FromPeriod', m.from).catch(() => {});
      await page.dispatchEvent('#FromPeriod', 'change').catch(() => {});
      await page.fill('#ToPeriod', m.to).catch(() => {});
      await page.dispatchEvent('#ToPeriod', 'change').catch(() => {});
      await page.waitForTimeout(250);
      const fv = await page.inputValue('#FromPeriod').catch(() => '');
      const tv = await page.inputValue('#ToPeriod').catch(() => '');
      if (fv !== m.from || tv !== m.to) { console.log('    ' + m.mon + '  date set failed (' + fv + '..' + tv + ') — skipping'); continue; }

      if (SUBMIT) {
        await page.click('#ExportVendorInvoiceReport').catch(() => {});
        await page.waitForTimeout(1800);
        submissions.push({ unit: u.label, token: u.token, mon: m.mon, year: 2026, from: m.from, to: m.to, submittedAt: new Date().toISOString() });
        console.log('    submitted ' + u.token + ' ' + m.mon + '-2026');
      } else {
        console.log('    would submit ' + u.token + ' ' + m.mon + '-2026  (' + m.from + '..' + m.to + ')');
      }
    }
  }

  if (SUBMIT) { fs.writeFileSync(LOG, JSON.stringify(submissions, null, 2)); console.log('\nlogged ' + submissions.length + ' submissions to ' + LOG); }
  else console.log('\nDRY RUN complete — nothing submitted. Re-run with "submit".');
  await browser.close();
})().catch(e => console.error('ERR', e)).finally(() => process.exit(0));
