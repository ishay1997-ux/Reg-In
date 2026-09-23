// shoot.mjs — screenshots + measurements of REG-IN pages as a logged-in identity.
// usage: node shoot.mjs <outDir> <identity> <width> <path1> [path2 ...]
//   env SHOOT_MODE=2 forces onboarding mode 2 (network intercept, no DB write)
//   env SHOOT_EVAL=<file.js> runs that JS in the page after load and writes <name>.json
// Credentials come from .env.local (E2E_*) and are never printed.
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const REPO = 'C:/Users/ishay/Reg-In-dash-wt'
const require = createRequire(path.join(REPO, 'package.json'))
const { chromium } = require('@playwright/test')

for (const line of fs.readFileSync(path.join(REPO, '.env.local'), 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i < 0) continue
  const k = t.slice(0, i).trim(); if (!(k in process.env)) process.env[k] = t.slice(i + 1).trim()
}
const BASE = process.env.SHOOT_BASE || 'http://localhost:5173'
const [outDir, identity, width, ...paths] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 }, locale: 'he-IL' })
const page = await ctx.newPage()
if (process.env.SHOOT_MODE) {
  const mode = Number(process.env.SHOOT_MODE)
  await page.route('**/rest/v1/notification_preferences*', async (route) => {
    const res = await route.fetch(); let body = await res.json()
    if (Array.isArray(body)) body = body.map((r) => ({ ...r, onboarding_mode: mode }))
    else if (body && typeof body === 'object') body = { ...body, onboarding_mode: mode }
    await route.fulfill({ response: res, json: body })
  })
}
if (process.env.SHOOT_PATCH) {
  const { default: patch } = await import('file:///' + process.env.SHOOT_PATCH.replace(/\\/g, '/'))
  await page.route('**/rest/v1/rpc/report_*', async (route) => {
    const res = await route.fetch()
    const rpc = new URL(route.request().url()).pathname.split('/').pop()
    const body = await res.json()
    await route.fulfill({ response: res, json: patch(rpc, body) })
  })
}
await page.goto(`${BASE}/login`)
if ((await page.title()) !== 'REG-IN') throw new Error('not REG-IN on ' + BASE)
await page.getByPlaceholder('כתובת אימייל').fill(process.env[`E2E_${identity}_EMAIL`])
await page.getByPlaceholder('סיסמה').fill(process.env[`E2E_${identity}_PASSWORD`])
await page.getByRole('button', { name: 'התחברות', exact: true }).click()
await page.waitForURL(`${BASE}/`, { timeout: 30000 })
const evalSrc = process.env.SHOOT_EVAL ? fs.readFileSync(process.env.SHOOT_EVAL, 'utf8') : null
for (const p of paths) {
  await page.goto(`${BASE}${p}`)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1500)
  if (process.env.SHOOT_PRE) {
    await page.evaluate(process.env.SHOOT_PRE)
    await page.waitForTimeout(500)
  }
  const name = p.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'root'
  await page.screenshot({ path: path.join(outDir, `${name}-${width}.png`), fullPage: true })
  const info = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    h1: document.querySelector('h1')?.innerText ?? null,
  }))
  let extra = null
  if (evalSrc) extra = await page.evaluate(evalSrc)
  fs.writeFileSync(path.join(outDir, `${name}-${width}.json`), JSON.stringify({ path: p, ...info, extra }, null, 2))
  console.log(p, JSON.stringify(info))
}
await browser.close()
