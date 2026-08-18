// בדיקות-יחידה ל-`api.js` של מודול 4 — הקובץ שהיה ללא שום כיסוי אוטומטי (מתועד ב-
// `04_hostesses/CLAUDE.md` §"מה חבילות ה-E2E אינן מכסות", 12/08/2026: `grep` על `*.test.js`
// החזיר אפס התאמות ל-`createHostess`/`updateHostess`/`releaseAssignment`/`markAssignmentStatus`).
//
// המיקוד: ארבע ההתנהגויות שצעד 2.6 ואודיט-הסגירה של 12/08 שינו בפועל, בלי ששום דבר מצמיד
// אותן היום: ‏(1) `listStaffingOverview` כוללת `ready` (⑫) · (2) `releaseAssignment` מחזירה
// ‏{row, mail} בשלושה מצבי-מייל · (3) `approveFinalAndRelease` מדווחת כשל-שחרור ב-`releaseFailed`
// ולא בולעת אותו · (4) `ensureProjectCoordinates` (דרך `getSmartMatchData`) לא מוחקת קואורדינטה
// שכבר נמצאה כשהשמירה עצמה נחסמת ע"י RLS.
//
// גישת-המוקינג: `supabase` ממוקק דרך `vi.mock('@/supabaseClient')` כ-stub שרשרתי (from/rpc).
// **אין תקדים בריפו לבדיקת-יחידה שממוקקת שרשרת-שאילתות של supabase** — `grep` על `vi.mock`
// תחת `src/` מחזיר רק `ProtectedRoute.test.jsx`, שממוקק קונטקסט-React ולא Supabase — ולכן
// זו הפעם הראשונה שהתבנית הזו נכתבת בפרויקט; מוסבר כאן בהרחבה כדי שהבדיקה הבאה תעתיק ולא תמציא.
// ‏`@/api/email` ו-`@/api/geocode` ממוקקים גם הם (הם הרשת האמיתית); `src/lib/*` (הכללים
// הטהורים — `finalAssignmentRows`, `autoReleaseTargets`, `resolveShiftContact` וכו') נשארים
// אמיתיים ורצים כרגיל — הם כבר מכוסים בבדיקות משלהם, ואין טעם למקק אותם כאן.

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/supabaseClient', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))
vi.mock('@/api/email', () => ({ sendEmail: vi.fn() }))
vi.mock('@/api/geocode', () => ({ geocodeAddress: vi.fn() }))

import { supabase } from '@/supabaseClient'
import { sendEmail } from '@/api/email'
import { geocodeAddress } from '@/api/geocode'
import {
  listStaffingOverview,
  releaseAssignment,
  approveFinalAndRelease,
  getSmartMatchData,
} from './api'

// ── עוזר-מוקינג: "בילדר" שרשרתי אחד לכל הקריאות ─────────────────────────────────
// כל מתודת-שרשרת (`select`/`eq`/`order`/`in`/`limit`/`update`/`insert`/`delete`) מחזירה
// את אותו אובייקט (`this`), בדיוק כמו ב-supabase-js האמיתי — כך שאין צורך לדעת מראש כמה
// חוליות-שרשרת קוד-הייצור יבנה. ה-`then` הופך את האובייקט עצמו ל-thenable, כדי ש-
// `await supabase.from(...).select(...).eq(...)` יעבוד גם בלי לקרוא ל-`.maybeSingle()`/
// ‏`.single()` בסוף (התבנית שרוב הכתיבות בקובץ הזה משתמשות בה: `.select()` כמילה אחרונה).
function makeChain(result) {
  const builder = {}
  for (const method of ['select', 'eq', 'order', 'in', 'limit', 'update', 'insert', 'delete']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(result))
  builder.single = vi.fn(() => Promise.resolve(result))
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return builder
}

// תור-תוצאות פר-שם-טבלה: כל קריאה ל-`supabase.from(table)` "צורכת" את הפריט הבא שהוכנס
// לתור של אותה טבלה, לפי סדר-ההכנסה. זה תואם את `api.js` כי הוא קורא ל-supabase **סדרתית**
// (‏`await` בין כל שתי קריאות) בכל הפונקציות הנבדקות כאן — חוץ מ-`getSmartMatchData`, שמריץ
// ‏`Promise.all`; שם עדיין תקף כי JS בונה ליטרל-מערך משמאל-לימין בצורה סינכרונית, ולכן סדר
// הקריאות ל-`.from(...)` בפועל זהה לסדר-הכתיבה במקור גם כשההמתנה עצמה מקבילה.
function queueTable(queues, table, result) {
  queues[table] = queues[table] ?? []
  queues[table].push(result)
}

