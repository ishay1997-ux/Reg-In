// בדיקות-יחידה ל-`api.js` של מודול 5 — **גם ליחידות הטהורות וגם לעוטפי-Supabase.**
//
// ⚠️ **מצב-הריפו בפועל, נמדד ולא משוער** (`ls src/modules/*/api.test.js`): קיימים שלושה
// קובצי-בדיקה כאלה בלבד — 04 · 05 · 06. ל-02 ול-03 אין קובץ בדיקה ל-`api.js` כלל, כלומר
// הם **שתיקה ולא מוסכמה**. ‏06 בודק יחידות טהורות בלבד; **‏04 בודק ארבעה עוטפי-Supabase**
// (`listStaffingOverview` · `releaseAssignment` · `approveFinalAndRelease` · `getSmartMatchData`)
// דרך בילדר-שרשרתי, וכותרתו אומרת במפורש שהתבנית נכתבה **כדי שהבדיקה הבאה תעתיק ולא תמציא**.
// ⇒ הקובץ הזה מעתיק אותה. הסיבה אינה "כי אפשר": שני המוקשים המוצהרים של הצעד — **הכשל השקט
// בכתיבה** (מעטפת בלי `row` ⇒ זריקה) ו**מבחין שלושת מצבי-הריק** — חיים בהרכבה שבתוך העוטפים,
// לא בשלוש היחידות הטהורות, וללא הבדיקות האלה אפשר היה למחוק אותם והחבילה הייתה נשארת ירוקה.
//
// 🔴 מוק ל-`@/supabaseClient` חובה כאן — לא כדי לבדוק את supabase, אלא כי `./api` מייבא אותו,
// ו-`supabaseClient.js` קורא ל-`createClient(import.meta.env.VITE_SUPABASE_URL, …)` בזמן-טעינה;
// בלי `.env.local` (למשל ב-CI) הקובץ נכשל-בטעינה עוד לפני שבדיקה רצה. אותו דפוס בדיוק ב-
// `04_hostesses/api.test.js` וב-`06_projects/api.test.js`.

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/supabaseClient', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

import { supabase } from '@/supabaseClient'
import { RLS_DENIED_CODE } from '@/lib/apiError'
import { WRITE_FAILURE_SENTENCE } from '@/lib/projectLogistics'
import {
  LOGISTICS_CHANGE_KEYS,
  buildLogisticsChanges,
  assertLogisticsUpdate,
  toRpcError,
  listActiveProjects,
  listLogisticsRows,
  getChecklist,
  updateLogisticsItem,
} from './api'

// ── בילדר-שרשרתי + תור-פר-טבלה — **מועתקים מ-`04_hostesses/api.test.js`** (שם הם מוסברים
// בהרחבה, עוגן-גריפ `makeChain`), ולא נוסח שני. כל מתודת-שרשרת מחזירה את אותו אובייקט כמו
// ב-supabase-js האמיתי, ו-`then` הופך אותו ל-thenable כדי ש-`await …select().in().order()`
// יעבוד גם בלי `.maybeSingle()` בסוף.
function makeChain(result) {
  const builder = {}
  for (const method of ['select', 'eq', 'order', 'in', 'limit']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(result))
  builder.single = vi.fn(() => Promise.resolve(result))
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return builder
}

