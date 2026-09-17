// evidence-run.mjs — the matrix runner for one tab (brief P3-S items 1 + 3, plus the extras).
// Usage (from the repo root C:\Users\ishay\Reg-In):
//   node <scratchpad>/evidence-run.mjs --tab exec [--identities CEO,FINANCE,RECRUIT,STAFF]
//        [--modes 0,2] [--surfaces slug,slug] [--extras drill,export,error,empty] [--stagger 0]
//        [--out <scratchpad>/results]
// Writes:  <out>/evidence/<IDENTITY>-m<mode>-<slug>.png   (full page, 1280×800 viewport)
//          <out>/evidence-run-<tab>.json                     (rewritten after EVERY surface — D-24)
// Never writes to the database. Onboarding mode is forced by the PostgREST intercept.
import path from 'path'
import fs from 'fs'
import {
  BASE_URL,
  IDENTITIES,
  TABS,
  clickCentered,
  ensureStorageState,
  launchBrowser,
  loadEnvLocal,
  measure,
  newIdentityPage,
  openSurface,
  shoot,
  sleep,
  writeJson,
} from './evidence-common.mjs'

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1] ?? 'true'] : [])).filter((x) => x.length),
)
const tab = args.tab
if (!TABS[tab]) throw new Error(`--tab must be one of ${Object.keys(TABS).join(', ')}`)
const identities = (args.identities ?? IDENTITIES.join(',')).split(',')
const modes = (args.modes ?? '0,2').split(',').map(Number)
const surfaces = TABS[tab].filter((s) => !args.surfaces || args.surfaces.split(',').includes(s.slug))
const extras = (args.extras ?? '').split(',').filter(Boolean)
const stagger = Number(args.stagger ?? 0)
const out = path.resolve(args.out ?? path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'results'))
const evidenceDir = path.join(out, 'evidence')
const authDir = path.join(out, 'auth')
const reportFile = path.join(out, `evidence-run-${tab}.json`)

loadEnvLocal()
fs.mkdirSync(evidenceDir, { recursive: true })
fs.mkdirSync(authDir, { recursive: true })

const report = {
  tab,
  base_url: BASE_URL,
  started_at: new Date().toISOString(),
  identities,
  modes,
  surfaces: Object.fromEntries(surfaces.map((s) => [s.slug, { id: s.id, rpc: s.rpc, drill: s.drill, identities: {} }])),
  extras: {},
  login: {},
  failures: [],
  finished_at: null,
}
const save = () => writeJson(reportFile, report)
const log = (m) => console.log(`[${tab}] ${m}`)

