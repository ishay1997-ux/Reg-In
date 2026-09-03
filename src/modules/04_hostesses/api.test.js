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
vi.mock('@/api/email', () => ({ sendEmail: vi.fn(), getEmailTemplate: vi.fn() }))
vi.mock('@/api/geocode', () => ({ geocodeAddress: vi.fn() }))

import { supabase } from '@/supabaseClient'
import { sendEmail, getEmailTemplate } from '@/api/email'
import { geocodeAddress } from '@/api/geocode'
import { SMART_MATCH_PARAM_NAMES } from '@/lib/smartMatch'
import { HOSTESS_PARAM_NAMES } from '@/lib/hostesses'
import {
  listStaffingOverview,
  releaseAssignment,
  approveFinalAndRelease,
  getSmartMatchData,
  getHostessScreenParams,
  createHostess,
  updateHostess,
  getHostess,
  listHostesses,
} from './api'

// ── עוזר-מוקינג: "בילדר" שרשרתי אחד לכל הקריאות ─────────────────────────────────
// כל מתודת-שרשרת (`select`/`eq`/`order`/`in`/`limit`/`update`/`insert`/`delete`) מחזירה
// את אותו אובייקט (`this`), בדיוק כמו ב-supabase-js האמיתי — כך שאין צורך לדעת מראש כמה
// חוליות-שרשרת קוד-הייצור יבנה. ה-`then` הופך את האובייקט עצמו ל-thenable, כדי ש-
// `await supabase.from(...).select(...).eq(...)` יעבוד גם בלי לקרוא ל-`.maybeSingle()`/
// ‏`.single()` בסוף (התבנית שרוב הכתיבות בקובץ הזה משתמשות בה: `.select()` כמילה אחרונה).
function makeChain(result) {
  const builder = {}
  for (const method of [
    'select',
    'eq',
    'order',
    'in',
    'limit',
    'update',
    'insert',
    'delete',
    'upsert',
    'not',
    // `range` נוסף 03/09/2026 — `fetchAll` (תקרת-1,000) מדפדף דרכו; המוק מחזיר עמוד יחיד.
    'range',
  ]) {
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
// כל שמות-הפרמטרים ש-`ALL_PARAM_NAMES` מרכיב, נגזרים **מאותן מפות** שהקוד קורא מהן —
// רשימה מוקלדת כאן הייתה מתיישנת בשקט ברגע שמודול מוסיף שם (וזה בדיוק מה שקרה בצעד 2.3).
function allParamRows() {
  return [...Object.values(SMART_MATCH_PARAM_NAMES), ...Object.values(HOSTESS_PARAM_NAMES)].map(
    (param_name) => ({ param_name, param_value: '1' }),
  )
}

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
    setupFrom(queues)
    // ‏`getEmailTemplate` יובאה מ-`@/api/email` (אוחד 19/08/2026, CLONE-1) — לא עוד שאילתת
    // `params` מקומית; ממוקקת ישירות במקום queueTable('params', …).
    getEmailTemplate.mockResolvedValue(releaseTemplate)
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
    // 3. getEmailTemplate(finalApproval) — יובאה מ-`@/api/email` (אוחד 19/08/2026, CLONE-1),
    // ממוקקת ישירות מתחת ולא עוד דרך תור 'params'.
    queueTable(queues, 'assignments', { data: afterApprovalRows, error: null }) // 4. listProjectAssignments בתוך sendFinalApprovalMails
    queueTable(queues, 'assignments', { data: afterApprovalRows, error: null }) // 5. refreshed = listProjectAssignments (אחרי האישורים)
    queueTable(queues, 'assignments', { data: [], error: null }) // 6. update מירה ⇒ שחרור-אוטומטי — נחסם ע"י RLS
    setupFrom(queues)
    sendEmail.mockResolvedValue({ logFailed: false })
    getEmailTemplate.mockResolvedValue(finalApprovalTemplate)

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
    // 🔄 מאז מודול 9 · צעד 2.3 שליפת ה-`params` של המסך עוברת דרך `getParamValues`,
    // ש**זורקת** על כל שם שלא חזר ⇒ תשובה ריקה כבר אינה "פרמטרים חסרים בשקט" אלא
    // כשל-טעינה. הבדיקות כאן בודקות את **הגאוקוד**, ולכן הן מזינות את המפה המלאה
    // ומשאירות את מסלול-החוסר לבדיקה שנועדה לו (מטה).
    queueTable(queues, 'params', { data: allParamRows(), error: null })
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

// ═══════════════════════════════════════════════════════════════════════════════
// (5) פרטי-בנק בטבלת-בת — מ8 ה19, 27/08/2026
// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 **למה דווקא כאן ודווקא עכשיו:** `createHostess`/`updateHostess` הן משטח-הכתיבה
// עם הכיסוי הנמוך ביותר בריפו (`04_hostesses/CLAUDE.md`), ומיגרציה C הרגע שינתה
// לאן הן כותבות. בלי הבדיקות האלה, שגיאה בפיצול הייתה מתגלה רק כשדיילת נשמרת בלי
// חשבון-בנק — כלומר **כשלא משלמים לה**, וזה כשל שקט קלאסי.
// ⚠️ שלוש העמודות הישנות עדיין קיימות על `hostesses` (יימחקו ב-C2), ולכן הבדיקה
// שהן **לא** נשלחות ל-insert אינה טאוטולוגיה — המסד היה מקבל אותן בשמחה.
describe('פרטי-בנק — פיצול לטבלת-הבת (ה19)', () => {
  it('createHostess: שדות-הבנק לא נשלחים ל-hostesses, ונכתבים לטבלת-הבת עם המזהה החדש', async () => {
    geocodeAddress.mockResolvedValue(null)
    const queues = {}
    queueTable(queues, 'hostesses', { data: { hostess_id: 77, full_name: 'דנה כהן' }, error: null })
    queueTable(queues, 'hostess_bank_details', { data: [{ hostess_id: 77 }], error: null })
    setupFrom(queues)

    await createHostess({
      full_name: 'דנה כהן',
      city: 'חיפה',
      bank_name: 'לאומי',
      bank_branch: '001',
      bank_account: '12345',
    })

    const hostessInsert = supabase.from.mock.results[0].value.insert.mock.calls[0][0]
    expect(hostessInsert).not.toHaveProperty('bank_name')
    expect(hostessInsert).not.toHaveProperty('bank_branch')
    expect(hostessInsert).not.toHaveProperty('bank_account')
    expect(hostessInsert.full_name).toBe('דנה כהן')

    const bankInsert = supabase.from.mock.results[1].value.insert.mock.calls[0][0]
    expect(bankInsert).toEqual({
      hostess_id: 77,
      bank_name: 'לאומי',
      bank_branch: '001',
      bank_account: '12345',
    })
  })

  it('createHostess: כתיבת-בנק שנחסמה ב-RLS (אפס שורות) זועקת ואינה מדווחת הצלחה', async () => {
    geocodeAddress.mockResolvedValue(null)
    const queues = {}
    queueTable(queues, 'hostesses', {
      data: { hostess_id: 78, full_name: 'רותי לוי' },
      error: null,
    })
    // 🚨 המלכודת המרכזית של הפרויקט: RLS מחזיר מערך ריק **בלי שגיאה**.
    queueTable(queues, 'hostess_bank_details', { data: [], error: null })
    setupFrom(queues)

    await expect(
      createHostess({
        full_name: 'רותי לוי',
        city: 'חיפה',
        bank_name: 'לאומי',
        bank_branch: '1',
        bank_account: '2',
      }),
    ).rejects.toThrow('רותי לוי')
  })

  it('updateHostess: משתמשת ב-upsert על טבלת-הבת, לא ב-update', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', { data: [{ hostess_id: 5 }], error: null })
    queueTable(queues, 'hostess_bank_details', { data: [{ hostess_id: 5 }], error: null })
    setupFrom(queues)

    await updateHostess(5, {
      full_name: 'שרה',
      bank_name: 'דיסקונט',
      bank_branch: '9',
      bank_account: '8',
    })

    const hostessUpdate = supabase.from.mock.results[0].value.update.mock.calls[0][0]
    expect(hostessUpdate).not.toHaveProperty('bank_name')

    // ⚠️ upsert ולא update: לדיילת שנוצרה לפני הפיצול אין שורת-בת, ו-update היה
    // מחזיר אפס שורות — כלומר "אין הרשאה" מזויף על מצב תקין לחלוטין.
    const bankChain = supabase.from.mock.results[1].value
    expect(bankChain.update).not.toHaveBeenCalled()
    expect(bankChain.upsert).toHaveBeenCalledWith(
      { hostess_id: 5, bank_name: 'דיסקונט', bank_branch: '9', bank_account: '8' },
      { onConflict: 'hostess_id' },
    )
  })

  it('getHostess: משטח את שורת-הבת לשדות שטוחים, כמו שהמסך מצפה', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', {
      data: {
        hostess_id: 3,
        full_name: 'מיכל',
        hostess_bank_details: { bank_name: 'הפועלים', bank_branch: '77', bank_account: '999' },
      },
      error: null,
    })
    setupFrom(queues)

    const row = await getHostess(3)
    expect(row.bank_name).toBe('הפועלים')
    expect(row.bank_account).toBe('999')
    expect(row).not.toHaveProperty('hostess_bank_details')
  })

  it('getHostess: דיילת בלי שורת-בנק נטענת ומוצגת — מחרוזות ריקות, לא null ולא קריסה', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', {
      data: { hostess_id: 4, full_name: 'אורלי', hostess_bank_details: null },
      error: null,
    })
    setupFrom(queues)

    const row = await getHostess(4)
    // 🔴 מחרוזת ריקה ולא null: הטופס משתמש בשדות מבוקרים, ו-null היה הופך אותם
    // ללא-מבוקרים באזהרת-React — באג שקט שנראה כמו "השדה לא נשמר".
    expect(row.bank_name).toBe('')
    expect(row.bank_branch).toBe('')
    expect(row.bank_account).toBe('')
    expect(row.full_name).toBe('אורלי')
  })

  it('listHostesses: מבקשת את שורת-הבת בצירוף, אחרת המסך יראה שדות ריקים בשקט', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', { data: [], error: null })
    setupFrom(queues)

    await listHostesses()

    const selectArg = supabase.from.mock.results[0].value.select.mock.calls[0][0]
    expect(selectArg).toContain('hostess_bank_details(*)')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// (6) שפות — נרמול לטבלת-בת (N1, 27/08/2026)
// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 **מה הבדיקות האלה נועלות, וזה לא "שהקוד רץ":** ההבחנה בין `undefined` ל-`[]`.
// ‏`updateHostess` מקבל patch **חלקי** — עדכון-טלפון בלבד אינו נושא `languages`, ואם
// נתייחס לזה כ"רשימה ריקה" **נמחק לדיילת את כל שפותיה בשקט** בכל עריכה שאינה נוגעת בהן.
// זה בדיוק סוג הכשל שאין לו הודעת-שגיאה ואיש לא מבחין בו עד שמישהו מחפש דוברת רוסית.
describe('שפות — נרמול לטבלת-הבת (N1)', () => {
  it('createHostess: `languages` אינו נשלח ל-hostesses, אלא לטבלת-הבת עם המזהה החדש', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', { data: { hostess_id: 91, full_name: 'רותם' }, error: null })
    queueTable(queues, 'hostess_languages', { data: [], error: null }) // upsert
    queueTable(queues, 'hostess_languages', { data: [], error: null }) // delete-stale
    setupFrom(queues)

    await createHostess({ full_name: 'רותם', languages: ['עברית', 'אנגלית'] })

    const hostessInsert = supabase.from.mock.results[0].value.insert.mock.calls[0][0]
    expect(hostessInsert).not.toHaveProperty('languages')

    const rows = supabase.from.mock.results[1].value.upsert.mock.calls[0][0]
    expect(rows).toEqual([
      { hostess_id: 91, language: 'עברית' },
      { hostess_id: 91, language: 'אנגלית' },
    ])
  })

  it('🔴 updateHostess בלי `languages` — לא נוגע בטבלת-הבת בכלל', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', { data: [{ hostess_id: 5 }], error: null })
    setupFrom(queues)

    await updateHostess(5, { phone: '050-1111111' })

    // אילו היינו מתייחסים ל-`undefined` כ-`[]`, כאן הייתה נופלת קריאה שנייה
    // שמוחקת את כל שפותיה — והבדיקה הזאת היא מה שמונע את זה.
    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledWith('hostesses')
  })

  it('🔴 updateHostess עם מערך ריק — כן מוחק את כולן (בקשה מפורשת, לא היעדר)', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', { data: [{ hostess_id: 5 }], error: null })
    queueTable(queues, 'hostess_languages', { data: [], error: null })
    setupFrom(queues)

    await updateHostess(5, { languages: [] })

    const chain = supabase.from.mock.results[1].value
    expect(chain.upsert).not.toHaveBeenCalled()
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('hostess_id', 5)
    // מחיקת-הכול לדיילת הזו — ובלי `not`, שהוא תחביר לא-חוקי על רשימה ריקה.
    expect(chain.not).not.toHaveBeenCalled()
  })

  it('🔴 replace כותב את החדש לפני שמוחק את הישן — הכלל של src/CLAUDE.md', async () => {
    const order = []
    const queues = {}
    queueTable(queues, 'hostesses', { data: [{ hostess_id: 5 }], error: null })
    queueTable(queues, 'hostess_languages', { data: [], error: null })
    queueTable(queues, 'hostess_languages', { data: [], error: null })
    supabase.from.mockImplementation((table) => {
      const chain = makeChain((queues[table] ?? []).shift() ?? { data: [], error: null })
      const originalUpsert = chain.upsert
      const originalDelete = chain.delete
      chain.upsert = vi.fn((...args) => {
        order.push('upsert')
        return originalUpsert(...args)
      })
      chain.delete = vi.fn((...args) => {
        order.push('delete')
        return originalDelete(...args)
      })
      return chain
    })

    await updateHostess(5, { languages: ['עברית'] })

    expect(order).toEqual(['upsert', 'delete'])
  })

  it('ניקוי-קלט: רווחי-קצה, ריקים וכפילויות אינם מגיעים למסד', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', { data: [{ hostess_id: 7 }], error: null })
    queueTable(queues, 'hostess_languages', { data: [], error: null })
    queueTable(queues, 'hostess_languages', { data: [], error: null })
    setupFrom(queues)

    await updateHostess(7, { languages: ['  עברית  ', 'עברית', '', '   ', 'ערבית'] })

    const rows = supabase.from.mock.results[1].value.upsert.mock.calls[0][0]
    expect(rows).toEqual([
      { hostess_id: 7, language: 'עברית' },
      { hostess_id: 7, language: 'ערבית' },
    ])
  })

  it('קריאה: הצירוף משוטח בחזרה למערך `languages` ממוין', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', {
      data: {
        hostess_id: 3,
        full_name: 'נועה',
        hostess_bank_details: null,
        hostess_languages: [{ language: 'רוסית' }, { language: 'אנגלית' }],
      },
      error: null,
    })
    setupFrom(queues)

    const row = await getHostess(3)

    expect(row.languages).toEqual(['אנגלית', 'רוסית'])
    expect(row).not.toHaveProperty('hostess_languages')
  })

  it('🔴 דיילת בלי שפות נטענת עם מערך ריק — לעולם לא undefined', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', {
      data: {
        hostess_id: 4,
        full_name: 'אורלי',
        hostess_bank_details: null,
        hostess_languages: [],
      },
      error: null,
    })
    setupFrom(queues)

    const row = await getHostess(4)

    // `ChipToggle` מריץ `.includes()` על הערך הזה — `undefined` היה מפיל את הכרטיס.
    expect(row.languages).toEqual([])
  })

  it('listHostesses: מבקשת גם את שורות-השפה בצירוף', async () => {
    const queues = {}
    queueTable(queues, 'hostesses', { data: [], error: null })
    setupFrom(queues)

    await listHostesses()

    const selectArg = supabase.from.mock.results[0].value.select.mock.calls[0][0]
    expect(selectArg).toContain('hostess_languages(language)')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// (5) getHostessScreenParams — שורת-`params` חסרה צועקת, ואינה נעדרת בשקט (מודול 9 · 2.3)
// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ **"שומר שלא נצפה נכשל — אינו שומר"** (`src/CLAUDE.md`): הכשל מוחזר בכוונה כדי לראות
// את ההגנה צועקת. עד צעד 2.3 הפונקציה החזירה **מפה חלקית** — כלומר שורה שנמחקה מ-`params`
// הייתה מגיעה לכרטיס-הדיילת ולמאגר כ-`undefined`, וכל זימון שפג היה מוצג "ממתינה למענה"
// בלי שום שגיאה. שלושת אתרי-הקריאה עוטפים ב-try/catch ⇒ הזריקה נוחתת במצב-שגיאה מוצהר.
describe('getHostessScreenParams — פרמטר חסר זורק ונוקב בשמו', () => {
  it('🔴 שם שלא חזר ⇒ שגיאה בעברית שמכילה את שם-הפרמטר', async () => {
    const queues = {}
    // כל השמות חוץ מסף-תוקף-הזימון — בדיוק התרחיש של שורה שנמחקה מהמסד.
    queueTable(queues, 'params', {
      data: allParamRows().filter((r) => r.param_name !== HOSTESS_PARAM_NAMES.inviteValidityHours),
      error: null,
    })
    setupFrom(queues)

    await expect(getHostessScreenParams()).rejects.toThrow(
      'הפרמטר "שעות_תוקף_זימון" חסר בהגדרות המערכת.',
    )
  })

  it('כל השמות חזרו ⇒ מפה מלאה, בלי זריקה', async () => {
    const queues = {}
    queueTable(queues, 'params', { data: allParamRows(), error: null })
    setupFrom(queues)

    const params = await getHostessScreenParams()

    expect(params[HOSTESS_PARAM_NAMES.inviteValidityHours]).toBe('1')
    expect(params[SMART_MATCH_PARAM_NAMES.gateDistanceKm]).toBe('1')
  })
})