function setupFrom(queues) {
  supabase.from.mockImplementation((table) => {
    const queue = queues[table]
    if (!queue?.length) {
      throw new Error(`בדיקה לא הכינה תוצאה מתוזמנת לטבלה "${table}"`)
    }
    return makeChain(queue.shift())
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LOGISTICS_CHANGE_KEYS — הרשימה-הלבנה של המיגרציה', () => {
  it('היא בדיוק ארבעת המפתחות של M5-6, ובלי actual_arrival_date', () => {
    // ⚠️ מכוון-נגד: הציפייה כתובה **ליטרלית** ולא נגזרת מהקבוע שמיובא — אחרת הבדיקה
    // הייתה עוברת גם אם מישהו יוסיף מפתח חמישי (הדפוס של 04_hostesses/api.test.js:91).
    expect(LOGISTICS_CHANGE_KEYS).toEqual([
      'item_status',
      'actual_qty',
      'notes',
      'expected_arrival_date',
    ])
    expect(LOGISTICS_CHANGE_KEYS).not.toContain('actual_arrival_date')
  })
})

describe('buildLogisticsChanges — סמנטיקת מפתח-נוכח (AS-8)', () => {
  it('משאירה רק את המפתחות שנשלחו, ומשמיטה undefined', () => {
    const payload = buildLogisticsChanges({
      item_status: 'ordered',
      actual_qty: undefined,
      notes: undefined,
      expected_arrival_date: '2026-09-02',
    })
    expect(payload).toEqual({ item_status: 'ordered', expected_arrival_date: '2026-09-02' })
    expect(Object.keys(payload)).toHaveLength(2)
  })

  it('null נשמר במטען — כך נמחק תאריך-הגעה משוער (G9), ואינו "לא נשלח"', () => {
    const payload = buildLogisticsChanges({ expected_arrival_date: null })
    expect(payload).toEqual({ expected_arrival_date: null })
    expect('expected_arrival_date' in payload).toBe(true)
  })

  it('ערכים falsy לגיטימיים נשמרים — actual_qty=0 והערה שנמחקה', () => {
    // ‏0 ו-'' הם המצב שבו הבדיקה "if (source[key])" הייתה בולעת את השינוי בשקט:
    // הכמות הייתה נשארת על ערכה הקודם והמסך היה מציג "נשמר".
    const payload = buildLogisticsChanges({ actual_qty: 0, notes: '' })
    expect(payload).toEqual({ actual_qty: 0, notes: '' })
  })

  it('זורקת על מפתח זר, בניסוח זהה ל-raise של המיגרציה (AR-9)', () => {
    expect(() => buildLogisticsChanges({ item_status: 'ready', qty: 5 })).toThrowError(
      'שדה לא מוכר בבקשה (qty) — העדכון לא בוצע.',
    )
  })

  it('זורקת גם על actual_arrival_date — השדה שהשרת חותם לבדו (M5-8/㊶)', () => {
    expect(() => buildLogisticsChanges({ actual_arrival_date: '2026-08-26' })).toThrowError(
      'שדה לא מוכר בבקשה (actual_arrival_date) — העדכון לא בוצע.',
    )
  })

  it('מטען ריק מוחזר ריק — הניסוח על "אין מה לשמור" שייך לשרת בלבד', () => {
    expect(buildLogisticsChanges({})).toEqual({})
    expect(buildLogisticsChanges(undefined)).toEqual({})
    expect(buildLogisticsChanges(null)).toEqual({})
  })

  it('אינה משנה את אובייקט-הקלט', () => {
    const input = { item_status: 'ready', actual_qty: undefined }
    buildLogisticsChanges(input)
    // ⚠️ ‏`toStrictEqual` ולא `toEqual`: המוטציה היחידה הריאלית כאן היא **מחיקת המפתח**
    // שערכו `undefined` (זו בדיוק עבודתה של הפונקציה), ו-`toEqual` מתעלם ממפתח כזה —
    // כלומר היה נשאר ירוק על הפגם שהבדיקה נושאת את שמו. נמדד מול המשווה של vitest.
    expect(input).toStrictEqual({ item_status: 'ready', actual_qty: undefined })
    expect('actual_qty' in input).toBe(true)
  })
})

describe('assertLogisticsUpdate — מעטפת G10 והכשל השקט', () => {
  const envelope = {
    row: { project_id: 15, sku: 'B-SAT-LAN', serial_number: 1, item_status: 'ready' },
    project_status: 'ready',
  }

  it('מחזירה את המעטפת **כמות שהיא**, אותה הפניה בדיוק', () => {
    expect(assertLogisticsUpdate(envelope)).toBe(envelope)
  })

  // 🔤 הציפייה היא **הקבוע המיובא** ולא ליטרל — וזו החריגה המכוונת מהכלל שבראש הקובץ:
  // המחרוזת עצמה נעולה-ליטרלית במקום אחד בלבד (`projectLogistics.test.js`, עוגן-גריפ
  // `הערך הוחזר לקודם`), וליטרל שני כאן היה **מתיר** בדיוק את מה שהבדיקה באה למנוע — שני
  // הצדדים יתפצלו בניסוח-מחדש עתידי ואיש לא ישים לב.
  it('זורקת RLS_DENIED סינתטי כשאין שורה בתשובה — חתימת הכתיבה שלא נחתה', () => {
    for (const bad of [undefined, null, {}, { project_status: 'ready' }, { row: null }]) {
      let caught = null
      try {
        assertLogisticsUpdate(bad)
      } catch (error) {
        caught = error
      }
      expect(caught?.code).toBe(RLS_DENIED_CODE)
      expect(caught?.message).toBe(WRITE_FAILURE_SENTENCE)
    }
  })

  it('זורקת גם כששדה row אינו אובייקט (מערך / מחרוזת) — מעטפת שאינה של ה-RPC הזה', () => {
    expect(() => assertLogisticsUpdate({ row: [], project_status: 'ready' })).toThrowError(
      WRITE_FAILURE_SENTENCE,
    )
    expect(() => assertLogisticsUpdate({ row: 'ok', project_status: 'ready' })).toThrowError(
      WRITE_FAILURE_SENTENCE,
    )
  })

  it('זורקת כשחסר project_status — בלעדיו באנר-ההשלמה ⑬ אינו ניתן להכרעה', () => {
    expect(() => assertLogisticsUpdate({ row: envelope.row })).toThrowError(WRITE_FAILURE_SENTENCE)
    expect(() => assertLogisticsUpdate({ row: envelope.row, project_status: '' })).toThrowError(
      WRITE_FAILURE_SENTENCE,
    )
  })
})

describe('toRpcError — הודעת-השרת כפי-שהיא, לעולם לא משוחזרת', () => {
  it('מעבירה את הודעת-השרת העברית כמות שהיא', () => {
    const serverMessage = 'הפרויקט בוטל — לא ניתן לעדכן'
    expect(toRpcError({ message: serverMessage }, 'שמירה נכשלה.').message).toBe(serverMessage)
  })

  it('נופלת ל-fallback רק כשאין הודעת-שרת (תקלת-רשת/timeout)', () => {
    expect(toRpcError(undefined, 'שמירה נכשלה.').message).toBe('שמירה נכשלה.')
    expect(toRpcError({ message: '   ' }, 'שמירה נכשלה.').message).toBe('שמירה נכשלה.')
  })

  it('משמרת את קוד-השגיאה ואת השגיאה המקורית כ-cause', () => {
    const original = { code: 'P0001', message: 'כמות בפועל אינה יכולה להיות שלילית.' }
    const wrapped = toRpcError(original, 'שמירה נכשלה.')
    expect(wrapped.code).toBe('P0001')
    expect(wrapped.cause).toBe(original)
    expect(wrapped).toBeInstanceOf(Error)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// עוטפי-Supabase — ההרכבה עצמה, שהיא מקום-המגורים של שני מוקשי-הצעד
// ═════════════════════════════════════════════════════════════════════════════

describe('updateLogisticsItem — הכותב היחיד של המודול', () => {
  const envelope = {
    row: { project_id: 15, sku: 'B-SAT-LAN', serial_number: 1, item_status: 'ready' },
    project_status: 'ready',
  }

  it('שולחת בדיוק את ארבעת שמות-הפרמטרים של המיגרציה, ומחזירה את המעטפת כמות שהיא', async () => {
    supabase.rpc.mockResolvedValue({ data: envelope, error: null })

    const result = await updateLogisticsItem({
      projectId: 15,
      sku: 'B-SAT-LAN',
      serialNumber: 1,
      changes: { item_status: 'ready', notes: undefined },
    })

    expect(result).toBe(envelope)
    // ⚠️ שמות-הפרמטרים כתובים **ליטרלית**: הם חוזה-בייט מול חתימת ה-RPC
    // (`20260826002447_module5_checklist_rpc.sql`), ושם שגוי כאן נכשל רק בזמן-ריצה מול המסד.
    expect(supabase.rpc).toHaveBeenCalledWith('update_logistics_item', {
      p_project_id: 15,
      p_sku: 'B-SAT-LAN',
      p_serial_number: 1,
      p_changes: { item_status: 'ready' },
    })
  })

  // 🚨 **הבדיקה שמצמידה את מוקש-העל של הצעד.** בלעדיה אפשר להחליף את
  // `assertLogisticsUpdate(data)` ב-`return data`, והמסך היה מציג "נשמר" על כתיבה שלא נחתה.
  it('זורקת RLS_DENIED כשהתשובה מוצלחת אך חסרת שורה — הכשל השקט של הכתיבה', async () => {
    supabase.rpc.mockResolvedValue({ data: { project_status: 'ready' }, error: null })

    await expect(
      updateLogisticsItem({ projectId: 15, sku: 'B-SAT-LAN', serialNumber: 1, changes: {} }),
    ).rejects.toMatchObject({ code: RLS_DENIED_CODE, message: WRITE_FAILURE_SENTENCE })
  })

  it('מעבירה את הודעת ה-raise של השרת בייט-בבייט, בלי ניסוח-לקוח', async () => {
    const serverMessage = 'הפרויקט בוטל — לא ניתן לעדכן'
    supabase.rpc.mockResolvedValue({ data: null, error: { message: serverMessage } })

    await expect(
      updateLogisticsItem({
        projectId: 15,
        sku: 'B-SAT-LAN',
        serialNumber: 1,
        changes: { notes: 'x' },
      }),
    ).rejects.toThrowError(serverMessage)
  })

  it('מפתח זר נעצר **לפני** סבב-הרשת — הבקשה לא יוצאת כלל', async () => {
    await expect(
      updateLogisticsItem({
        projectId: 15,
        sku: 'B-SAT-LAN',
        serialNumber: 1,
        changes: { qty: 5 },
      }),
    ).rejects.toThrowError('שדה לא מוכר בבקשה (qty) — העדכון לא בוצע.')
    expect(supabase.rpc).not.toHaveBeenCalled()
  })
})

describe('listActiveProjects / listLogisticsRows — חוזי-השאילתה', () => {
  it('מסננת על שלושת הסטטוסים הפעילים, קוראת customer_name מ-projects ולא מצרפת ל-customers', async () => {
    setupFrom({ projects: [{ data: [], error: null }] })

    await listActiveProjects()

    const chain = supabase.from.mock.results[0].value
    // ⚠️ מכוון-נגד: הרשימה ליטרלית ולא נגזרת מ-`ACTIVE_PROJECT_STATUSES` — אחרת רגרסיה
    // בקבוע עצמו הייתה משנה את שני הצדדים יחד (הדפוס של `04_hostesses/api.test.js`).
    expect(chain.in).toHaveBeenCalledWith('project_status', ['not_started', 'in_progress', 'ready'])
    const [selectString] = chain.select.mock.calls[0]
    expect(selectString).toContain('customer_name')
    // 🔴 צירוף ל-`customers` היה מחזיר `null` בלי שגיאה למנהלת-הלוגיסטיקה החסומה שם.
    expect(selectString).not.toContain('customers(')
  })

  it('ממיינת sku ואז serial_number — החלק השלישי במפתח הראשי', async () => {
    setupFrom({ logistics: [{ data: [], error: null }] })

    await listLogisticsRows([15])

    const chain = supabase.from.mock.results[0].value
    expect(chain.order.mock.calls.map(([column]) => column)).toEqual(['sku', 'serial_number'])
  })

  it('רשימת-פרויקטים ריקה אינה מייצרת סבב-רשת כלל', async () => {
    setupFrom({})
    expect(await listLogisticsRows([])).toEqual([])
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe('getChecklist — הרענון בפתיחה (㊲) ומבחין שלושת מצבי-הריק (§⑨)', () => {
  const project = { project_id: 15, project_status: 'in_progress', quote_id: 7 }

  it('יש שורות ⇒ המבחין אינו נשאל בכלל, וההצעה לא נקראת', async () => {
    setupFrom({
      projects: [{ data: project, error: null }],
      logistics: [{ data: [{ sku: 'B-SAT-LAN', serial_number: 1 }], error: null }],
    })

    const result = await getChecklist(15)

    expect(result.rows).toHaveLength(1)
    expect(result.quoteProductLines).toBeUndefined()
    expect(supabase.from).not.toHaveBeenCalledWith('quotes')
  })

  // 🚨 שלוש הבדיקות הבאות הן שלושת הענפים של כרטיס-המסך §④ — ובלעדיהן הדיאלוג היה מצייר
  // "לא הוזמנו מוצרים לאירוע הזה" על פרויקט חסום או שבור.
  it('ריק + ההצעה אינה קריאה ⇒ null — ענף חוסר-ההרשאה', async () => {
    setupFrom({
      projects: [{ data: project, error: null }],
      logistics: [{ data: [], error: null }],
      quotes: [{ data: null, error: null }],
      products: [{ data: [], error: null }],
    })

    expect((await getChecklist(15)).quoteProductLines).toBeNull()
  })

  it('ריק + להצעה שורות-מוצר ⇒ מספר > 0 — ריק שבור', async () => {
    setupFrom({
      projects: [{ data: project, error: null }],
      logistics: [{ data: [], error: null }],
      quotes: [
        {
          data: { quote_id: 7, quote_services: [{ sku: 'B-SAT-LAN' }, { sku: 'S-HOST' }] },
          error: null,
        },
      ],
      products: [
        {
          data: [
            { sku: 'B-SAT-LAN', category: 'physical' },
            { sku: 'S-HOST', category: 'hostess' },
          ],
          error: null,
        },
      ],
    })

    expect((await getChecklist(15)).quoteProductLines).toBe(1)
  })

  it('ריק + ההצעה כללה דיילות בלבד ⇒ 0 — ריק כדין', async () => {
    setupFrom({
      projects: [{ data: project, error: null }],
      logistics: [{ data: [], error: null }],
      quotes: [{ data: { quote_id: 7, quote_services: [{ sku: 'S-HOST' }] }, error: null }],
      products: [{ data: [{ sku: 'S-HOST', category: 'hostess' }], error: null }],
    })

    expect((await getChecklist(15)).quoteProductLines).toBe(0)
  })

  it('בלי projectId — אין קריאה, ושלושת השדות חוזרים ריקים', async () => {
    setupFrom({})
    expect(await getChecklist(null)).toEqual({
      project: null,
      rows: [],
      quoteProductLines: undefined,
    })
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
