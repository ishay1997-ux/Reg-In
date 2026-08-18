// בדיקות-יחידה ללוגיקה הטהורה של api.js. **api.js של המודול הזה, כמו בכל מודול אחר בריפו
// (02_customers · 03_quotes · 04_hostesses), אינו נבדק ביחידה מקצה-לקצה** — עוטפי-Supabase
// דקים מאומתים חי בדפדפן מחובר (הדפוס המתועד ב-`src/modules/04_hostesses/CLAUDE.md`
// §"מה חבילות ה-E2E של המודול אינן מכסות": "grep על כל *.test.js מחזיר אפס התאמות ל-api
// functions", ואין מנגנון-mock ל-supabase-client בפרויקט). מה שכן נבדק כאן: שתי הפונקציות
// הטהורות שהצעד 2.5 מגדיר כלוגיקה בדוקה — confirmedAvailableCount ו-rpcErrorMessage —
// כל אחת נשברה בכוונה ונראתה נכשלת לפני שתוקנה (ראו דוח-הסשן להוכחת red/green).

import { describe, it, expect } from 'vitest'
import { confirmedAvailableCount, rpcErrorMessage } from './api'

describe('confirmedAvailableCount', () => {
  it('מחזירה 0 על רשימה ריקה או חסרה', () => {
    expect(confirmedAvailableCount([])).toBe(0)
    expect(confirmedAvailableCount(undefined)).toBe(0)
  })

  it('סופרת דיילת יחידה ששורתה הקובעת confirmed_available', () => {
    const rows = [
      {
        project_id: 11,
        hostess_id: 1,
        assignment_number: 1,
        assignment_status: 'confirmed_available',
      },
    ]
    expect(confirmedAvailableCount(rows)).toBe(1)
  })

  it('נספרת רק השורה הקובעת (MAX assignment_number) — סירוב-וזומנה-שוב אינה מוכפלת', () => {
    // דיילת שסירבה (assignment_number=1) ואז זומנה שוב ואישרה זמינות (assignment_number=2):
    // הקיפול חייב לספור רק את השורה השנייה, לא את שתיהן ולא את הראשונה.
    const rows = [
      { project_id: 11, hostess_id: 1, assignment_number: 1, assignment_status: 'declined' },
      {
        project_id: 11,
        hostess_id: 1,
        assignment_number: 2,
        assignment_status: 'confirmed_available',
      },
    ]
    expect(confirmedAvailableCount(rows)).toBe(1)
  })

  it('לא סופרת דיילת ששורתה הקובעת כבר finally_approved — גם אם שורה קודמת הייתה confirmed_available', () => {
    const rows = [
      {
        project_id: 11,
        hostess_id: 2,
        assignment_number: 1,
        assignment_status: 'confirmed_available',
      },
      {
        project_id: 11,
        hostess_id: 2,
        assignment_number: 2,
        assignment_status: 'finally_approved',
      },
    ]
    expect(confirmedAvailableCount(rows)).toBe(0)
  })

  it('סופרת נכון על פני כמה דיילות במעורב', () => {
    const rows = [
      {
        project_id: 11,
        hostess_id: 1,
        assignment_number: 1,
        assignment_status: 'confirmed_available',
      },
      { project_id: 11, hostess_id: 2, assignment_number: 1, assignment_status: 'pending' },
      {
        project_id: 11,
        hostess_id: 3,
        assignment_number: 1,
        assignment_status: 'confirmed_available',
      },
      {
        project_id: 11,
        hostess_id: 4,
        assignment_number: 1,
        assignment_status: 'finally_approved',
      },
    ]
    expect(confirmedAvailableCount(rows)).toBe(2)
  })

  it('שורה בלי assignment_status מוגדר אינה נספרת (ולא נזרקת)', () => {
    const rows = [{ project_id: 11, hostess_id: 1, assignment_number: 1 }]
    expect(confirmedAvailableCount(rows)).toBe(0)
  })
})

describe('rpcErrorMessage', () => {
  it('מחזירה את הודעת-השרת כפי-שהיא כשיש כזו — הכלל "לא משחזרים, מציגים" (as-built ⑤)', () => {
    const serverMessage = 'הדיילת כבר מאושרת סופית לאירוע אחר בתאריך הזה.'
    expect(rpcErrorMessage({ message: serverMessage }, 'נפילה כללית')).toBe(serverMessage)
  })

  it('חותכת רווחים משני הצדדים של הודעת-השרת', () => {
    expect(rpcErrorMessage({ message: '  יש בעיה.  ' }, 'נפילה כללית')).toBe('יש בעיה.')
  })

  it('נופלת ל-fallback כשאין הודעת-שרת (תקלת-רשת/timeout)', () => {
    expect(rpcErrorMessage(undefined, 'נפילה כללית')).toBe('נפילה כללית')
    expect(rpcErrorMessage({}, 'נפילה כללית')).toBe('נפילה כללית')
    expect(rpcErrorMessage({ message: '' }, 'נפילה כללית')).toBe('נפילה כללית')
    expect(rpcErrorMessage({ message: '   ' }, 'נפילה כללית')).toBe('נפילה כללית')
  })
})
