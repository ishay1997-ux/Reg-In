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
// 🕓 **תאריך-הרענון עודכן 28/08/2026.** עמד כאן `19/09/2026` — **דדליין שבוטל 12/08/2026**
// (‏`CLAUDE.md`: *"לוח-הדדליינים שונה 12/08/2026 — 19/09 מבוטל"*), ולכן השער הדפיס
// טריגר-רענון שכבר לא קיים בחמישה פטורי-אבטחה. **נתפס באודיט-ריצה בלתי-תלוי 28/08.**
// 🔑 ולמה זה לא קוסמטי: פטור-אבטחה שתוקפו נמדד מול תאריך-רפאים **לא ייבדק מחדש לעולם**.
const WAIVERS = [
  // 🧹 27/08/2026 (אודיט-סגירת-מ5): שני פטורים שהשער עצמו דיווח כלא-תואמים-עוד הוסרו —
  // GHSA-qwww-vcr4-c8h2 (react-router) ו-GHSA-2v37-7h3g-55p8 (nanoid). פטור מת מסתיר
  // הישנות עתידית של אותה חולשה; אם תחזור — תיחסם ותישקל מחדש, לא תקבל פטור-רפאים.
  // ── ארבעת הפטורים שנוספו 04/08/2026 (הכרעת-ישי) — משפחה אחת, נימוק אחד ────────────
  //
  // ⚠️ **פטור הוא החלטה לקבל סיכון, לא הכרזה ש"אין בעיה".** כל ארבע החולשות אמיתיות
  // וחמורות בהקשר שלהן; מה שנטען כאן הוא שההקשר הזה **אינו קיים אצלנו** — הקוד הפגיע
  // אינו מגיע למשתמש. אנחנו מקבלים את הסיכון כי הוא אינו יכול להגיע אליו.
  //
  // 🔬 **הבסיס נמדד, לא הוסק** (04/08/2026, אחרי `npm ci` נקי — עץ ה-node_modules היה
  // במצב לא-עקבי קודם לכן, ולכן המדידה כולה חזרה מאפס):
  // ① שרשראות-התלות (`npm ls <pkg> --all`) — כל ארבען יושבות מתחת ל-`eslint-plugin-sonarjs`,
  //    ‏`jsdom` או ה-**CLI** של `shadcn` (‏`@modelcontextprotocol/sdk` · `@dotenvx/dotenvx`).
  // ② `npm run build` ואז חיפוש טקסטואלי בחבילה עצמה
  //    (`dist/assets/index-*.js`, 2.4MB): **אפס** מופעים של `undici` · `fast-uri` ·
  //    ‏`Address4`/`Address6` · `braceExpand` · `express-rate-limit` · `dotenvx` ·
  //    ‏`modelcontextprotocol`. (המופע היחיד של "ajv" הוא רצף base64 בתוך גופן מוטמע.)
  //
  // ⚠️ **הנקודה העדינה, וכדאי לא לאבד אותה:** `shadcn` רשומה תחת `dependencies` ולא
  // ‏`devDependencies` — `src/index.css:3` עושה `@import 'shadcn/tailwind.css'`. אבל
  // **רק גיליון-הסגנון הזה מיובא**; ה-CLI שלה, ואיתו כל תת-העץ הפגיע, אינו מיובא מאף
  // קובץ ב-`src/` ולכן אינו נכנס לחבילה. זו הסיבה שמדידה ② נדרשה ולא די היה ב-①.
  //
  // ⛔ **ומה זה לא מכסה:** הקוד הפגיע כן רץ על **מכונת-הפיתוח וב-CI** (lint, בדיקות,
  // ‏`npx shadcn`). מי שירחיב את הריפו לשרת-Node אמיתי, או ייבא מ-`shadcn` מעבר ל-CSS,
  // **מבטל את הנימוק הזה** וחייב למדוד מחדש.
  {
    ghsa: 'GHSA-rgw5-rvv9-x895',
    packages: ['brace-expansion'],
    date: '04/08/2026',
    reason:
      'DoS דרך מערכי-ביניים בלתי-חסומים ב-brace-expansion. מגיעה דרך eslint-plugin-sonarjs → ' +
      'minimatch — כלומר **כלי-lint בלבד**, שרץ על הקוד שלנו ולא על קלט של משתמש. ' +
      'אומת שאינה בחבילת-הדפדפן (אפס מופעי `braceExpand` ב-dist). מקבלים את הסיכון כי ' +
      'הוא אינו יכול להגיע למשתמש; שדרוג לפני סגירת מודול הוא סיכון-בנייה תמורת אפס שיפור.',
    reviewTrigger: 'סגירת המודול הבא, או כנס-הסיום 01/10/2026 — המוקדם מביניהם.',
  },
  {
    ghsa: 'GHSA-7p8r-x3mc-p8w7',
    packages: ['fast-uri'],
    date: '04/08/2026',
    reason:
      'בלבול-מארח דרך לוכסן-הפוך בפענוח URI. מגיעה דרך ה-CLI של shadcn ' +
      '(‏@modelcontextprotocol/sdk ו-@dotenvx/dotenvx → ajv) — קוד שאינו רץ בייצור ואינו ' +
      'מפענח URI של משתמש. אומת שאינה בחבילת-הדפדפן (אפס מופעי `fast-uri` ב-dist). ' +
      'מקבלים את הסיכון כי הוא אינו יכול להגיע למשתמש.',
    reviewTrigger: 'סגירת המודול הבא, או כנס-הסיום 01/10/2026 — המוקדם מביניהם.',
  },
  {
    ghsa: 'GHSA-mwp4-54f8-5fhr',
    packages: ['ip-address'],
    date: '04/08/2026',
    reason:
      'ל-Address4 ולפותרי-DNS יש פרשנות שונה לאוקטטה עם אפס מוביל ⇒ SSRF/עקיפת גבול-אמון. ' +
      'מגיעה דרך ה-CLI של shadcn (‏@modelcontextprotocol/sdk → express-rate-limit) — ' +
      'הגבלת-קצב של שרת שאין לנו: REG-IN היא SPA צד-לקוח, וה-Edge Functions רצות ב-Deno ' +
      'בלי החבילה הזו. אומת שאינה בחבילת-הדפדפן (אפס מופעי `Address4`/`Address6` ב-dist). ' +
      'מקבלים את הסיכון כי אין בארכיטקטורה שלנו נקודה שבה הוא מתממש.',
    reviewTrigger: 'סגירת המודול הבא, או כנס-הסיום 01/10/2026 — המוקדם מביניהם.',
  },
  {
    ghsa: 'GHSA-8xcm-r25x-g524',
    packages: ['undici'],
    date: '04/08/2026',
    reason:
      'דה-סנכרון תשובות במורד-הזרם דרך יירטן-הניסיון-החוזר של undici. מגיעה דרך jsdom ' +
      '(סביבת בדיקות-היחידה) ודרך ה-CLI של shadcn — שני מסלולים שאינם ייצור. ' +
      'הדפדפן משתמש ב-`fetch` המובנה שלו, לא ב-undici; אומת שאינה בחבילת-הדפדפן ' +
      '(אפס מופעי `undici` ב-dist). מקבלים את הסיכון כי הוא אינו יכול להגיע למשתמש.',
    reviewTrigger: 'סגירת המודול הבא, או כנס-הסיום 01/10/2026 — המוקדם מביניהם.',
  },
  {
    ghsa: 'GHSA-5p4m-2wfm-xmqj',
    packages: ['js-yaml'],
    date: '07/08/2026',
    reason:
      'צריכת-CPU ריבועית בפענוח `!!omap` (CVE-2026-59870, תיקון לא-backported ל-3.x/4.x). ' +
      'מגיעה דרך `cosmiconfig → shadcn` — אותה משפחת CLI-פיתוח-בלבד כמו יתר הפטורים ' +
      'למעלה, לא ייבוא מ-`src/`. אומת: `npm ls js-yaml` מראה שרשרת יחידה (shadcn → ' +
      'cosmiconfig → js-yaml), ואפס מופעי `js-yaml`/`jsYaml` ב-dist. מקבלים את הסיכון ' +
      'כי הוא אינו יכול להגיע למשתמש; קלט ה-YAML (אם בכלל) הוא קונפיג מקומי, לא קלט-משתמש.',
    reviewTrigger: 'סגירת המודול הבא, או כנס-הסיום 01/10/2026 — המוקדם מביניהם.',
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
