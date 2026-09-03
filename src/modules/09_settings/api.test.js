// בדיקות שכבת ה-API של מודול 9 (צעד 2.5) — מוקד: שלוש ההתנהגויות שהמדריך מציין כ"מה ייחשב
// עובד" (V-9 + src/CLAUDE.md): שמירה שנחסמה במסד לעולם לא מוצגת כ"נשמר", כתיבה סדרתית נעצרת
// בכשל הראשון, וקבוצה מעורבת-בעלות לא נשלחת בכלל — לפני שאף `update` יוצא.
//
// דפוס-המוקינג: "בילדר" שרשרתי (`makeChain`) + תור-תוצאות-פר-טבלה (`queueTable`/`setupFrom`),
// מועתק מ-`04_hostesses/api.test.js` (התקדים היחיד בריפו לבדיקת-יחידה שממוקקת שרשרת-שאילתות
// של Supabase — מוסבר שם בהרחבה). `supabase.auth.getSession` ממוקק בנפרד עבור שני ה-endpoints
// של `notification_preferences`, שקוראים למי-אני מה-session ולא מקבלים email כארגומנט.

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}))

import { supabase } from '@/supabaseClient'
import {
  PARAMS_ERROR_CODE,
  countAttendanceRows,
  getNotificationPreferences,
  listBelowMinWage,
  listMyParams,
  listParams,
  saveNotificationPreferences,
  updateParams,
} from './api'

// ── עוזר-מוקינג (זהה ל-04_hostesses/api.test.js) ──────────────────────────────────
function makeChain(result) {
  const builder = {}
  // `range` נוסף 03/09/2026 — `fetchAll` (תקרת-1,000) מדפדף דרכו; המוק מחזיר עמוד יחיד.
  for (const method of [
    'select',
    'eq',
    'order',
    'in',
    'limit',
    'range',
    'update',
    'insert',
    'upsert',
  ]) {
    builder[method] = vi.fn(() => builder)
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(result))
  builder.single = vi.fn(() => Promise.resolve(result))
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return builder
}

function queueTable(queues, table, result) {
  queues[table] = queues[table] ?? []
  queues[table].push(result)
}

