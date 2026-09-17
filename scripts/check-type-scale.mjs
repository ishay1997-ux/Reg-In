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
// Known blind spot, stated rather than hidden: this is a text scan of class strings. A size
// injected through a variable, a `cn()` branch, or an inline `style={{fontSize}}` is NOT
// caught. Those are rarer here (measured: 0 inline fontSize in src/ outside chart internals),
// but the check does not prove their absence.
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
  const hits = readFileSync(file, 'utf8').match(ARBITRARY_SIZE)
  if (hits && hits.length > 0) counts[relative(file)] = hits.length
}
const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

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
for (const [file, count] of Object.entries(counts)) {
  const allowed = baseline[file] ?? 0
  if (count > allowed) regressions.push({ file, count, allowed })
}

if (regressions.length > 0) {
  for (const { file, count, allowed } of regressions) {
    console.log(`${file}  ${allowed} ⇒ ${count}  (+${count - allowed})`)
  }
  console.log(
    `\n❌ ${regressions.length} קובץ/ים עם גודל-כתב ידני חדש.\n` +
      `   השתמש בסקאלה: text-xs (13px) · text-sm (14px) · text-base (16px) · text-2xl (24px),\n` +
      `   המוגדרת ב-src/index.css תחת @theme inline. אין tailwind.config.js בריפו, במכוון.\n` +
      `   🚫 ואל תרשום את החריגה לקו-הבסיס — הוא נועד לחוב קיים שמצטמצם, לא לחוב חדש.`,
  )
  process.exit(1)
}

const baselineTotal = Object.values(baseline).reduce((sum, n) => sum + n, 0)
const left = baselineTotal === 0 ? '' : `  ·  נותרו ${total} מתוך ${baselineTotal} בקו-הבסיס`
console.log(`✓ אין גודל-כתב ידני חדש.${left}`)
