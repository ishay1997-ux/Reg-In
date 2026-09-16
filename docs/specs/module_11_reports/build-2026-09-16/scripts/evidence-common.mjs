// evidence-common.mjs — shared Playwright helpers for the module-11 evidence run (brief P3-S).
// Run from the repo root (C:\Users\ishay\Reg-In):  node <scratchpad>/evidence-run.mjs --tab exec
// Credentials: read from .env.local (E2E_*) by loadEnvLocal() only — never printed, never logged.
// Onboarding mode: forced by intercepting the single GET AuthContext sends (pattern copied from
// e2e/reports.spec.js:128 forceOnboardingMode) — NEVER a database write.
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
// The scratchpad lives outside the repo: resolve @playwright/test from the repo's node_modules
// (this is why the runner must be started from the repo root).
const require = createRequire(path.resolve(process.cwd(), 'package.json'))
const { chromium, expect } = require('@playwright/test')

export const BASE_URL = process.env.EVIDENCE_BASE_URL || 'http://localhost:5189'
export const VIEWPORT = { width: 1280, height: 800 }
export const IDENTITIES = ['CEO', 'FINANCE', 'RECRUIT', 'STAFF']

// Slugs copied from src/modules/11_reports/reportsCatalog.js (display order per tab).
export const TABS = {
  exec: [
    { id: 'מ2', slug: 'exec-overview', rpc: 'report_m02_exec_overview', drill: false },
    { id: 'מ3', slug: 'trends', rpc: 'report_m03_trends', drill: true },
    { id: 'מ4', slug: 'discounts', rpc: 'report_m04_discounts', drill: false },
    { id: 'מ6', slug: 'staffing', rpc: 'report_m06_staffing', drill: false },
  ],
  finance: [
    { id: 'מ7', slug: 'finance-overview', rpc: 'report_m07_finance_overview', drill: false },
    { id: 'מ8', slug: 'profitability', rpc: 'report_m08_profitability', drill: false },
    { id: 'מ9', slug: 'aging', rpc: 'report_m09_aging', drill: true },
    { id: 'מ12', slug: 'equipment', rpc: 'report_m12_equipment', drill: false },
  ],
  hostesses: [
    { id: 'מ14', slug: 'hostess-overview', rpc: 'report_m14_hostess_overview', drill: false },
    { id: 'מ15', slug: 'reliability', rpc: 'report_m15_reliability', drill: false },
    { id: 'מ16', slug: 'quality-cost', rpc: 'report_m16_quality_cost', drill: false },
    { id: 'מ17', slug: 'fairness', rpc: 'report_m17_fairness', drill: false },
  ],
  customers: [
    { id: 'מ19', slug: 'customers-overview', rpc: 'report_m19_customers_overview', drill: false },
    { id: 'מ20', slug: 'satisfaction', rpc: 'report_m20_satisfaction', drill: false },
    { id: 'מ21', slug: 'drifting', rpc: 'report_m21_drifting', drill: false },
    { id: 'מ22', slug: 'notes', rpc: 'report_m22_notes', drill: false },
  ],
}

