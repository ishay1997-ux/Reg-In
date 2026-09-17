// Blocking gate check (`npm run gate` → `check:type-scale`) for the bug class measured
// on 17/09/2026: the project had no font-size scale at all, so every mockup invented its
// own pixel values and they were copied by hand into JSX. 422 arbitrary sizes across 52
// files, 218 of them below 12px. The scale now lives in src/index.css `@theme inline`
// (--text-xs..--text-2xl); this check is what stops the next module from inventing its own.
//
// 🔑 Why a BASELINE and not a flat ban: a parallel session is writing new code right now on
// a branch that does not carry this gate. A flat ban would paint their merge red on debt they
// never created, and the first gate anyone asks to switch off is the one that was born
// blocking. So: every existing occurrence is grandfathered per file, counts may only go DOWN,
// and a NEW arbitrary size is what fails. As phase A lands, the baseline is rewritten lower
// (`--write`) until it reaches zero and the grandfathering disappears on its own.
//
// ✏️ 17/09/2026 — the blind spot this comment used to merely declare turned out to be real, so
// the check was widened instead of left as a caveat. It had said "0 inline fontSize outside
// chart internals"; the measurement was 8, and two of them were `ChartCard.jsx` axis ticks that
// the plan's section 2 names by line number. Recharts draws SVG and does not inherit a Tailwind
// class, so the size is passed as a number — which is exactly why a class-only scan walked past
// it. The scan now counts `fontSize: N` / `fontSize={N}` as well.
//
// Known blind spot that REMAINS, stated rather than hidden: a size injected through a variable
// or a `cn()` branch is still not caught. This is a text scan, not a proof.
//
// 📄 quotePdf.jsx keeps five of them on purpose and they are grandfathered in the baseline
// (it has six inline sizes; one of them is 20, which is on the scale, so it is not counted):
// it renders through @react-pdf/renderer, where the unit is a PDF point on a print page, not a
// CSS pixel in a browser. The screen scale does not govern that medium. Do not "fix" them.
//
// Usage: node scripts/check-type-scale.mjs          (exits 1 with findings, 0 clean)
//        node scripts/check-type-scale.mjs --write  (re-records the baseline from reality)

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import path from 'node:path'

const SRC = path.resolve(process.cwd(), 'src')
const BASELINE_FILE = path.resolve(process.cwd(), 'scripts/type-scale-baseline.json')

// Arbitrary Tailwind font-size utilities: text-[13px] · text-[0.8rem] · text-[11.5px].
// Deliberately NOT matching text-[#hex] or text-[var(--x)] — those are colours, not sizes.
const ARBITRARY_SIZE = /text-\[[0-9]+(?:\.[0-9]+)?(?:px|rem|em|pt)\]/g

// Inline sizes, the half a class scan cannot see: `fontSize: 11` and `fontSize={11}`.
// Only an OFF-SCALE value counts — a number is the only way to size SVG text, so flagging
// `fontSize: 13` would punish the correct form and teach people to silence the gate.
const INLINE_SIZE = /fontSize\s*[:=]\s*\{?\s*([0-9]+(?:\.[0-9]+)?)/g
const ON_SCALE = new Set([13, 14, 16, 20, 24])

const collectFiles = (start) => {
  const found = []
  const pending = [start]
  while (pending.length > 0) {
    const dir = pending.pop()
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.')) continue
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) pending.push(full)
      else if (/\.(jsx?|css)$/.test(entry)) found.push(full)
    }
  }
  return found.sort()
}

const relative = (file) => path.relative(process.cwd(), file).split(path.sep).join('/')

const counts = {}
for (const file of collectFiles(SRC)) {
  const text = readFileSync(file, 'utf8')
  const cls = (text.match(ARBITRARY_SIZE) ?? []).length
  const inline = [...text.matchAll(INLINE_SIZE)].filter((m) => !ON_SCALE.has(Number(m[1]))).length
  if (cls + inline > 0) counts[relative(file)] = { cls, inline }
}
const sumOf = (map) => Object.values(map).reduce((sum, e) => sum + e.cls + e.inline, 0)
const total = sumOf(counts)

if (process.argv.includes('--write')) {
  writeFileSync(BASELINE_FILE, `${JSON.stringify(counts, null, 2)}\n`, 'utf8')
  console.log(`✓ קו-בסיס נכתב מחדש: ${total} מופעים ב-${Object.keys(counts).length} קבצים.`)
  process.exit(0)
}

let baseline = {}
try {
  baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
} catch {
  console.log(
    `❌ קו-הבסיס חסר או פגום: ${relative(BASELINE_FILE)}\n` +
      `   הרץ  node scripts/check-type-scale.mjs --write  כדי לרשום את המצב הנוכחי.`,
  )
  process.exit(1)
}

const regressions = []
for (const [file, entry] of Object.entries(counts)) {
  const allowed = baseline[file] ?? { cls: 0, inline: 0 }
  for (const kind of ['cls', 'inline']) {
    const now = entry[kind]
    const was = allowed[kind] ?? 0
    if (now > was) regressions.push({ file, kind, now, was })
  }
}

if (regressions.length > 0) {
  for (const { file, kind, now, was } of regressions) {
    const label = kind === 'cls' ? 'text-[Npx]' : 'fontSize'
    console.log(`${file}  ${label}: ${was} ⇒ ${now}  (+${now - was})`)
  }
  console.log(
    `\n❌ ${regressions.length} קובץ/ים עם גודל-כתב ידני חדש.\n` +
      `   השתמש בסקאלה: text-xs (13px) · text-sm (14px) · text-base (16px) · text-2xl (24px),\n` +
      `   המוגדרת ב-src/index.css תחת @theme inline. אין tailwind.config.js בריפו, במכוון.\n` +
      `   🚫 ואל תרשום את החריגה לקו-הבסיס — הוא נועד לחוב קיים שמצטמצם, לא לחוב חדש.`,
  )
  process.exit(1)
}

const baselineTotal = sumOf(baseline)
const left = baselineTotal === 0 ? '' : `  ·  נותרו ${total} מתוך ${baselineTotal} בקו-הבסיס`
console.log(`✓ אין גודל-כתב ידני חדש.${left}`)
