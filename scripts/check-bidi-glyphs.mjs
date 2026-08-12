// Blocking gate check (`npm run gate` → `check:bidi`) for the recurring bug class
// documented in src/CLAUDE.md's "כיווניות — שני רכיבים חובה" section and
// src/modules/04_hostesses/CLAUDE.md (10 documented occurrences as of 10/08/2026):
// a digit glued directly to one of ₪/★/× with no bidi isolation, sitting inside
// Hebrew JSX text.
//
// This is a heuristic TEXT scanner, not a proof. It excludes `//`-comment lines (the
// dominant source of noise — this project's own comments constantly use these glyphs
// in prose) and any line already carrying a known-safe marker. False positives are
// still possible; a genuine new one is fixed the way the 10 documented occurrences
// were (isolate with `dir="ltr"` + `unicodeBidi:'isolate'`, or via `<Money>`/
// `<RatingStars>`), not suppressed. Known blind spot, stated rather than hidden: it
// does NOT catch the "two adjacent numbers reorder" bug shape (the 62%/38% incident)
// — that needs a live Range measurement in a real browser, not static text, and isn't
// attempted here.
//
// Usage: node scripts/check-bidi-glyphs.mjs (exits 1 with findings, 0 clean)

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'src')
const RISK_GLYPHS = ['₪', '★', '×']
const SAFE_MARKERS = [
  'dir="ltr"',
  'unicodeBidi',
  'unicode-bidi',
  '<Money',
  '<RatingStars',
  '<LtrFieldGroup',
]

// digit directly touching a risk glyph, either order, no space between them
const GLUED_RE = new RegExp(`(\\d[${RISK_GLYPHS.join('')}])|([${RISK_GLYPHS.join('')}]\\d)`)

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, files)
    else if (entry.endsWith('.jsx') || entry.endsWith('.js')) files.push(full)
  }
  return files
}

let hits = 0
for (const file of walk(ROOT)) {
  if (file.endsWith('.test.js') || file.endsWith('.test.jsx')) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('//')) return // prose in comments isn't rendered — not the bug this hunts
    if (!GLUED_RE.test(line)) return
    if (SAFE_MARKERS.some((m) => line.includes(m))) return
    hits++
    console.log(`${path.relative(process.cwd(), file)}:${i + 1}  ${trimmed}`)
  })
}

if (hits > 0) {
  console.log(
    `\n❌ ${hits} candidate line(s) — a digit sits glued to ₪/★/× with no bidi isolation.\n` +
      `   Fix with dir="ltr"+unicodeBidi:'isolate' (or route through <Money>/<RatingStars>),\n` +
      `   the same way the 10 documented occurrences were fixed. Not a false-positive waiver list —\n` +
      `   if this really is safe, the fix is to make the isolation visible in the code, not to silence the check.`,
  )
  process.exit(1)
}
console.log('✓ אין ממצאי-כיווניות (מספר צמוד ל-₪/★/× בלי בידוד).')