// Same .env.local loader as playwright.config.js / scripts/smoke.mjs (no dotenv dependency).
export function loadEnvLocal(repoRoot = process.cwd()) {
  const envLocalPath = path.resolve(repoRoot, '.env.local')
  if (!fs.existsSync(envLocalPath)) throw new Error('.env.local not found — run from the repo root')
  for (const line of fs.readFileSync(envLocalPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim()
  }
}

function credentials(identity) {
  const email = process.env[`E2E_${identity}_EMAIL`]
  const password = process.env[`E2E_${identity}_PASSWORD`]
  if (!email || !password) throw new Error(`E2E_${identity}_EMAIL/_PASSWORD missing in .env.local`)
  return { email, password }
}

// login() — copied from e2e/permissions.spec.js word for word (extended timeout and its reason).
export async function login(page, identity) {
  const { email, password } = credentials(identity)
  await page.goto(`${BASE_URL}/login`)
  await page.getByPlaceholder('כתובת אימייל').fill(email)
  await page.getByPlaceholder('סיסמה').fill(password)
  await page.getByRole('button', { name: 'התחברות', exact: true }).click()
  // login = a long chain of network calls (lock-check, Auth, reset, users fetch) before the redirect.
  await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 30_000 })
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// One login per identity per agent; the storage state is reused for both onboarding modes.
// Retries 3× with a pause — the m4 E2E precedent was a login timeout under load, not a bug.
// 🔴 src/supabaseClient.js persists the session in `sessionStorage` (not localStorage), so
// Playwright's storageState() captures nothing — the session is copied out of sessionStorage by
// hand and restored through addInitScript. The file holds a live token: never print or cat it.
// A state older than 40 minutes is re-created (access tokens live 60 min; two contexts refreshing
// the same rotated refresh token would invalidate each other).
const STATE_MAX_AGE_MS = 40 * 60 * 1000
export async function ensureStorageState(browser, identity, stateFile, log = console.log) {
  if (fs.existsSync(stateFile) && Date.now() - fs.statSync(stateFile).mtimeMs < STATE_MAX_AGE_MS) {
    return { stateFile, attempts: 0, reused: true }
  }
  let lastErr = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    const context = await browser.newContext({ viewport: VIEWPORT, locale: 'he-IL' })
    const page = await context.newPage()
    try {
      await login(page, identity)
      const session = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(sessionStorage))))
      if (!Object.keys(JSON.parse(session)).length) throw new Error('sessionStorage empty after login')
      fs.mkdirSync(path.dirname(stateFile), { recursive: true })
      fs.writeFileSync(stateFile, JSON.stringify({ identity, saved_at: new Date().toISOString(), sessionStorage: session }), 'utf-8')
      await context.close()
      return { stateFile, attempts: attempt, reused: false }
    } catch (err) {
      lastErr = err
      log(`login ${identity} attempt ${attempt} failed: ${String(err?.message ?? err).slice(0, 160)}`)
      await context.close()
      await sleep(15_000 * attempt)
    }
  }
  throw new Error(`login ${identity} failed after 3 attempts: ${String(lastErr?.message ?? lastErr).slice(0, 200)}`)
}

// Intercept the single GET AuthContext learns the onboarding level from. Registered BEFORE the
// first navigation of the page, because the call goes out inside loadUser. (e2e/reports.spec.js:128)
export async function forceOnboardingMode(page, level) {
  await page.route('**/rest/v1/notification_preferences*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const response = await route.fetch()
    const text = await response.text()
    let body
    try {
      const parsed = JSON.parse(text)
      // 🔴 Found by the evidence agents 16/09 23:5X: an identity with NO notification_preferences
      // row gets `[]` back, `.map` rewrites nothing, AuthContext's maybeSingle ⇒ null ⇒ mode 0.
      // FINANCE and RECRUIT have no row. An empty array becomes one synthetic row (the GET is
      // `select=onboarding_mode`, so that is the whole shape AuthContext reads). Still no DB write.
      body = Array.isArray(parsed)
        ? JSON.stringify(parsed.length ? parsed.map((row) => ({ ...row, onboarding_mode: level })) : [{ onboarding_mode: level }])
        : JSON.stringify({ ...(parsed ?? {}), onboarding_mode: level })
    } catch {
      body = JSON.stringify({ onboarding_mode: level })
    }
    await route.fulfill({ response, body })
  })
}

