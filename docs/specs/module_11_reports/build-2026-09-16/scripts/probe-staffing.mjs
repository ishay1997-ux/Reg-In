// probe-staffing.mjs — is the "empty charts on מ6" blocker real, or a full-page-capture artifact?
// DOM-level count of recharts marks + element screenshots at a FIXED 1280×800 viewport (no fullPage),
// at onboarding modes 2 and 0, CEO. Usage (repo root): node <scratchpad>/probe-staffing.mjs --out <dir> --auth <ceo-state-file>
import fs from 'fs'
import path from 'path'
import { ensureStorageState, launchBrowser, loadEnvLocal, newIdentityPage, openSurface, sleep, writeJson } from './evidence-common.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1]] : [])).filter((x) => x.length))
const out = path.resolve(args.out)
fs.mkdirSync(out, { recursive: true })
loadEnvLocal()
const browser = await launchBrowser()
const result = { runs: [] }
try {
  const auth = args.auth ?? path.join(out, 'CEO.json')
  await ensureStorageState(browser, 'CEO', auth)
  for (const mode of [2, 0]) {
    for (const surface of [['exec', 'staffing'], ['exec', 'exec-overview']]) {
      const [tab, slug] = surface
      const { context, page, consoleErrors } = await newIdentityPage(browser, auth, mode)
      const state = await openSurface(page, tab, slug)
      await sleep(3000)
      const cards = page.locator('[data-testid^="chart-card-"]')
      const n = await cards.count()
      const charts = []
      for (let i = 0; i < n; i++) {
        const card = cards.nth(i)
        await card.evaluate((el) => el.scrollIntoView({ block: 'center' }))
        await sleep(2500) // let the animation (≈1.5 s) finish after the card entered the viewport
        const counts = await card.evaluate((el) => ({
          type: el.getAttribute('data-testid'),
          title: el.querySelector('h2,h3,[data-testid="chart-title"]')?.textContent?.trim() ?? null,
          scatter_symbols: el.querySelectorAll('.recharts-scatter-symbol').length,
          bar_rects: el.querySelectorAll('.recharts-bar-rectangle').length,
          line_dots: el.querySelectorAll('.recharts-line-dot, .recharts-dot').length,
          paths_total: el.querySelectorAll('path').length,
          svg_w: el.querySelector('svg.recharts-surface')?.getAttribute('width') ?? null,
          svg_h: el.querySelector('svg.recharts-surface')?.getAttribute('height') ?? null,
          sr_rows: el.querySelectorAll('[data-testid="chart-sr-table"] tbody tr').length,
          empty_note: el.querySelector('[data-testid="chart-empty"]')?.textContent?.trim() ?? null,
        }))
        const png = path.join(out, `m${mode}-${slug}-chart${i}.png`)
        await card.screenshot({ path: png })
        charts.push({ ...counts, png })
      }
      result.runs.push({ mode, slug, state, console_errors: consoleErrors.length, charts })
      writeJson(path.join(out, 'probe-staffing.json'), result)
      await context.close()
    }
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify(result, null, 1))