const browser = await launchBrowser()
try {
  if (stagger > 0) {
    log(`stagger ${stagger}s before the first login`)
    await sleep(stagger * 1000)
  }
  for (const identity of identities) {
    const stateFile = path.join(authDir, `${tab}-${identity}.json`)
    try {
      const r = await ensureStorageState(browser, identity, stateFile, log)
      report.login[identity] = { ok: true, attempts: r.attempts, reused: r.reused }
    } catch (err) {
      report.login[identity] = { ok: false, error: String(err?.message ?? err).slice(0, 200) }
      report.failures.push({ where: `login ${identity}`, error: String(err?.message ?? err).slice(0, 200) })
      save()
      continue
    }
    save()
    for (const mode of modes) {
      const { context, page, consoleErrors } = await newIdentityPage(browser, stateFile, mode)
      for (const s of surfaces) {
        consoleErrors.length = 0
        const png = path.join(evidenceDir, `${identity}-m${mode}-${s.slug}.png`)
        const entry = { mode, state: null, png: null, console_errors: null, console_samples: [], measure: null }
        try {
          entry.state = await openSurface(page, tab, s.slug)
          await shoot(page, png)
          entry.png = png
          entry.console_errors = consoleErrors.length
          entry.console_samples = consoleErrors.slice(0, 3)
          entry.measure = await measure(page, s.slug)
          log(`${identity} m${mode} ${s.slug}: ${entry.state} · rows=${entry.measure.rows_page1}/${entry.measure.pager_total} · hints=${entry.measure.hints_visible} · charts=${entry.measure.charts} · overflow=${entry.measure.scroll_overflow_px} · console=${entry.console_errors}`)
        } catch (err) {
          entry.state = entry.state ?? 'failed'
          entry.error = String(err?.message ?? err).slice(0, 300)
          report.failures.push({ where: `${identity} m${mode} ${s.slug}`, error: entry.error })
          log(`${identity} m${mode} ${s.slug}: FAILED ${entry.error}`)
          try { await shoot(page, png.replace(/\.png$/, '-failed.png')) } catch {}
        }
        report.surfaces[s.slug].identities[identity] ??= {}
        report.surfaces[s.slug].identities[identity][`m${mode}`] = entry
        save()
      }
      await context.close()
    }
  }

  // ---- extras (CEO, mode 2) ----
  const ceoState = path.join(authDir, `${tab}-CEO.json`)
  if (extras.length && fs.existsSync(ceoState)) {
    const { context, page, consoleErrors } = await newIdentityPage(browser, ceoState, 2)
    const shotOf = (name) => path.join(evidenceDir, `CEO-m2-${name}.png`)

    if (extras.includes('drill')) {
      const drillSurface = surfaces.find((s) => s.drill)
      const ex = { surface: drillSurface?.slug ?? null, levels: [], note: null }
      report.extras.drill = ex
      if (drillSurface) {
        try {
          const state = await openSurface(page, tab, drillSurface.slug)
          const root = await measure(page, drillSurface.slug)
          ex.levels.push({ level: 0, state, url: page.url(), crumbs: root.crumbs, export_file: root.export_file, tiles: root.tiles, rows: root.rows_page1 })
          // level 1: מ3 = first drillable row (📐13); מ9 = first tile door (ruling 33). Both exist in the E2E spec.
          const door = drillSurface.slug === 'aging'
            ? page.locator('[data-testid^="report-tile-link-"]').first()
            : page.getByTestId('report-row-drillable').first()
          await clickCentered(door)
          await page.waitForURL(/drill=/, { timeout: 20_000 })
          await page.waitForLoadState('networkidle')
          await sleep(1500)
          let m1 = await measure(page, drillSurface.slug)
          await shoot(page, shotOf(`${drillSurface.slug}-drill1`))
          ex.levels.push({ level: 1, url: page.url(), crumbs: m1.crumbs, export_file: m1.export_file, tiles: m1.tiles, rows: m1.rows_page1, png: shotOf(`${drillSurface.slug}-drill1`), console_errors: consoleErrors.length })
          // level 2: first drillable row at level 1, if the payload offers one.
          const rows1 = page.getByTestId('report-row-drillable')
          if ((await rows1.count()) > 0) {
            const urlBefore = page.url()
            await clickCentered(rows1.first())
            await Promise.race([page.waitForURL((u) => u.toString() !== urlBefore, { timeout: 20_000 }), sleep(20_000)])
            await page.waitForLoadState('networkidle')
            await sleep(1500)
            const m2 = await measure(page, drillSurface.slug)
            await shoot(page, shotOf(`${drillSurface.slug}-drill2`))
            ex.levels.push({ level: 2, url: page.url(), navigated_away: !page.url().includes('/reports'), crumbs: m2.crumbs, export_file: m2.export_file, tiles: m2.tiles, rows: m2.rows_page1, png: shotOf(`${drillSurface.slug}-drill2`), console_errors: consoleErrors.length })
          } else {
            ex.note = 'no drillable row at level 1 — level 2 not reachable from this payload'
          }
        } catch (err) {
          ex.error = String(err?.message ?? err).slice(0, 300)
          report.failures.push({ where: 'extra drill', error: ex.error })
        }
        save()
      }
    }

    if (extras.includes('export')) {
      const s = surfaces[0]
      const ex = { surface: s.slug }
      report.extras.export = ex
      try {
        await openSurface(page, tab, s.slug)
        const m = await measure(page, s.slug)
        ex.export_file = m.export_file
        ex.export_columns = m.export_columns
        ex.export_disabled = m.export_disabled
        // "open" = hover the export block so the title/caption is what the user sees; the two caption
        // lines (file · columns) are always rendered (ExportBar.jsx:52-58) — screenshot the block.
        const block = page.getByTestId('reports-export')
        await block.evaluate((el) => el.scrollIntoView({ block: 'center' }))
        await block.hover()
        await sleep(500)
        await shoot(page, shotOf(`${s.slug}-export-caption`))
        ex.png = shotOf(`${s.slug}-export-caption`)
        ex.block_png = shotOf(`${s.slug}-export-caption-block`)
        await block.screenshot({ path: ex.block_png })
      } catch (err) {
        ex.error = String(err?.message ?? err).slice(0, 300)
        report.failures.push({ where: 'extra export', error: ex.error })
      }
      save()
    }

    if (extras.includes('error')) {
      const s = surfaces[0]
      const ex = { surface: s.slug, rpc: s.rpc }
      report.extras.error = ex
      try {
        const pattern = `**/rest/v1/rpc/${s.rpc}`
        await page.route(pattern, (route) => route.abort())
        consoleErrors.length = 0
        const state = await openSurface(page, tab, s.slug)
        ex.state_with_abort = state
        ex.envelope_text = (await page.getByTestId(`report-${s.slug}-error`).textContent().catch(() => null))?.replace(/\s+/g, ' ').trim() ?? null
        ex.says_no_data = (await page.getByTestId('reports-page').textContent()).includes('אין נתונים עדיין')
        await shoot(page, shotOf(`${s.slug}-error`))
        ex.png = shotOf(`${s.slug}-error`)
        await page.unroute(pattern)
        await page.getByRole('button', { name: 'נסי שוב' }).click()
        await page.getByTestId(`report-${s.slug}`).waitFor({ state: 'visible', timeout: 30_000 })
        await page.waitForLoadState('networkidle')
        await sleep(1500)
        ex.state_after_retry = 'rendered'
        await shoot(page, shotOf(`${s.slug}-error-recovered`))
        ex.png_recovered = shotOf(`${s.slug}-error-recovered`)
      } catch (err) {
        ex.error = String(err?.message ?? err).slice(0, 300)
        report.failures.push({ where: 'extra error', error: ex.error })
      }
      save()
    }

    if (extras.includes('empty')) {
      // The empty-after-filter envelope (📐10 state 2): customers · drifting with a customer that
      // leaves the table empty while the surface is still drawn — chosen at runtime (e2e/reports.spec.js:457).
      const ex = { surface: 'drifting' }
      report.extras.empty = ex
      try {
        await openSurface(page, 'customers', 'drifting')
        const values = await page.locator('[data-testid="reports-customer-filter"] option').evaluateAll((els) => els.slice(1).map((el) => el.value))
        ex.customer_options = values.length
        let found = null
        for (const value of values.slice(0, 12)) {
          const state = await openSurface(page, 'customers', 'drifting', { extraQuery: `&customer=${value}` })
          const m = await measure(page, 'drifting')
          if (state === 'empty' || (m.export_file !== null && m.rows_page1 === 0)) {
            found = { value, state, export_file: m.export_file, export_disabled: m.export_disabled, rows: m.rows_page1 }
            break
          }
        }
        ex.found = found
        if (found) {
          await shoot(page, shotOf('drifting-empty-filter'))
          ex.png = shotOf('drifting-empty-filter')
        } else {
          ex.note = 'no customer among the first 12 empties the table'
        }
      } catch (err) {
        ex.error = String(err?.message ?? err).slice(0, 300)
        report.failures.push({ where: 'extra empty', error: ex.error })
      }
      save()
    }
    await context.close()
  }
} finally {
  report.finished_at = new Date().toISOString()
  save()
  await browser.close()
}
log(`done · failures=${report.failures.length} · report=${reportFile}`)
