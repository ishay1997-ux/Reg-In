// עוטפן בדיקת-העשן — `npm run smoke` (הכרעת-ישי 30/07/2026).
// תפקידו היחיד: להריץ את e2e/smoke.spec.js ולתרגם כל סוג-כשל לקוד-יציאה מובחן,
// כדי שאפשר יהיה להבדיל בשנייה בין באג אמיתי לבין סיסמה שהוחלפה או שרת שלא רץ:
//   0 — הכל עלה עם הנתונים האמיתיים.
//   1 — כשל-טענה: מסך לא הציג ערך-עוגן / ניסה לכתוב / שגיאת-קונסול. באג אמיתי.
//   2 — בעיית-זהות: אין E2E_CEO_* ב-.env.local, או שההתחברות עצמה נכשלה. לא באג בקוד.
//   3 — השרת לא רץ על :5173. להפעיל `npm run dev` ולנסות שוב. לא באג בקוד.
// ⚠️ בכוונה לא חלק מ-gate/CI — קרטוע-רשת לא יחסום פריסה (כלל שנלמד ב-gedood-710).

import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'

const BASE_URL = 'http://localhost:5173'
const MARKER = path.resolve('test-results/smoke-failure-class.json')

// אותו טוען-.env.local כמו playwright.config.js (בלי תלות dotenv).
const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim()
  }
}

if (!process.env.E2E_CEO_EMAIL || !process.env.E2E_CEO_PASSWORD) {
  console.error('🔑 עשן: E2E_CEO_EMAIL / E2E_CEO_PASSWORD חסרים ב-.env.local — אין עם מי להתחבר.')
  process.exit(2)
}

// בדיקת-שרת לפני הכל. במכוון לא נשענים על ההפעלה-האוטומטית של Playwright: העשן בודק
// את המערכת כפי שהיא רצה עכשיו; "השרת לא עולה" הוא ממצא בפני עצמו, לא משהו להסתיר.
try {
  await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) })
} catch {
  console.error(`🔌 עשן: אין שרת על ${BASE_URL} — הפעל \`npm run dev\` ונסה שוב.`)
  process.exit(3)
}

if (fs.existsSync(MARKER)) fs.rmSync(MARKER)

const result = spawnSync('npx', ['playwright', 'test', 'e2e/smoke.spec.js', '--reporter=line'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.status === 0) {
  console.log('✅ עשן: כל המסכים הראשיים עלו עם הנתונים האמיתיים.')
  process.exit(0)
}

let failureClass = 'assert'
try {
  failureClass = JSON.parse(fs.readFileSync(MARKER, 'utf-8')).failureClass ?? 'assert'
} catch {
  // אין קובץ-סמן ⇒ הכשל אחרי ההתחברות ⇒ טענה שנכשלה (באג אמיתי).
}

if (failureClass === 'auth') {
  console.error('🔑 עשן: ההתחברות נכשלה — כנראה סיסמה שהוחלפה או משתמש שנחסם. לא באג בקוד.')
  process.exit(2)
}
console.error('🐞 עשן: מסך לא עמד בערך-העוגן שלו (או כתב/שגה) — זה באג אמיתי. הפירוט למעלה.')
process.exit(1)
