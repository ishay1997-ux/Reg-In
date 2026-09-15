#!/usr/bin/env node
/**
 * check-declared-counts — a number a document DECLARES must equal the number
 * its source of truth actually CONTAINS.
 *
 * WHY THIS EXISTS (15/09/2026). Every drift found in the module-11 readiness
 * sweep was a stale NUMBER, not stale prose: "73+ commits ahead" (97), "seven
 * open items" (six), "three things this audit must check" followed by four,
 * "five awaiting a ruling" (one), "8 chart cards" counted over pages that are
 * not built. They are invisible on re-reading, because a number looks equally
 * true at any value -- there is nothing in "seven" that says it used to be
 * eight.
 *
 * The session that wrote this file produced one of these defects itself, an
 * hour after writing a report about them: it marked two surfaces deferred in a
 * table and left the summary line underneath saying the old totals. That is the
 * whole argument for a machine check rather than more care.
 *
 * SCOPE, stated honestly: this catches declared COUNTS whose source can be
 * counted mechanically. It does not check prose, and it is not a claim that the
 * documents agree on meaning. Adding a rule here is cheap; each one is a pair of
 * (what the document says, how to count the truth).
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : null)

/** Rows of the module-11 surface table, one per surface (מ1…מ26). */
function surfaceRows(text) {
  return text.split('\n').filter((l) => /^\| מ\d+ \|/.test(l))
}
const countMarker = (rows, marker) => rows.filter((l) => l.includes(marker)).length

const RULES = []

const SCREENS = 'docs/specs/module_11_reports/screens-approved.md'
const screens = read(SCREENS)
if (screens) {
  const rows = surfaceRows(screens)
  const summary = screens.split('\n').find((l) => l.startsWith('**סיכום-מצב**')) ?? ''
  const declared = (re) => {
    const m = summary.match(re)
    return m ? Number(m[1]) : null
  }
  RULES.push(
    {
      file: SCREENS,
      what: 'משטחים מאושרים (✅)',
      declared: declared(/\*\*(\d+) ✅\*\*/),
      actual: countMarker(rows, '✅'),
      how: 'שורות בטבלת-המשטחים הנושאות ✅',
    },
    {
      file: SCREENS,
      what: 'משטחים נדחים (⏸️)',
      declared: declared(/\*\*(\d+) ⏸️/),
      actual: countMarker(rows, '⏸️'),
      how: 'שורות בטבלת-המשטחים הנושאות ⏸️',
    },
    {
      file: SCREENS,
      what: 'משטחים שטרם צוירו (⬜)',
      declared: declared(/\*\*(\d+) ⬜\*\*/),
      actual: countMarker(rows, '⬜'),
      how: 'שורות בטבלת-המשטחים הנושאות ⬜',
    },
  )
}

/** The guide states how many items are deliberately open; spec.md §🎯 is the list. */
const GUIDE = 'docs/guides/modules/module_11_reports.md'
const SPEC = 'docs/specs/module_11_reports/spec.md'
const guide = read(GUIDE)
const spec = read(SPEC)
if (guide && spec) {
  const WORDS = { שישה: 6, שבעה: 7, שמונה: 8, חמישה: 5, ארבעה: 4, תשעה: 9, עשרה: 10 }
  const m = guide.match(/\*\*(\S+) פריטים, וכולם מפורטים ב-`spec\.md`/)
  const section = spec.slice(spec.indexOf('# 🎯'), spec.indexOf('# 🚫'))
  const open = section
    .split('\n')
    .filter((l) => /^\| (?:\*\*|`)/.test(l) && !l.startsWith('| ~~')).length
  if (m) {
    RULES.push({
      file: GUIDE,
      what: 'פריטים פתוחים-בכוונה',
      declared: WORDS[m[1]] ?? null,
      actual: open,
      how: 'שורות לא-מחוקות בטבלת §🎯 של spec.md',
    })
  }
}

/** spec.md §1.4 declares how many tile labels its own table holds. */
if (spec) {
  const m = spec.match(/\*\*‏?(\d+) תוויות-אריח/)
  const table = spec.split('\n').filter((l) => /^\| \*\*(הנהלה|כספים|דיילות|לקוחות)\*\* \|/.test(l))
  const labels = table.reduce((n, row) => n + (row.split('|')[3] ?? '').split('·').length, 0)
  if (m && table.length === 4) {
    RULES.push({
      file: SPEC,
      what: 'תוויות-אריח ב-§1.4',
      declared: Number(m[1]),
      actual: labels,
      how: 'ערכים מופרדי-· בעמודת-התוויות של ארבע שורות הלשוניות',
    })
  }
}

/** The blueprint and the guide both state how many chart behaviours are unverified. */
const CONTRACT = 'docs/specs/module_11_reports/design-contract.md'
const contract = read(CONTRACT)
const micro = read('docs/micro_guides/module-11.md')
if (contract && micro) {
  // the claim counts ITEMS, so the check counts lines carrying the marker, not
  // occurrences of it: one line once carried it twice, and an occurrence-count
  // silently measured something the sentence never said.
  const actual = contract.split('\n').filter((l) => l.includes('לא אומת')).length
  const WORDS = { ten: 10, eleven: 11, twelve: 12, nine: 9 }
  const m = micro.match(/\*\*(\w+) of its items carry `לא אומת`\*\*/)
  if (m && WORDS[m[1]] !== undefined) {
    RULES.push({
      file: 'docs/micro_guides/module-11.md',
      what: 'התנהגויות-גרף שלא אומתו',
      declared: WORDS[m[1]],
      actual,
      how: `מופעי "לא אומת" ב-${CONTRACT}`,
    })
  }
}

const problems = RULES.filter((r) => r.declared !== null && r.declared !== r.actual)

if (problems.length > 0) {
  console.error(`check:declared-counts ❌ ${problems.length} מספר(ים) מוצהרים אינם תואמים למקור:\n`)
  for (const p of problems) {
    console.error(`   ${p.file}`)
    console.error(`     ${p.what}: מוצהר ${p.declared} · בפועל ${p.actual}  (${p.how})`)
  }
  console.error(
    `\n   מספר שנרקב נראה נכון בכל ערך — אין ב-"שבעה" שום דבר שמסגיר שפעם היה "שמונה".\n` +
      `   תקן את המספר המוצהר, או את המקור. אל תמחק את הכלל.`,
  )
  process.exit(1)
}

const checked = RULES.filter((r) => r.declared !== null).length
console.log(
  `check:declared-counts ✅ ${checked} מספרים מוצהרים נבדקו מול המקור, כולם תואמים` +
    (checked < RULES.length ? ` (${RULES.length - checked} לא נמצאו בקובץ ודולגו)` : ''),
)