// A fresh context per (identity, mode): storage state → route → page with console-error capture.
export async function newIdentityPage(browser, stateFile, mode) {
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'he-IL' })
  const saved = JSON.parse(fs.readFileSync(stateFile, 'utf-8'))
  const entries = Object.entries(JSON.parse(saved.sessionStorage))
  // Restore the session before any app script runs, on our origin only.
  await context.addInitScript(
    ({ entries, origin }) => {
      if (window.location.origin !== origin) return
      if (sessionStorage.getItem('__evidence_restored') === '1') return
      for (const [k, v] of entries) sessionStorage.setItem(k, v)
      sessionStorage.setItem('__evidence_restored', '1')
    },
    { entries, origin: BASE_URL },
  )
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300))
  })
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${String(err).slice(0, 300)}`))
  await forceOnboardingMode(page, mode)
  return { context, page, consoleErrors }
}

// Opens a surface and waits for ONE of the terminal states (never `-loading`), then settles.
// Returns: 'rendered' | 'blank' | 'empty' | 'error' | 'no-permission' | 'masked' (tab not
// openable by this identity: ReportsPage falls back to the first open tab, or to the no-tabs
// envelope for an identity with no open tab) | 'unknown'.
export async function openSurface(page, tabKey, slug, { extraQuery = '' } = {}) {
  await page.goto(`${BASE_URL}/reports?tab=${tabKey}&report=${slug}${extraQuery}`)
  const terminal = [
    `[data-testid="report-${slug}"]`,
    `[data-testid="report-${slug}-blank"]`,
    `[data-testid="report-${slug}-empty"]`,
    `[data-testid="report-${slug}-error"]`,
    `[data-testid="report-${slug}-no-permission"]`,
    `[data-testid="reports-no-tabs-blank"]`,
    `[data-testid="reports-tab-${tabKey}"][aria-disabled="true"]`,
  ].join(', ')
  await page.locator(terminal).first().waitFor({ state: 'visible', timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  await sleep(1500) // recharts animation + fonts
  return page.evaluate(
    ({ slug, tabKey }) => {
      const has = (sel) => !!document.querySelector(sel)
      if (has(`[data-testid="reports-tab-${tabKey}"][aria-disabled="true"]`)) return 'masked'
      if (has(`[data-testid="reports-no-tabs-blank"]`)) return 'masked'
      if (has(`[data-testid="report-${slug}"]`)) return 'rendered'
      if (has(`[data-testid="report-${slug}-blank"]`)) return 'blank'
      if (has(`[data-testid="report-${slug}-empty"]`)) return 'empty'
      if (has(`[data-testid="report-${slug}-error"]`)) return 'error'
      if (has(`[data-testid="report-${slug}-no-permission"]`)) return 'no-permission'
      return 'unknown'
    },
    { slug, tabKey },
  )
}

// DOM measurements for one surface (brief P3-S item 3). Probes are scoped to the MAIN table's
// thead (trap: ChartCard's sr-only data table also has <th>).
export async function measure(page, slug) {
  return page.evaluate((slug) => {
    const q = (sel, root = document) => root.querySelector(sel)
    const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel))
    const visible = (el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
    }
    const de = document.documentElement
    const text = (sel) => (q(sel)?.textContent ?? '').replace(/\s+/g, ' ').trim()
    const tableCard = q('[data-testid="report-table-card"]')
    const mainRows = tableCard
      ? qa('[data-testid="report-row"], [data-testid="report-row-drillable"]', tableCard).length
      : 0
    const headers = tableCard ? qa('thead th', tableCard).map((th) => th.textContent.trim()) : []
    const pagerRange = text('[data-testid="report-pager-range"]')
    const m = pagerRange.match(/מתוך\s+([\d,]+)/)
    const hintsAll = qa('[data-testid^="hint-"]')
    return {
      h1: text('h1'),
      state_testid: q(`[data-testid="report-${slug}"]`) ? `report-${slug}` : null,
      scroll_overflow_px: de.scrollWidth - de.clientWidth,
      body_overflow_px: document.body.scrollWidth - document.body.clientWidth,
      hints_visible: hintsAll.filter(visible).length,
      hint_ids: hintsAll.filter(visible).map((el) => el.getAttribute('data-testid').replace(/^hint-/, '')),
      charts: qa('[data-testid^="chart-card-"]').length,
      chart_types: qa('[data-testid^="chart-card-"]').map((el) => el.getAttribute('data-testid')),
      tiles: q('[data-testid="report-tiles"]') ? q('[data-testid="report-tiles"]').children.length : 0,
      tile_doors: qa('[data-testid^="report-tile-link-"]').length,
      rows_page1: mainRows,
      pager_total: m ? Number(m[1].replace(/,/g, '')) : null,
      pager_range: pagerRange || null,
      table_headers: headers,
      extra_tables: qa('[data-testid="report-extra-table"]').length,
      population: text('[data-testid="report-population"]') || null,
      so_what: text('[data-testid="report-so-what"]') || null,
      definitions: text('[data-testid="report-definitions"]') || null,
      window_label: text('[data-testid="reports-window-label"]') || null,
      export_file: text('[data-testid="reports-export-file"]') || null,
      export_columns: text('[data-testid="reports-export-columns"]') || null,
      export_disabled: q('[data-testid="reports-export-button"]')?.disabled ?? null,
      crumbs: text('[data-testid="report-crumbs"]') || null,
      row_cap: text('[data-testid="report-row-cap"]') || null,
      crossfilter_label: text('[data-testid="report-crossfilter-label"]') || null,
      missing_params: text('[data-testid="report-missing-params"]') || null,
      tabs: qa('[data-testid^="reports-tab-"]').map((el) => ({
        id: el.getAttribute('data-testid'),
        masked: el.getAttribute('aria-disabled') === 'true',
        selected: el.getAttribute('aria-selected') === 'true',
      })),
    }
  }, slug)
}

export async function shoot(page, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await page.screenshot({ path: file, fullPage: true })
  return file
}

// Trap from e2e/reports.spec.js: the fixed header steals a click on an element scrolled to the
// minimum — scroll to center first, never `force`.
export async function clickCentered(locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await locator.click()
}

export function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf-8')
}

export async function launchBrowser() {
  return chromium.launch({ headless: true })
}