function setupFrom(queues) {
  supabase.from.mockImplementation((table) => {
    const queue = queues[table]
    if (!queue || queue.length === 0) {
      throw new Error(
        `בדיקה לא הכינה תוצאה מתוזמנת לטבלה "${table}" (קריאה מס' ${(queues[`_${table}_calls`] ??= 0) + 1})`,
      )
    }
    return makeChain(queue.shift())
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════════
// (1) listStaffingOverview — 🔄2.6/⑫: `ready` נכלל בכוונה, `cancelled` לא.
// ═══════════════════════════════════════════════════════════════════════════════
describe('listStaffingOverview — סינון project_status (שינוי 2.6, הלילה)', () => {
  it('שולחת ל-.in את הסטטוסים הפעילים בדיוק — ready בפנים, cancelled בחוץ', async () => {
    const queues = {}
    queueTable(queues, 'projects', { data: [], error: null })
    setupFrom(queues)

    await listStaffingOverview()

    // ⚠️ מכוון-נגד: הציפייה כתובה **ליטרלית** ולא נגזרת מ-ACTIVE_PROJECT_STATUSES שמיובא
    // בקוד-הייצור — אחרת רגרסיה בקבוע עצמו הייתה משנה את שני הצדדים יחד והבדיקה הייתה
    // נשארת ירוקה על קוד שבור. זו בדיוק הבדיקה שהוכחה-אדומה למטה (בהרצה ידנית, לא בקובץ).
    const chain = supabase.from.mock.results[0].value
    expect(chain.in).toHaveBeenCalledWith('project_status', ['not_started', 'in_progress', 'ready'])
    const [, statuses] = chain.in.mock.calls[0]
    expect(statuses).not.toContain('cancelled')
  })

  it('מחזירה את הפרויקטים שחוזרים מהשאילתה', async () => {
    const rows = [{ project_id: 1, project_status: 'ready' }]
    const queues = {}
    queueTable(queues, 'projects', { data: rows, error: null })
    setupFrom(queues)

    await expect(listStaffingOverview()).resolves.toEqual(rows)
  })

  it('שגיאת-מסד נזרקת עם הודעה עברית, ולא נבלעת', async () => {
    const queues = {}
    queueTable(queues, 'projects', { data: null, error: { code: '500' } })
    setupFrom(queues)

    await expect(listStaffingOverview()).rejects.toThrow('שגיאה בטעינת רשימת האירועים לאיוש.')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// (2) releaseAssignment — {row, mail}, שלושה מצבי-מייל (תוקן 12/08/2026)
// ═══════════════════════════════════════════════════════════════════════════════
describe('releaseAssignment — {row, mail} ולעולם לא "הצלחה" שקטה על כשל-מייל', () => {
  const row = {
    project_id: 10,
    hostess_id: 20,
    assignment_number: 1,
    hostesses: { full_name: 'דנה לוין', email: 'dana@test.com' },
    projects: { event_name: 'כנס בדיקה' },
  }
  const releaseTemplate = 'תודה [שם_דיילת]!'

  function setupSuccessfulWrite() {
    const queues = {}
    queueTable(queues, 'assignments', {
      data: [{ ...row, assignment_status: 'released' }],
      error: null,
    })
    queueTable(queues, 'params', { data: { param_value: releaseTemplate }, error: null })
    setupFrom(queues)
  }

  it('כתיבה מצליחה + שליחה מצליחה ⇒ {row, mail:{sent:1}}', async () => {
    setupSuccessfulWrite()
    sendEmail.mockResolvedValue({ logFailed: false })

    const result = await releaseAssignment(row)

    expect(result.row).toEqual({ ...row, assignment_status: 'released' })
    expect(result.mail).toEqual({ sent: 1, unknown: 0, failed: 0 })
  })

  it('כתיבה מצליחה + פסק-זמן בשליחה ⇒ mail.unknown — לא "נכשל" (המייל אולי כן יצא)', async () => {
    setupSuccessfulWrite()
    sendEmail.mockRejectedValue(Object.assign(new Error('TIMEOUT'), { message: 'TIMEOUT' }))

    const result = await releaseAssignment(row)

    // 🔴 הליבה של תיקון 12/08: השורה כן שוחררה (הכתיבה הצליחה), רק המייל לא-ידוע.
    expect(result.row).not.toBeNull()
    expect(result.mail).toEqual({ sent: 0, unknown: 1, failed: 0 })
  })

  it('כתיבה מצליחה + שליחה נכשלת אמיתית ⇒ mail.failed', async () => {
    setupSuccessfulWrite()
    sendEmail.mockRejectedValue(new Error('boom'))

    const result = await releaseAssignment(row)

    expect(result.mail).toEqual({ sent: 0, unknown: 0, failed: 1 })
  })

  // 🔴 הפגם שהאודיט תיעד: עד 12/08 הפונקציה החזירה שורה בלבד, ולכן קורא לא היה יכול
  // לדעת שהמייל נכשל — ומדווח "נשלחה הודעה" תמיד. הבדיקה הבאה נועלת את ההפך: בשני
  // מצבי-הכשל, sent חייב להישאר 0.
  it('לעולם לא sent=1 כשהמייל בפועל לא אושר כנשלח (unknown/failed)', async () => {
    setupSuccessfulWrite()
    sendEmail.mockRejectedValue(new Error('boom'))
    const failed = await releaseAssignment(row)
    expect(failed.mail.sent).toBe(0)

    setupSuccessfulWrite()
    sendEmail.mockRejectedValue(Object.assign(new Error('t'), { message: 'TIMEOUT' }))
    const unknown = await releaseAssignment(row)
    expect(unknown.mail.sent).toBe(0)
  })

  it('שחרור-אוטומטי (silent) שנחסם ע"י RLS (0 שורות, בלי שגיאה) ⇒ {row:null, mail ריק} ולא זריקה', async () => {
    const queues = {}
    queueTable(queues, 'assignments', { data: [], error: null })
    setupFrom(queues)

    const result = await releaseAssignment(row, { silent: true })

    expect(result).toEqual({ row: null, mail: { sent: 0, unknown: 0, failed: 0 } })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('שחרור ידני (לא-silent) שנחסם ע"י RLS ⇒ זורקת הודעה מפורשת, לא בולעת', async () => {
    const queues = {}
    queueTable(queues, 'assignments', { data: [], error: null })
    setupFrom(queues)

    await expect(releaseAssignment(row)).rejects.toThrow('אין הרשאה לשחרר את השיבוץ הזה.')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// (3) approveFinalAndRelease — result.releaseFailed קיים, וכשל-שחרור נופל לתוכו (12/08)
// ═══════════════════════════════════════════════════════════════════════════════
function assignmentRow({ hostessId, status }) {
  const names = { dana: 'דנה לוין', mira: 'מירה כהן' }
  return {
    project_id: 501,
    hostess_id: hostessId,
    assignment_number: 1,
    assignment_status: status,
    is_shift_lead: false,
    hostesses: {
      hostess_id: hostessId,
      full_name: names[hostessId],
      email: `${hostessId}@test.com`,
      phone: '0500000000',
    },
    projects: {
      project_id: 501,
      event_name: 'כנס לדוגמה',
      final_event_date: '2026-09-10',
      final_start_time: '18:00:00',
      final_end_time: '22:00:00',
      final_location: 'תל אביב',
      required_hostess_count: 1,
      owner_name: 'רון גל',
      owner_phone: '0501112222',
    },
  }
}

describe('approveFinalAndRelease — releaseFailed', () => {
  it('שחרור-אוטומטי שנחסם ע"י RLS ⇒ השם נרשם ב-releaseFailed ולא נעלם מהתשובה (תוקן 12/08)', async () => {
    // תרחיש: דנה ומירה שתיהן "אישרו זמינות"; המכסה = 1. אישור-דנה סוגר את המכסה ⇒
    // מירה היא מועמדת-לשחרור-אוטומטי (autoReleaseTargets) — והשחרור שלה נכשל בשקט (RLS).
    const initialRows = [
      assignmentRow({ hostessId: 'dana', status: 'confirmed_available' }),
      assignmentRow({ hostessId: 'mira', status: 'confirmed_available' }),
    ]
    const afterApprovalRows = [
      assignmentRow({ hostessId: 'dana', status: 'finally_approved' }),
      assignmentRow({ hostessId: 'mira', status: 'confirmed_available' }),
    ]
    const finalApprovalTemplate =
      'שלום [שם_דיילת] [שם_פרויקט] [תאריך_אירוע] [שעת_התחלה] [שעת_סיום] [כתובת_אירוע_מלאה] [שם_מנהלת_פרויקט] [טלפון_מנהלת_פרויקט]'

    const queues = {}
    queueTable(queues, 'assignments', { data: initialRows, error: null }) // 1. rows = listProjectAssignments(פתיחה)
    queueTable(queues, 'assignments', {
      data: [assignmentRow({ hostessId: 'dana', status: 'finally_approved' })],
      error: null,
    }) // 2. update דנה ⇒ אישור סופי — מצליח
    queueTable(queues, 'params', { data: { param_value: finalApprovalTemplate }, error: null }) // 3. getEmailTemplate(finalApproval)
    queueTable(queues, 'assignments', { data: afterApprovalRows, error: null }) // 4. listProjectAssignments בתוך sendFinalApprovalMails
    queueTable(queues, 'assignments', { data: afterApprovalRows, error: null }) // 5. refreshed = listProjectAssignments (אחרי האישורים)
    queueTable(queues, 'assignments', { data: [], error: null }) // 6. update מירה ⇒ שחרור-אוטומטי — נחסם ע"י RLS
    setupFrom(queues)
    sendEmail.mockResolvedValue({ logFailed: false })

    const result = await approveFinalAndRelease({ projectId: 501, hostessIds: ['dana'] })

    expect(result.approved).toEqual(['דנה לוין'])
    expect(result.failed).toEqual([])
    expect(result.released).toEqual([])
    // 🔴 זו הבדיקה שלא הייתה קיימת עד 12/08: לפני התיקון מירה פשוט נעלמה מהתשובה,
    // בעוד שהיא בפועל נשארה משובצת על אירוע שכבר "אויש במלואו" מבחינת המנהלת.
    expect(result.releaseFailed).toEqual(['מירה כהן'])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// (4) ensureProjectCoordinates (דרך getSmartMatchData) — כשל-שמירה אינו מוחק נקודה שנמצאה
// ═══════════════════════════════════════════════════════════════════════════════
describe('ensureProjectCoordinates (פנימית, נבדקת דרך getSmartMatchData) — תוקן 12/08', () => {
  function queueSmartMatchReads(queues, project) {
    queueTable(queues, 'projects', { data: project, error: null })
    queueTable(queues, 'hostesses', { data: [], error: null })
    queueTable(queues, 'assignments', { data: [], error: null }) // assignmentsRes
    queueTable(queues, 'assignments', { data: [], error: null }) // sameDayRes
    queueTable(queues, 'params', { data: [], error: null })
  }

  it('הגאוקוד הצליח אבל שמירת-הקואורדינטה נחסמה (42501) ⇒ הנקודה עדיין חוזרת ב-project', async () => {
    const project = {
      project_id: 701,
      event_name: 'כנס בדיקה',
      customer_id: null,
      final_event_date: '2026-09-15',
      final_location: 'רחוב הבדיקה 1, תל אביב',
      required_hostess_count: 3,
      lat: null,
      lng: null,
    }
    const queues = {}
    queueSmartMatchReads(queues, project)
    setupFrom(queues)
    geocodeAddress.mockResolvedValue({ lat: 32.08, lng: 34.78 })
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    })

    const result = await getSmartMatchData(701)

    // 🔴 זה בדיוק מה שהיה שבור: `return error ? null : coordinates` היה זורק את הנקודה
    // כי ה-RPC נחסם, וכל המסך היה מציג "אין קואורדינטות" — למרות שהגאוקוד כן הצליח.
    expect(result.project.lat).toBe(32.08)
    expect(result.project.lng).toBe(34.78)
    expect(supabase.rpc).toHaveBeenCalledWith('set_project_coordinates', {
      p_project_id: 701,
      p_lat: 32.08,
      p_lng: 34.78,
    })
  })

  it('לפרויקט כבר יש קואורדינטות ⇒ אין קריאת-גאוקוד ואין RPC בכלל', async () => {
    const project = {
      project_id: 702,
      customer_id: null,
      final_event_date: '2026-09-16',
      final_location: 'כתובת כלשהי',
      lat: 1,
      lng: 2,
    }
    const queues = {}
    queueSmartMatchReads(queues, project)
    setupFrom(queues)

    const result = await getSmartMatchData(702)

    expect(geocodeAddress).not.toHaveBeenCalled()
    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(result.project.lat).toBe(1)
    expect(result.project.lng).toBe(2)
  })

  it('הגאוקוד עצמו נכשל (null) ⇒ אין RPC, והפרויקט חוזר בלי קואורדינטות (לא זורק)', async () => {
    const project = {
      project_id: 703,
      customer_id: null,
      final_event_date: '2026-09-17',
      final_location: 'כתובת שלא תיפתר',
      lat: null,
      lng: null,
    }
    const queues = {}
    queueSmartMatchReads(queues, project)
    setupFrom(queues)
    geocodeAddress.mockResolvedValue(null)

    const result = await getSmartMatchData(703)

    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(result.project.lat).toBeNull()
    expect(result.project.lng).toBeNull()
  })
})
