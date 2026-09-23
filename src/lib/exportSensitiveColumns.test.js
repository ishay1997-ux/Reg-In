import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { allowsColumn, PERSON_RATE_KEY_PATTERN } from '@/lib/exportSensitiveColumns'
import { applyColumnOrder, defaultOrder } from '@/lib/exportColumns'
import { buildExportSheet } from '@/lib/reportsExport'

// 🔴🔴 **העמודות נבנות ב-`JSON.parse`, וזה לב הבדיקה ולא סגנון.**
// ‏`exportFetch.js` מקבל `payload?.columns` מה-RPC — כלומר **JSON**, ו-JSON אינו יכול
// לשאת פונקציה. 📊 **הסבב הקודם נכשל בדיוק כאן:** שלוש בדיקות עברו על
// `{visible: () => canEdit}` — **צורה שאף דבר בייצור אינו מייצר** — ולכן הן לא בדקו
// את מה ששבור. **בדיקה שיכולה לעבור על אובייקט עם פונקציה אינה בודקת את הדליפה.**
//
// 📄 **העמודות מועתקות מהמיגרציה החיה**, לא מומצאות:
// `20260917005500_module11_j1_rpc_round4.sql:2156` — דוח "איכות מול עלות" של הדיילות.
const RPC_COLUMNS = JSON.parse(`[
  { "key": "hostess_name", "label": "דיילת",       "format": "text",  "align": "start" },
  { "key": "city",         "label": "עיר",         "format": "text",  "align": "start" },
  { "key": "hourly_rate",  "label": "תעריף שעתי",  "format": "money", "align": "end" },
  { "key": "rating",       "label": "דירוג",       "format": "int",   "align": "end" }
]`)

const RPC_ROWS = JSON.parse(`[
  { "hostess_name": "נועה לוי", "city": "חיפה",    "hourly_rate": 46, "rating": 5 },
  { "hostess_name": "שיר כהן",  "city": "תל אביב", "hourly_rate": 52, "rating": 4 }
]`)

const VIEWER = { דיילות: 'view' }
const MANAGER = { דיילות: 'edit' }

// 🔴🔴 **הבדיקה שהיתה כאן הוחלפה — היא היתה טאוטולוגיה, וזו טעות שלי.**
// נכתב כאן `expect(typeof column.visible).not.toBe('function')` על פיקסטורה שנבנתה
// ב-`JSON.parse` — ו-`JSON.parse` **לעולם אינו מייצר פונקציה**, כלומר הטענה
// **אינה יכולה להיכשל.** והערה *"הועתק מהמיגרציה"* היא הערה, לא מנגנון:
// **שום דבר לא קרא את ה-SQL בזמן הבדיקה** ⇒ עמודת-שכר חדשה היתה משאירה הכל ירוק.
//
// ✅ **מה שהחליף אותה הוא סריקה אמיתית של קבצי-המיגרציה מהדיסק.**
// כל הכרזת-עמודה שמפתחה נראה כמו שכר-פר-אדם חייבת להיות ברשם.
// 🔑 **זה תופס גם את הבא** — מיגרציה עתידית שתחשוף שדה-שכר תחת שם שלישי
// **תפיל את הבדיקה עד שמישהו יסווג אותה**, ולא תעבור בשתיקה.
describe('🔴 סריקת המיגרציות — אין שדה-שכר מוכרז שאינו ברשם', () => {
  const dir = path.resolve(process.cwd(), 'supabase/migrations')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql'))

  it('הסריקה עצמה מוצאת קבצים — אחרת היא עוברת על ריק ואינה בודקת דבר', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('🔴 כל מפתח שנראה כמו שכר-פר-אדם נמצא ברשם-העמודות-הרגישות', () => {
    const unregistered = new Set()
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8')
      for (const match of sql.matchAll(/'key',\s*'([a-z0-9_]+)'/g)) {
        const key = match[1]
        if (PERSON_RATE_KEY_PATTERN.test(key) && allowsColumn(key, { דיילות: 'view' })) {
          unregistered.add(`${key}  (${file})`)
        }
      }
    }
    expect([...unregistered]).toEqual([])
  })

  it('הסריקה באמת פוגשת את `hourly_rate` — אחרת הדפוס שלה שגוי', () => {
    const seen = files.some((file) =>
      /'key',\s*'hourly_rate'/.test(fs.readFileSync(path.join(dir, file), 'utf8')),
    )
    expect(seen).toBe(true)
    expect(PERSON_RATE_KEY_PATTERN.test('hourly_rate')).toBe(true)
    expect(PERSON_RATE_KEY_PATTERN.test('hourly_rate_snapshot')).toBe(true)
    // ⚠️ ולא תופס עמודות-כסף מצרפיות — רישום-יתר מרוקן דוחות-ניהול.
    expect(PERSON_RATE_KEY_PATTERN.test('final_profit')).toBe(false)
    expect(PERSON_RATE_KEY_PATTERN.test('median_rate')).toBe(false)
    expect(PERSON_RATE_KEY_PATTERN.test('response_rate')).toBe(false)
  })
})

describe('רשם העמודות הרגישות — תעריף שעתי בתפקיד view', () => {
  it('① אינה נכנסת לסדר-הפתיחה ⇒ אינה בבוחר', () => {
    expect(defaultOrder(RPC_COLUMNS, VIEWER)).toEqual(['hostess_name', 'city', 'rating'])
  })

  it('② אינה חוזרת גם כשה-order השמור מבקש אותה במפורש', () => {
    const smuggled = ['hourly_rate', 'hostess_name']
    const out = applyColumnOrder(RPC_COLUMNS, smuggled, new Set(smuggled), VIEWER)
    expect(out.map((c) => c.key)).not.toContain('hourly_rate')
  })

  it('③ התעריף אינו בגיליון — לא התווית ולא המספר', () => {
    const sheet = buildExportSheet({ columns: RPC_COLUMNS, rows: RPC_ROWS, permissions: VIEWER })
    const flat = JSON.stringify(sheet)
    expect(sheet[0].map((c) => c.value)).toEqual(['דיילת', 'עיר', 'דירוג'])
    expect(flat).not.toContain('תעריף שעתי')
    expect(flat).not.toContain('46')
    expect(flat).not.toContain('52')
  })

  it('④ בתפקיד edit התעריף כן נכנס — הרשם אינו מוחק דוח-ניהול', () => {
    const sheet = buildExportSheet({ columns: RPC_COLUMNS, rows: RPC_ROWS, permissions: MANAGER })
    expect(sheet[0].map((c) => c.value)).toContain('תעריף שעתי')
    expect(JSON.stringify(sheet)).toContain('46')
  })

  it('⑤ אין מפת-הרשאות כלל ⇒ נופל סגור, ולא פתוח', () => {
    expect(allowsColumn('hourly_rate', null)).toBe(false)
    expect(allowsColumn('hourly_rate', undefined)).toBe(false)
    expect(allowsColumn('hourly_rate', {})).toBe(false)
    expect(allowsColumn('hourly_rate', { דיילות: 'blocked' })).toBe(false)
  })

  it('⑥ מפתח שאינו ברשם עובר — 16 הדוחות הקיימים אינם מתרוקנים', () => {
    expect(allowsColumn('rating', null)).toBe(true)
    expect(allowsColumn('hostess_name', {})).toBe(true)
    expect(defaultOrder(RPC_COLUMNS, MANAGER)).toHaveLength(4)
  })
})
