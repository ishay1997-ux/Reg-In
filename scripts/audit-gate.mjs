#!/usr/bin/env node
/**
 * audit-gate — שער חולשות-האבטחה בחבילות, עם רשימת-פטורים מפורשת.
 *
 * למה זה קיים (29/07/2026): `npm audit --audit-level=high` הוא בינארי — או שהוא
 * חוסם על **כל** חולשה חמורה, או שמכבים אותו לגמרי. אין דרך לומר "את זו בדקנו,
 * היא לא נוגעת לנו, וזו ההנמקה". התוצאה בפועל הייתה `continue-on-error: true`
 * ב-CI — כלומר שער שלא חוסם כלום. הסקריפט הזה מחזיר לו שיניים: הוא חוסם על כל
 * חולשה חמורה **שאינה** ברשימה למטה, וכל פטור נושא סיבה, תאריך וטריגר-חידוש.
 *
 * ⚖️ עקרון-הגריעה (F1, הכרעת-ישי 29/07): זו **החלפה** של `npm audit --audit-level=high`
 * ב-package.json, לא תוספת. אין כאן נוהל חדש לזכור — הפטור הוא דאטה בקובץ אחד.
 *
 * שימוש:  npm run audit        (יוצא 1 אם נשארה חולשה חמורה לא-מפוטרת)
 *
 * ⚠️ הפטורים מודפסים בכל ריצה במכוון. פטור שקוף = פטור שנשכח.
 */

import { spawnSync } from 'node:child_process'

// רמות שחוסמות. moderate/low מדווחות אך אינן עוצרות — זהה להתנהגות `--audit-level=high`.
const BLOCKING = new Set(['high', 'critical'])

/**
 * פטורים — סיכון שנבדק והתקבל במודע. התקדים: `docs/micro_guides/module-1.md §4`
 * ("Advisor acceptances"). כל רשומה חייבת reason + reviewTrigger, אחרת אין לה ערך.
 */
const WAIVERS = [
  {
    ghsa: 'GHSA-qwww-vcr4-c8h2',
    packages: ['react-router', 'react-router-dom'],
    date: '29/07/2026',
    reason:
      'ההודעה הרשמית אומרת מפורשות "This only affects your application if you are using ' +
      'the unstable RSC APIs". REG-IN היא SPA צד-לקוח: BrowserRouter ב-src/App.jsx, בלי ' +
      'קובץ שרת, בלי react-router.config, ואפס אזכורי RSC/unstable_ בכל src/. ' +
      'הגרסה המתוקנת היא 8.3.0 (קפיצת מייג׳ור), ומה ש-npm מציע הוא דווקא ירידה ל-7.11.0 — ' +
      'שינוי שובר בשביל חולשה שאינה נוגעת לנו.',
    reviewTrigger: 'מעבר ל-react-router 8.x, או הגשת הפרויקט 19/09/2026 — המוקדם מביניהם.',
  },
]

// npm audit יוצא בקוד שאינו 0 כשנמצאו חולשות — ולכן קוראים את stdout בלי קשר לקוד היציאה.
// הפקודה מועברת כמחרוזת אחת ולא כ-(קובץ, מערך-ארגומנטים) — שילוב של מערך עם shell:true
// מפעיל את אזהרת-הנטישה DEP0190 ומרעיש את פלט-השער. ‏shell:true עצמו נדרש ב-Windows,
// שם `npm` הוא npm.cmd ו-Node חוסם הרצת קובצי .cmd בלי shell. הפקודה קבועה — אין קלט חיצוני.
const res = spawnSync('npm audit --json', {
  encoding: 'utf8',
  shell: true,
  maxBuffer: 32 * 1024 * 1024,
})

let report
try {
  report = JSON.parse(res.stdout)
} catch {
  console.error('✖ audit-gate: לא ניתן לפענח את פלט `npm audit --json`.')
  console.error(res.stderr || res.stdout)
  process.exit(1)
}

// כל מזהי ה-GHSA שדרכם החבילה נפגעת. via יכול להכיל מחרוזות (שם חבילה אחרת בשרשרת)
// או אובייקטי-הודעה; רק לאחרונים יש url עם המזהה.
const advisoryIds = (vuln) =>
  (vuln.via ?? [])
    .filter((v) => typeof v === 'object' && v.url)
    .map((v) => v.url.split('/').pop())
    .filter(Boolean)

const waiverFor = (name, vuln) => {
  const ids = advisoryIds(vuln)
  return WAIVERS.find(
    (w) =>
      ids.includes(w.ghsa) ||
      // חבילה שנפגעת רק דרך תלות (via = מחרוזת) לא נושאת url משלה; מזהים אותה לפי שם.
      (ids.length === 0 && w.packages.includes(name)),
  )
}

const blocking = []
const waived = []

for (const [name, vuln] of Object.entries(report.vulnerabilities ?? {})) {
  if (!BLOCKING.has(vuln.severity)) continue
  const waiver = waiverFor(name, vuln)
  if (waiver) waived.push({ name, vuln, waiver })
  else blocking.push({ name, vuln })
}

for (const { name, waiver } of waived) {
  console.log(`⏸️  ${name} — סיכון מקובל ומתועד (${waiver.ghsa}, ${waiver.date})`)
  console.log(`    ${waiver.reason}`)
  console.log(`    🔁 חידוש: ${waiver.reviewTrigger}`)
}

// פטור שרשום ואינו מתאים לאף חולשה = שריד. מסירים אותו, אחרת הרשימה מתנפחת בשקט.
for (const w of WAIVERS) {
  if (!waived.some((x) => x.waiver === w)) {
    console.log(`🧹 הפטור ${w.ghsa} אינו תואם עוד לאף חולשה — אפשר להסיר אותו מ-audit-gate.mjs`)
  }
}

if (blocking.length > 0) {
  console.error(`\n✖ נמצאו ${blocking.length} חולשות חמורות ללא פטור:`)
  for (const { name, vuln } of blocking) {
    const titles = (vuln.via ?? [])
      .filter((v) => typeof v === 'object')
      .map((v) => `${v.title} (${v.url})`)
    console.error(`  • ${name} [${vuln.severity}] ${titles[0] ?? ''}`)
  }
  console.error('\nלתקן, לשדרג, או — אם החולשה באמת אינה נוגעת לאפליקציה — להוסיף פטור מנומק')
  console.error('ב-scripts/audit-gate.mjs, ולרשום אותו גם ב-STATUS.md ובמדריך-המיקרו.')
  process.exit(1)
}

const total = Object.keys(report.vulnerabilities ?? {}).length
console.log(`\n✓ אין חולשות חמורות ללא פטור. (${total} ממצאים בסך הכול, ${waived.length} מפוטרים)`)
