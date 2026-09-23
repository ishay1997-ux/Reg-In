// crop.mjs — cut the top of a full-page screenshot (the part a person sees first).
// usage: node crop.mjs <in.png> <out.png> <height=900> [width=1536]
import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire('C:/Users/ishay/Reg-In-dash-wt/package.json')
const { chromium } = require('@playwright/test')
const [input, out, h = '900', w = '1536'] = process.argv.slice(2)
const src = 'data:image/png;base64,' + fs.readFileSync(input).toString('base64')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } })
await page.setContent(`<body style="margin:0"><img src="${src}" style="display:block"></body>`)
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: Number(w), height: Number(h) } })
await browser.close()
console.log('wrote', out)
