// copy-dump.mjs — visible-text dumps + screenshots for the two copy evaluators (brief P3-F),
// one onboarding mode per run, as CEO (plus the STAFF masked screen). Read-only on the DB:
// the mode is forced by the notification_preferences GET intercept (evidence-common.mjs).
// Usage (repo root): node <scratchpad>/copy-dump.mjs --mode 0|2 --out <scratchpad>/results
// Writes <out>/copy-<mode>/<slug>.txt (+ .png), drill/export/error/masked dumps, and index.json.
import fs from 'fs'
import path from 'path'
import {
  BASE_URL,
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
const mode = Number(args.mode)
if (![0, 2].includes(mode)) throw new Error('--mode must be 0 or 2')
const out = path.resolve(args.out)
const dir = path.join(out, `copy-${mode}`)
const authDir = path.join(out, 'auth')
fs.mkdirSync(dir, { recursive: true })
loadEnvLocal()

const index = { mode, base_url: BASE_URL, started_at: new Date().toISOString(), files: [], failures: [] }
const save = () => writeJson(path.join(dir, 'index.json'), index)
const log = (m) => console.log(`[copy-${mode}] ${m}`)

async function dump(page, name, meta = {}) {
  const text = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="reports-page"]') ?? document.body
    return el.innerText
  })
  const header = [`# ${name}`, `# url: ${page.url()}`, ...Object.entries(meta).map(([k, v]) => `# ${k}: ${v}`), ''].join('\n')
  const txt = path.join(dir, `${name}.txt`)
  fs.writeFileSync(txt, header + text + '\n', 'utf-8')
  const png = path.join(dir, `${name}.png`)
  await shoot(page, png)
  index.files.push({ name, txt, png, ...meta })
  save()
  log(`${name}: ${text.length} chars`)
}

const browser = await launchBrowser()
try {
  const ceo = path.join(authDir, 'copy-CEO.json')
  await ensureStorageState(browser, 'CEO', ceo, log)
  const { context, page } = await newIdentityPage(browser, ceo, mode)
  for (const [tab, surfaces] of Object.entries(TABS)) {
    for (const s of surfaces) {
      try {
        const state = await openSurface(page, tab, s.slug)
        const m = await measure(page, s.slug)
        await dump(page, s.slug, { tab, id: s.id, state, h1: m.h1, hints_visible: m.hints_visible })
      } catch (err) {
        index.failures.push({ where: s.slug, error: String(err?.message ?? err).slice(0, 300) })
        save()
      }
    }
  }
  // drill level 1 on מ3 (row) and מ9 (tile door)
  for (const [tab, slug, kind] of [['exec', 'trends', 'row'], ['finance', 'aging', 'tile']]) {
    try {
      await openSurface(page, tab, slug)
      const door = kind === 'tile' ? page.locator('[data-testid^="report-tile-link-"]').first() : page.getByTestId('report-row-drillable').first()
      await clickCentered(door)
      await page.waitForURL(/drill=/, { timeout: 20_000 })
      await page.waitForLoadState('networkidle')
      await sleep(1500)
      const m = await measure(page, slug)
      await dump(page, `${slug}-drill1`, { tab, crumbs: m.crumbs, export_file: m.export_file })
    } catch (err) {
      index.failures.push({ where: `${slug}-drill1`, error: String(err?.message ?? err).slice(0, 300) })
      save()
    }
  }
  // export caption block (exec-overview)
  try {
    await openSurface(page, 'exec', 'exec-overview')
    const block = page.getByTestId('reports-export')
    const text = await block.innerText()
    fs.writeFileSync(path.join(dir, 'export-caption.txt'), `# export caption block on exec-overview\n${text}\n`, 'utf-8')
    await block.screenshot({ path: path.join(dir, 'export-caption.png') })
    index.files.push({ name: 'export-caption', txt: path.join(dir, 'export-caption.txt'), png: path.join(dir, 'export-caption.png') })
    save()
  } catch (err) {
    index.failures.push({ where: 'export-caption', error: String(err?.message ?? err).slice(0, 300) })
    save()
  }
  // one error state (abort the מ14 RPC), then recover
  try {
    const pattern = '**/rest/v1/rpc/report_m14_hostess_overview'
    await page.route(pattern, (route) => route.abort())
    const state = await openSurface(page, 'hostesses', 'hostess-overview')
    await dump(page, 'hostess-overview-error', { state })
    await page.unroute(pattern)
  } catch (err) {
    index.failures.push({ where: 'error-state', error: String(err?.message ?? err).slice(0, 300) })
    save()
  }
  await context.close()

  // masked screen as STAFF
  try {
    const staff = path.join(authDir, 'copy-STAFF.json')
    await ensureStorageState(browser, 'STAFF', staff, log)
    const s = await newIdentityPage(browser, staff, mode)
    const state = await openSurface(s.page, 'exec', 'exec-overview')
    await dump(s.page, 'masked-STAFF', { state })
    await s.context.close()
  } catch (err) {
    index.failures.push({ where: 'masked-STAFF', error: String(err?.message ?? err).slice(0, 300) })
    save()
  }
} finally {
  index.finished_at = new Date().toISOString()
  save()
  await browser.close()
}
log(`done · files=${index.files.length} · failures=${index.failures.length}`)
