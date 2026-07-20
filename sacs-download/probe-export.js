/* probe-export.js — find the real Export control. READ ONLY (no click). */
const { chromium } = require('playwright');
const path = require('path');
const PROFILE = path.join(__dirname, '.auth-chrome');
const APP = 'sacsemea.gategroup.com';

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { channel: 'chrome', headless: false, viewport: null, args: ['--start-maximized', '--no-sandbox'] });
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.goto('https://' + APP + '/', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const dl = Date.now() + 180000;
  while (Date.now() < dl) { let h=''; try{h=new URL(page.url()).host;}catch{} if(h===APP)break; await page.waitForTimeout(2000); }
  const prefix = await page.evaluate(() => { const a=[...document.querySelectorAll('a[href]')].map(x=>x.getAttribute('href')).find(h=>/^\/\d+\//.test(h||'')); return a?a.match(/^\/(\d+)\//)[1]:null; });
  await page.goto('https://' + APP + '/' + prefix + '/Reports/DashBoard/ReceivedPurchaseOrders', { waitUntil: 'networkidle' }).catch(()=>{});
  await page.waitForTimeout(1200);

  await page.fill('#Month', '06/2026').catch(()=>{});
  await page.dispatchEvent('#Month','change').catch(()=>{});
  await page.waitForTimeout(500);

  const info = await page.evaluate(() => {
    const clean = s => (s||'').replace(/\s+/g,' ').trim();
    const rect = el => { const r = el.getBoundingClientRect(); return { vis: r.width>0&&r.height>0, x: Math.round(r.x), y: Math.round(r.y) }; };
    const hits = [...document.querySelectorAll('*')].filter(el => {
      const t = clean(el.textContent);
      const v = el.value || '';
      return (el.children.length === 0 && /^export$/i.test(t)) || /^export$/i.test(v) || /export/i.test(el.id||'') || /export/i.test(el.className||'');
    }).slice(0, 20).map(el => ({
      tag: el.tagName, id: el.id||'', cls: (el.className||'').toString().slice(0,50),
      text: clean(el.textContent).slice(0,30), onclick: (el.getAttribute('onclick')||'').slice(0,80),
      href: el.getAttribute('href')||'', ...rect(el),
    }));
    const dateVisible = (() => { const d=document.querySelector('#Date'); if(!d) return 'no #Date'; const r=d.getBoundingClientRect(); return r.width>0&&r.height>0; })();
    const monthVal = (document.querySelector('#Month')||{}).value;
    return { hits, dateVisible, monthVal };
  });

  console.log('#Month value: ' + info.monthVal);
  console.log('#Date visible: ' + info.dateVisible);
  console.log('\n=== elements matching "Export" ===');
  info.hits.forEach(h => console.log('  ' + JSON.stringify(h)));
  await ctx.close();
})().catch(e=>console.error('ERR',e)).finally(()=>process.exit(0));
