// compose.mjs <out.png> <title> <leftLabel> <left.png> <rightLabel> <right.png>
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire('C:/Users/ishay/Reg-In-copy-wt/package.json')
const { chromium } = require('@playwright/test')
const [out, title, lLabel, lImg, rLabel, rImg] = process.argv.slice(2)
const b64 = (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64')
const html = `<!doctype html><html dir="rtl"><body style="margin:0;font-family:Segoe UI,Arial;background:#F8FAFC">
<h1 style="font-size:28px;margin:16px 24px;color:#0F766E">${title}</h1>
<div style="display:flex;gap:24px;padding:0 24px 24px;align-items:flex-start">
<figure style="margin:0;flex:1"><figcaption style="font-size:22px;font-weight:700;margin-bottom:8px;color:#334155">${lLabel}</figcaption><img src="${b64(lImg)}" style="width:100%;border:1px solid #CBD5E1"></figure>
<figure style="margin:0;flex:1"><figcaption style="font-size:22px;font-weight:700;margin-bottom:8px;color:#334155">${rLabel}</figcaption><img src="${b64(rImg)}" style="width:100%;border:1px solid #CBD5E1"></figure>
</div></body></html>`
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 2000, height: 1000 } })
await page.setContent(html)
await page.waitForTimeout(500)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log('wrote', path.basename(out))