function setupFrom(queues) {
  supabase.from.mockImplementation((table) => {
    const queue = queues[table]
    if (!queue || queue.length === 0) {
      throw new Error(`בדיקה לא הכינה תוצאה מתוזמנת לטבלה "${table}"`)
    }
    return makeChain(queue.shift())
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════════
// listParams / listMyParams
// ═══════════════════════════════════════════════════════════════════════════════
describe('listParams', () => {
  it('שולפת את כל השורות, כולל owner_role_id, ומחזירה מערך ריק בלי data', async () => {
    const queues = {}
    queueTable(queues, 'params', { data: null, error: null })
    setupFrom(queues)

    const result = await listParams()
    expect(result).toEqual([])
    expect(supabase.from).toHaveBeenCalledWith('params')
  })

  it('מחזירה את השורות כפי-שהן', async () => {
    const rows = [
      { param_name: 'אחוז_מעמ', param_value: '17', owner_role_id: 1 },
      { param_name: 'סף_שביעות_רצון', param_value: '3', owner_role_id: 4 },
    ]
    const queues = {}
    queueTable(queues, 'params', { data: rows, error: null })
    setupFrom(queues)

    expect(await listParams()).toEqual(rows)
  })
})

describe('listMyParams — שאילתה עם eq בצד השרת, לא "הכול ואז סינון" (§4.4)', () => {
  it('שולחת eq(owner_role_id, roleId) ולא מחזירה שורות של תפקיד אחר', async () => {
    const chain = makeChain({
      data: [{ param_name: 'סכום_נסיעות_למשמרת', owner_role_id: 4 }],
      error: null,
    })
    supabase.from.mockReturnValue(chain)

    const result = await listMyParams(4)

    expect(supabase.from).toHaveBeenCalledWith('params')
    expect(chain.eq).toHaveBeenCalledWith('owner_role_id', 4)
    expect(result).toEqual([{ param_name: 'סכום_נסיעות_למשמרת', owner_role_id: 4 }])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// updateParams — V-9: מנעול-הבעלות-המעורבת, ועצירה בכשל הראשון
// ═══════════════════════════════════════════════════════════════════════════════
describe('updateParams', () => {
  it('שתי שורות תקינות — נכתבות שתיהן ברצף, ומוחזרים שני השמות', async () => {
    const queues = {}
    queueTable(queues, 'params', { data: [{ param_name: 'א' }], error: null })
    queueTable(queues, 'params', { data: [{ param_name: 'ב' }], error: null })
    setupFrom(queues)

    const result = await updateParams(
      [
        { name: 'א', value: '1', ownerRoleId: 4 },
        { name: 'ב', value: '2', ownerRoleId: 4 },
      ],
      { roleId: 4, canEditAll: false },
    )

    expect(result).toEqual(['א', 'ב'])
    expect(supabase.from).toHaveBeenCalledTimes(2)
  })

  it('כתיבה סדרתית נעצרת בכשל הראשון — השורה השנייה נכתבת, השלישית לא, והשגיאה נוקבת בשם השנייה', async () => {
    const queues = {}
    queueTable(queues, 'params', { data: [{ param_name: 'א' }], error: null }) // שורה 1: הצליחה
    queueTable(queues, 'params', { data: [], error: null }) // שורה 2: 0 שורות — נחסמה
    setupFrom(queues)

    await expect(
      updateParams(
        [
          { name: 'א', value: '1', ownerRoleId: 4 },
          { name: 'ב', value: '2', ownerRoleId: 4 },
          { name: 'ג', value: '3', ownerRoleId: 4 },
        ],
        { roleId: 4, canEditAll: false },
      ),
    ).rejects.toMatchObject({ paramName: 'ב' })

    // שורה 3 לא נגעה ב-Supabase בכלל — הלולאה נעצרה אחרי שורה 2.
    expect(supabase.from).toHaveBeenCalledTimes(2)
  })

  it('0 שורות ⇒ זורקת, לעולם לא "נשמר" (הכשל השקט המרכזי, §4.3)', async () => {
    const queues = {}
    queueTable(queues, 'params', { data: [], error: null })
    setupFrom(queues)

    await expect(
      updateParams([{ name: 'אחוז_מעמ', value: '18', ownerRoleId: 1 }], {
        roleId: 1,
        canEditAll: false,
      }),
    ).rejects.toThrow()
  })

  it('0 שורות עם error מפורש (למשל שם-פרמטר לא קיים) — גם היא זורקת', async () => {
    const queues = {}
    queueTable(queues, 'params', { data: null, error: { code: '42P01', message: 'boom' } })
    setupFrom(queues)

    await expect(
      updateParams([{ name: 'לא_קיים', value: '1', ownerRoleId: 1 }], {
        roleId: 1,
        canEditAll: false,
      }),
    ).rejects.toThrow()
  })

  it('V-9: קבוצה עם שורה שאינה בבעלות הקורא ואינה בהרשאת עריכה-כוללת — מסורבת כולה, ואף update לא יוצא', async () => {
    await expect(
      updateParams(
        [
          { name: 'שלי', value: '1', ownerRoleId: 4 },
          { name: 'לא-שלי', value: '2', ownerRoleId: 7 },
        ],
        { roleId: 4, canEditAll: false },
      ),
    ).rejects.toThrow(/לא-שלי/)

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('canEditAll=true (מחזיקת עריכה על "הגדרות מערכת") — עוקפת את בדיקת-הבעלות', async () => {
    const queues = {}
    queueTable(queues, 'params', { data: [{ param_name: 'לא-שלה' }], error: null })
    setupFrom(queues)

    const result = await updateParams([{ name: 'לא-שלה', value: '1', ownerRoleId: 999 }], {
      roleId: 1,
      canEditAll: true,
    })
    expect(result).toEqual(['לא-שלה'])
  })

  it('אצווה ריקה — לא נוגעת ב-Supabase ומחזירה מערך ריק', async () => {
    expect(await updateParams([], { roleId: 1, canEditAll: false })).toEqual([])
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// listBelowMinWage — RPC, 42501 ⇒ קוד-שגיאה טיפוסי 'blocked'
// ═══════════════════════════════════════════════════════════════════════════════
describe('listBelowMinWage', () => {
  it('מחזירה את שורות ה-RPC כפי-שהן', async () => {
    const rows = [{ hostess_id: 5, full_name: 'נועה', hourly_rate: 32 }]
    supabase.rpc.mockResolvedValue({ data: rows, error: null })

    expect(await listBelowMinWage()).toEqual(rows)
    expect(supabase.rpc).toHaveBeenCalledWith('list_hostesses_below_min_wage', {})
  })

  it('רף לתצוגה-מקדימה (מיגרציה D): מספר סופי עובר כ-p_threshold, לא-מספר לא עובר', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null })
    await listBelowMinWage(40)
    expect(supabase.rpc).toHaveBeenLastCalledWith('list_hostesses_below_min_wage', {
      p_threshold: 40,
    })
    await listBelowMinWage('40')
    expect(supabase.rpc).toHaveBeenLastCalledWith('list_hostesses_below_min_wage', {})
    await listBelowMinWage(NaN)
    expect(supabase.rpc).toHaveBeenLastCalledWith('list_hostesses_below_min_wage', {})
  })

  it('42501 (assert_module_permission) ⇒ error.code === "blocked", כדי שה-UI יסתיר ולא יאדים', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } })

    await expect(listBelowMinWage()).rejects.toMatchObject({ code: PARAMS_ERROR_CODE.BLOCKED })
  })

  it('שגיאה אחרת (לא 42501) נשארת שגיאה רגילה, לא "blocked"', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { code: '08006', message: 'net' } })

    const error = await listBelowMinWage().catch((e) => e)
    expect(error).toBeInstanceOf(Error)
    expect(error.code).not.toBe(PARAMS_ERROR_CODE.BLOCKED)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// countAttendanceRows — A-10
// ═══════════════════════════════════════════════════════════════════════════════
describe('countAttendanceRows', () => {
  it('סופרת סה"כ שורות ושורות עם attendance_status לא-null, בנפרד', async () => {
    const chain = makeChain({
      data: [
        { attendance_status: 'present' },
        { attendance_status: null },
        { attendance_status: null },
      ],
      error: null,
    })
    supabase.from.mockReturnValue(chain)

    expect(await countAttendanceRows()).toEqual({ total: 3, withAttendance: 1 })
  })

  it('טבלה ריקה — אפס ואפס, לא שגיאה', async () => {
    const chain = makeChain({ data: [], error: null })
    supabase.from.mockReturnValue(chain)

    expect(await countAttendanceRows()).toEqual({ total: 0, withAttendance: 0 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// notification_preferences — self-only, "שורה חסירה = שתי ההעדפות כבויות" (§2.8)
// ═══════════════════════════════════════════════════════════════════════════════
function mockSession(email) {
  supabase.auth.getSession.mockResolvedValue({
    data: { session: email ? { user: { email } } : null },
    error: null,
  })
}

describe('getNotificationPreferences', () => {
  it('שורה קיימת — ממופה לשתי ההעדפות', async () => {
    mockSession('noa@regin.co.il')
    const chain = makeChain({
      data: { email_new_projects: true, sms_last_minute: false },
      error: null,
    })
    supabase.from.mockReturnValue(chain)

    const result = await getNotificationPreferences()
    expect(result).toEqual({ emailNewProjects: true, smsLastMinute: false })
    expect(chain.eq).toHaveBeenCalledWith('email', 'noa@regin.co.il')
  })

  it('אין שורה (משתמש שמעולם לא שמר) — שתי ההעדפות false, לא שגיאה', async () => {
    mockSession('new-user@regin.co.il')
    const chain = makeChain({ data: null, error: null })
    supabase.from.mockReturnValue(chain)

    expect(await getNotificationPreferences()).toEqual({
      emailNewProjects: false,
      smsLastMinute: false,
    })
  })
})

describe('saveNotificationPreferences', () => {
  it('upsert עם .select() — מחזירה את מה שנשמר בפועל', async () => {
    mockSession('noa@regin.co.il')
    const chain = makeChain({
      data: [{ email_new_projects: true, sms_last_minute: false }],
      error: null,
    })
    supabase.from.mockReturnValue(chain)

    const result = await saveNotificationPreferences({
      emailNewProjects: true,
      smsLastMinute: false,
    })

    expect(result).toEqual({ emailNewProjects: true, smsLastMinute: false })
    expect(chain.upsert).toHaveBeenCalledWith(
      { email: 'noa@regin.co.il', email_new_projects: true, sms_last_minute: false },
      { onConflict: 'email' },
    )
  })

  it('0 שורות (RLS חסם) ⇒ זורקת, לעולם לא "נשמר"', async () => {
    mockSession('noa@regin.co.il')
    const chain = makeChain({ data: [], error: null })
    supabase.from.mockReturnValue(chain)

    await expect(
      saveNotificationPreferences({ emailNewProjects: true, smsLastMinute: false }),
    ).rejects.toThrow()
  })

  it('אין session מחובר ⇒ זורקת לפני שנוגעת ב-Supabase', async () => {
    mockSession(null)

    await expect(
      saveNotificationPreferences({ emailNewProjects: true, smsLastMinute: false }),
    ).rejects.toThrow()
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
