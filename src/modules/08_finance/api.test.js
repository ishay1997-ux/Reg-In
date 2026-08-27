// בדיקות שכבת ה-API של מודול 8 (צעד 2.3).
//
// 🔴 **הצעד הזה חורג במכוון מדפוס-הבית של `api.test.js`**, ולא בטעות: בשאר המודולים עוטפי-
// Supabase דקים אינם נבדקים ביחידה (`06_projects/api.test.js` מצהיר על כך בראשו). כאן
// **צעד 2.3 עצמו מורה אחרת** — *"unit tests with mocked client: every write path checks
// row-count/RPC error; the mail-fail path leaves `invoice_sent` untouched (P1) and salary
// `send_status='failed'` with resend available (P4)"*. הסיבה גלויה: זו לא שכבת-קריאות, אלא
// **סדר-פעולות** שבו טעות שקטה שולחת חשבונית ולא מסמנת, או מסמנת בלי לשלוח.
//
// 🔴 מוק ל-`@/supabaseClient` חובה — `./api` מייבא אותו, ו-`supabaseClient.js` קורא
// ל-`createClient(import.meta.env.VITE_SUPABASE_URL, …)` בזמן-טעינה; בלי `.env.local` (למשל
// ב-CI) הקובץ נכשל-בטעינה לפני שבדיקה רצה. אותו דפוס כמו ב-`04_hostesses`/`06_projects`.
//
// 🔑 **המספרים בקובץ הזה מוקלדים מהרגיסטרים ולא מחושבים מהקוד-הנבדק** (מדריך-המיקרו §4.3):
// ‏598.00 / 620.60 / 292.60 מ-`data-set.md §5`; שתי שורות-הנושא מהמוקאפים המאושרים
// (`05_mail_invoice_approved.html:119`, `06_mail_salary_approved.html:121`, נעולות ב-N-1);
// גופי-התבניות מוקלדים בייט-בבייט מזרע ה-`params` (`20260723112000`).
//
// ⚠️ **מה הבדיקות האלה אינן מוכיחות, ונאמר במפורש:** אף אחת מהן אינה נוגעת ב-Supabase אמיתי,
// ולכן הן מוכיחות **סדר-פעולות וחוזה**, לא הרשאות ולא RLS. שלושת אלה נבדקים חי בצעדים 4.4/5.1.

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn(),
  getEmailTemplate: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/supabaseClient', () => ({
  supabase: {
    rpc: (...args) => mocks.rpc(...args),
    from: (...args) => mocks.from(...args),
    storage: { from: (...args) => mocks.storageFrom(...args) },
  },
}))

vi.mock('@/api/email', () => ({
  getEmailTemplate: (...args) => mocks.getEmailTemplate(...args),
  sendEmail: (...args) => mocks.sendEmail(...args),
}))

import {
  ACCOUNTANT_EMAIL_PARAM,
  CANCELLATION_FEE_ACTIONS,
  FINANCE_ALLOWED_MIME,
  FINANCE_MAX_BYTES,
  FINANCE_TEMPLATE_NAMES,
  INVOICE_FILE_REQUIRED_NOTE,
  XLSX_MIME,
  archiveProject,
  buildInvoiceEmailPayload,
  buildSalaryReportEmailPayload,
  deleteFinanceFile,
  downloadFinanceFileAsBase64,
  fileNameOf,
  generateAndSendSalaryReport,
  getBillingContact,
  getCancellationFeeProposal,
  getFinanceDetail,
  getFinanceFileSignedUrl,
  getSalaryReportLines,
  invoiceEmailSubject,
  listFinanceOverview,
  listSalaryReports,
  recordFeedback,
  recordPayment,
  recordWriteOff,
  resendSalaryReportMail,
  resolveCancellationFee,
  rpcErrorMessage,
  salaryReportEmailSubject,
  sendInvoiceAndRecord,
  uploadInvoiceFile,
  validateInvoiceFile,
} from './api'

// ── כלי-עזר למוק ─────────────────────────────────────────────────────────────

// בונה-שאילתה מדומה: כל חוליה מחזירה את עצמה, והאובייקט עצמו thenable כדי ש-`await`
// על שרשרת שמסתיימת ב-`.order(...)` יעבוד בדיוק כמו מול PostgREST.
function queryStub(result) {
  const stub = {
    select: () => stub,
    eq: () => stub,
    in: () => stub,
    order: () => stub,
    maybeSingle: () => Promise.resolve(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return stub
}

const uploadMock = vi.fn()
const removeMock = vi.fn()
const downloadMock = vi.fn()

function resetStorage() {
  uploadMock.mockReset().mockResolvedValue({ error: null })
  removeMock.mockReset().mockResolvedValue({ error: null })
  downloadMock.mockReset()
  mocks.storageFrom.mockReset().mockReturnValue({
    upload: (...args) => uploadMock(...args),
    remove: (...args) => removeMock(...args),
    download: (...args) => downloadMock(...args),
    createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'https://x/y' }, error: null }),
  })
}

// קובץ מדומה עם `arrayBuffer` — `fileToBase64` קורא לו, ו-`File` של jsdom אינו נדרש כאן.
function fakeFile({ name = 'Invoice_4127.pdf', type = 'application/pdf', size = 1000 } = {}) {
  return {
    name,
    type,
    size,
    arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
  }
}

// גופי שתי התבניות — **מוקלדים בייט-בבייט מזרע ה-params**, כדי שהבדיקה תיפול אם התבנית
// שבמסד תשתנה בלי שהקוד יעודכן (אותו דפוס כמו `quotes.test.js`/`shiftEmails.test.js`).
const INVOICE_TEMPLATE = `שלום [שם_לקוח_חברה],
מצורפת בזאת חשבונית מס/קבלה עבור השירותים שסופקו באירוע '[שם_פרויקט]'.
אנו מודים לכם על שיתוף הפעולה.
בברכה,
מחלקת כספים, REG-IN.`

const SALARY_TEMPLATE = `שלום לצוות הנהלת חשבונות / [שם_רואה_חשבון],
מצורף בזאת קובץ אקסל המרכז את שעות העבודה של צוות הדיילות של חברת REG-IN עבור חודש [חודש_דיווח_ושנה].
הקובץ כולל פירוט תעריפים, שעות בפועל ובונוסים, לאחר שעבר בקרה ואישור במערכת. בכל שאלה או בירור בנוגע לנתונים, ניתן לפנות למחלקת הכספים.
בברכה,
מערכת REG-IN.`

const CUSTOMER = { customer_id: 4, company_name: 'עיריית חדרה', email: 'ishay1997@gmail.com' }
const PROJECT = { project_id: 13, event_name: 'פסטיבל קיץ עירוני' }

// מטען-ההפקה כפי ש-`generate_salary_report` מחזירה — חמש שורות אוגוסט-2026 של
// `data-set.md §5`, בווריאנט ה20 (נסיעות 22.60): אפרת 292.60 וסה"כ 620.60.
function augustPayload(overrides = {}) {
  return {
    ok: true,
    report_id: 7,
    period: '2026-08-01',
    total_amount: 620.6,
    line_count: 5,
    lines: [
      {
        hostess_id: 1,
        hostess_name: 'אפרת דהן',
        id_number: '301554333',
        source_project_id: 12,
        line_basis: 'actual',
        hours: 6,
        rate: 45,
        bonus: null,
        travel: 22.6,
        line_total: 292.6,
        bank_name: 'הפועלים',
        bank_branch: '601',
        bank_account: '2047199',
        show_in_file: true,
      },
      {
        hostess_id: 2,
        hostess_name: 'אורלי שני',
        id_number: '301550224',
        source_project_id: 14,
        line_basis: 'cancellation_compensation',
        hours: 4,
        rate: 43,
        bonus: null,
        travel: null,
        line_total: 86,
        bank_name: 'דיסקונט',
        bank_branch: '045',
        bank_account: '8732016',
        show_in_file: true,
      },
      {
        hostess_id: 3,
        hostess_name: 'רחל לוי',
        id_number: '301551594',
        source_project_id: 14,
        line_basis: 'cancellation_compensation',
        hours: 4,
        rate: 40,
        bonus: null,
        travel: null,
        line_total: 80,
        bank_name: 'מזרחי-טפחות',
        bank_branch: '512',
        bank_account: '4491067',
        show_in_file: true,
      },
      {
        hostess_id: 4,
        hostess_name: 'ליאת פרץ',
        id_number: '301552964',
        source_project_id: 14,
        line_basis: 'cancellation_compensation',
        hours: 4,
        rate: 39,
        bonus: null,
        travel: null,
        line_total: 78,
        bank_name: 'לאומי',
        bank_branch: '782',
        bank_account: '1184538',
        show_in_file: true,
      },
      {
        hostess_id: 5,
        hostess_name: 'שרון כהן',
        id_number: '301557070',
        source_project_id: 14,
        line_basis: 'cancellation_compensation',
        hours: 4,
        rate: 42,
        bonus: null,
        travel: null,
        line_total: 84,
        bank_name: 'מזרחי-טפחות',
        bank_branch: '512',
        bank_account: '44910611',
        show_in_file: true,
      },
    ],
    ...overrides,
  }
}

// ניתוב ה-RPC לפי שם, כדי שבדיקה תוכל להצהיר רק על מה שמעניין אותה.
function routeRpc(map) {
  mocks.rpc.mockImplementation((fn) => {
    if (!(fn in map)) throw new Error(`RPC לא צפוי בבדיקה: ${fn}`)
    const value = map[fn]
    return Promise.resolve(typeof value === 'function' ? value() : value)
  })
}

beforeEach(() => {
  mocks.rpc.mockReset()
  mocks.from.mockReset()
  mocks.getEmailTemplate.mockReset()
  mocks.sendEmail.mockReset().mockResolvedValue({ logFailed: false })
  resetStorage()
})

// ── לוגיקה טהורה ─────────────────────────────────────────────────────────────

describe('rpcErrorMessage', () => {
  it('מציגה את הודעת-השרת כפי-שהיא — הודעות ה-P0001 של מ8 נוסחו כדי שהמנהלת תקרא אותן', () => {
    const message = 'התיק נעול — הפרויקט כבר הועבר לארכיון ואי אפשר לשנות בו נתונים כספיים.'
    expect(rpcErrorMessage({ message }, 'הארכוב נכשל.')).toBe(message)
  })

  it('נופלת לניסוח כללי כשאין הודעה (תקלת-רשת/פסק-זמן)', () => {
    expect(rpcErrorMessage({}, 'הארכוב נכשל.')).toBe('הארכוב נכשל.')
    expect(rpcErrorMessage({ message: '   ' }, 'הארכוב נכשל.')).toBe('הארכוב נכשל.')
  })
})

describe('שורות-הנושא (N-1 — נעולות)', () => {
  it('M1 — כנוסח המוקאפ המאושר', () => {
    expect(invoiceEmailSubject(PROJECT)).toBe('חשבונית מס/קבלה מ-REG-IN — פסטיבל קיץ עירוני')
  })

  it('M2 — כנוסח המוקאפ המאושר', () => {
    expect(salaryReportEmailSubject('אוגוסט 2026')).toBe('דוח שכר דיילות — אוגוסט 2026')
  })
})

describe('validateInvoiceFile', () => {
  it('בלי קובץ — הנוסח הנעול של §3.7, לא הודעה שהומצאה כאן', () => {
    expect(validateInvoiceFile(null)).toBe(INVOICE_FILE_REQUIRED_NOTE)
    expect(INVOICE_FILE_REQUIRED_NOTE).toBe(
      'חסום: יש לבחור קובץ — שליחה בלי חשבונית אינה אפשרית (כרטיס-P1).',
    )
  })

  it('סוג לא-נתמך נחסם לפני ההעלאה — הבאקט מתיר PDF/JPEG/PNG בלבד', () => {
    expect(validateInvoiceFile(fakeFile({ type: XLSX_MIME }))).toContain('סוג הקובץ אינו נתמך')
  })

  it('קובץ מעל תקרת-הבאקט נחסם', () => {
    expect(validateInvoiceFile(fakeFile({ size: 10 * 1024 * 1024 + 1 }))).toContain('גדול מדי')
  })

  it('קובץ תקין עובר', () => {
    expect(validateInvoiceFile(fakeFile())).toBe('')
  })
})

describe('אחסון — bucket finance', () => {
  it('מגבלות הבאקט זהות-ערך למה שנמדד חי על storage.buckets', () => {
    expect(FINANCE_MAX_BYTES).toBe(10485760)
    expect(FINANCE_ALLOWED_MIME).toEqual(['application/pdf', 'image/jpeg', 'image/png'])
  })

  it('uploadInvoiceFile מנקה את שם-הקובץ ומקדימה חותמת-זמן תחת תיקיית-הפרויקט', async () => {
    const { path } = await uploadInvoiceFile(13, fakeFile({ name: 'חשבונית סופית.pdf' }))
    expect(path).toMatch(/^13\/\d+_[\w.-]+\.pdf$/)
    expect(uploadMock).toHaveBeenCalledTimes(1)
  })

  it('uploadInvoiceFile נחסמת על סוג לא-נתמך לפני שהיא נוגעת באחסון', async () => {
    await expect(uploadInvoiceFile(13, fakeFile({ type: XLSX_MIME }))).rejects.toThrow(
      'סוג הקובץ אינו נתמך',
    )
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('deleteFinanceFile בולעת כשל-מחיקה — קובץ יתום אינו סיבה להסתיר את הכשל המקורי', async () => {
    removeMock.mockRejectedValue(new Error('storage down'))
    await expect(deleteFinanceFile('13/1_a.pdf')).resolves.toBeUndefined()
    await expect(deleteFinanceFile(null)).resolves.toBeUndefined()
  })

  it('downloadFinanceFileAsBase64 זורקת כשההורדה נכשלה ואינה מחזירה מחרוזת ריקה', async () => {
    downloadMock.mockResolvedValue({ data: null, error: { message: 'not found' } })
    await expect(downloadFinanceFileAsBase64('x')).rejects.toThrow('הורדת הקובץ מהאחסון נכשלה.')
  })

  it('getFinanceFileSignedUrl מחזירה קישור זמני לכפתור-הורדה במסך', async () => {
    await expect(getFinanceFileSignedUrl('13/1_a.pdf')).resolves.toBe('https://x/y')
  })
})

describe('fileNameOf', () => {
  it('חותכת את מפתח-האחסון ואת תחילית מזהה-הדוח', () => {
    expect(fileNameOf('salary_reports/7_08_2026_Payroll_Report.xlsx')).toBe(
      '08_2026_Payroll_Report.xlsx',
    )
  })
})

describe('buildInvoiceEmailPayload', () => {
  it('ממלאת את שני ה-placeholders של התבנית החיה ואינה משאירה סוגריים', () => {
    const payload = buildInvoiceEmailPayload({
      template: INVOICE_TEMPLATE,
      customer: CUSTOMER,
      project: PROJECT,
      fileName: 'Invoice_4127.pdf',
      attachmentBase64: 'AQID',
    })
    expect(payload.to).toBe('ishay1997@gmail.com')
    expect(payload.subject).toBe('חשבונית מס/קבלה מ-REG-IN — פסטיבל קיץ עירוני')
    expect(payload.body).toContain('שלום עיריית חדרה,')
    expect(payload.body).toContain("באירוע 'פסטיבל קיץ עירוני'")
    expect(payload.body).not.toContain('[שם_')
    expect(payload.filename).toBe('Invoice_4127.pdf')
    expect(payload.pdf_base64).toBe('AQID')
  })

  it('בלי צרופה מחזירה null — רצפת-המצורף של המנוע נשארת דלוקה לחשבונית', () => {
    expect(
      buildInvoiceEmailPayload({
        template: INVOICE_TEMPLATE,
        customer: CUSTOMER,
        project: PROJECT,
        fileName: 'Invoice_4127.pdf',
      }),
    ).toBeNull()
  })

  it('בלי מייל-לחיוב מחזירה null ולא מייל בלי נמען', () => {
    expect(
      buildInvoiceEmailPayload({
        template: INVOICE_TEMPLATE,
        customer: { ...CUSTOMER, email: '' },
        project: PROJECT,
        fileName: 'a.pdf',
        attachmentBase64: 'AQID',
      }),
    ).toBeNull()
  })
})

describe('buildSalaryReportEmailPayload', () => {
  it('משחזרת את גוף-M2 של data-set §6 כששם רו"ח מסופק', () => {
    const payload = buildSalaryReportEmailPayload({
      template: SALARY_TEMPLATE,
      recipient: 'office@cpa-firm.co.il',
      periodLabel: 'אוגוסט 2026',
      accountantName: 'רו"ח דורון אשכנזי',
      fileName: '08_2026_Payroll_Report.xlsx',
      attachmentBase64: 'AQID',
    })
    expect(payload.to).toBe('office@cpa-firm.co.il')
    expect(payload.subject).toBe('דוח שכר דיילות — אוגוסט 2026')
    expect(payload.body).toContain('שלום לצוות הנהלת חשבונות / רו"ח דורון אשכנזי,')
    expect(payload.body).toContain('עבור חודש אוגוסט 2026')
  })

  it('בלי שם רו"ח הפנייה נשארת חסרה ואינה ממציאה שם — החור מדווח, לא נסתם בקוד', () => {
    const payload = buildSalaryReportEmailPayload({
      template: SALARY_TEMPLATE,
      recipient: 'office@cpa-firm.co.il',
      periodLabel: 'אוגוסט 2026',
      fileName: '08_2026_Payroll_Report.xlsx',
      attachmentBase64: 'AQID',
    })
    expect(payload.body).toContain('שלום לצוות הנהלת חשבונות / ,')
    expect(payload.body).not.toContain('דורון')
  })
})

// ── קריאות ───────────────────────────────────────────────────────────────────

describe('קריאות S1/S2', () => {
  it('listFinanceOverview מחזירה את שורות ה-RPC כמות-שהן', async () => {
    routeRpc({ get_finance_overview: { data: [{ project_id: 12 }], error: null } })
    await expect(listFinanceOverview()).resolves.toEqual([{ project_id: 12 }])
  })

  it('שגיאת-RPC מוצגת בהודעת-השרת, לא בניסוח כללי', async () => {
    routeRpc({
      get_finance_overview: { data: null, error: { message: 'אין לך הרשאה למודול כספים.' } },
    })
    await expect(listFinanceOverview()).rejects.toThrow('אין לך הרשאה למודול כספים.')
  })

  it('getFinanceDetail על אפס שורות **זורקת** — מאזן ריק היה מצייר "הכנסות 0"', async () => {
    routeRpc({ get_project_finance_detail: { data: [], error: null } })
    await expect(getFinanceDetail(13)).rejects.toThrow('לא נמצאו נתוני כספים לפרויקט זה.')
  })

  it('getCancellationFeeProposal מעבירה null של שעות-חסרות (T7) ואינה הופכת אותו ל-0', async () => {
    routeRpc({
      finance_cancellation_fee_proposal: {
        data: [{ proposed_fee: null, team_compensation: null, goods_at_price: 3180 }],
        error: null,
      },
    })
    const row = await getCancellationFeeProposal(14)
    expect(row.proposed_fee).toBeNull()
    expect(row.team_compensation).toBeNull()
    expect(row.goods_at_price).toBe(3180)
  })

  it('getSalaryReportLines קוראת את ה-snapshot הקפוא לפי מזהה-דוח', async () => {
    mocks.from.mockImplementation((table) => {
      expect(table).toBe('salary_report_lines')
      return queryStub({ data: [{ line_id: 1, hostess_name: 'אפרת דהן' }], error: null })
    })
    await expect(getSalaryReportLines(7)).resolves.toHaveLength(1)
  })

  it('getBillingContact מחזירה null בלי מזהה-לקוח ואינה פונה למסד', async () => {
    await expect(getBillingContact(null)).resolves.toBeNull()
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('getBillingContact מחזירה את שם-החברה והמייל לחיוב', async () => {
    mocks.from.mockImplementation(() => queryStub({ data: CUSTOMER, error: null }))
    await expect(getBillingContact(4)).resolves.toEqual(CUSTOMER)
  })

  it('listSalaryReports קוראת מהטבלה (policy של מיגרציה B) ולא מ-RPC', async () => {
    mocks.from.mockImplementation((table) => {
      expect(table).toBe('salary_reports')
      return queryStub({ data: [{ report_id: 7, period: '2026-08-01' }], error: null })
    })
    await expect(listSalaryReports()).resolves.toEqual([{ report_id: 7, period: '2026-08-01' }])
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
})

// ── פעולות-כתיבה ─────────────────────────────────────────────────────────────

describe('פעולות-הכתיבה (RPC)', () => {
  it('תשובה בלי ok:true נזרקת — חוזה שנשבר אינו "הצלחה חלקית"', async () => {
    routeRpc({ archive_project: { data: { final_profit: 3650 }, error: null } })
    await expect(archiveProject(13)).rejects.toThrow('הארכוב נכשל.')
  })

  it('שער-הארכוב החסום מוצג בנוסח-השרת', async () => {
    const blocked =
      '🔒 חסום: שער-הארכוב דורש גם תשלום וגם משוב-פתור — טרם נרשם תאריך תשלום, והפרויקט לא נסגר כחוב אבוד.'
    routeRpc({ archive_project: { data: null, error: { message: blocked } } })
    await expect(archiveProject(12)).rejects.toThrow(blocked)
  })

  it('recordPayment מעבירה את הפרמטרים בשמותיהם ומחזירה את הרווח שנקפא (Q-4)', async () => {
    routeRpc({ record_payment: { data: { ok: true, frozen_profit: -328 }, error: null } })
    const result = await recordPayment(14, '2026-09-01')
    expect(mocks.rpc).toHaveBeenCalledWith('record_payment', {
      p_project_id: 14,
      p_payment_date: '2026-09-01',
    })
    expect(result.frozen_profit).toBe(-328)
  })

  it('recordFeedback שולחת את דגל "לא ענה לסקר" ולא ציון', async () => {
    routeRpc({
      record_feedback: { data: { ok: true, feedback_status: 'no_response' }, error: null },
    })
    await recordFeedback(12, { markNoResponse: true })
    expect(mocks.rpc).toHaveBeenCalledWith('record_feedback', {
      p_project_id: 12,
      p_score: null,
      p_reason: null,
      p_notes: null,
      p_mark_no_response: true,
    })
  })

  it('recordWriteOff מעבירה את סיבת-החובה של מסלול חוב-אבוד', async () => {
    routeRpc({ record_write_off: { data: { ok: true, frozen_profit: null }, error: null } })
    await recordWriteOff(15, 'הלקוח בפירוק')
    expect(mocks.rpc).toHaveBeenCalledWith('record_write_off', {
      p_project_id: 15,
      p_reason: 'הלקוח בפירוק',
    })
  })

  it('resolveCancellationFee מעבירה פעולה+סכום+הערה', async () => {
    routeRpc({ resolve_cancellation_fee: { data: { ok: true, action: 'waive' }, error: null } })
    await resolveCancellationFee(14, CANCELLATION_FEE_ACTIONS.WAIVE, { note: 'ויתור מסחרי' })
    expect(mocks.rpc).toHaveBeenCalledWith('resolve_cancellation_fee', {
      p_project_id: 14,
      p_action: 'waive',
      p_amount: null,
      p_note: 'ויתור מסחרי',
    })
  })
})

// ── M1: החשבונית ─────────────────────────────────────────────────────────────

describe('sendInvoiceAndRecord (P1)', () => {
  beforeEach(() => {
    mocks.getEmailTemplate.mockResolvedValue(INVOICE_TEMPLATE)
  })

  it('מסלול תקין: מעלה, שולח, ורק אז מסמן — עם הנתיב שהועלה', async () => {
    routeRpc({
      record_invoice_sent: { data: { ok: true, project_status: 'awaiting_payment' }, error: null },
    })
    const result = await sendInvoiceAndRecord({
      project: PROJECT,
      customer: CUSTOMER,
      file: fakeFile(),
    })

    expect(uploadMock).toHaveBeenCalledTimes(1)
    const [uploadedPath, , uploadOptions] = uploadMock.mock.calls[0]
    expect(uploadedPath).toMatch(/^13\/\d+_Invoice_4127\.pdf$/)
    expect(uploadOptions).toMatchObject({ upsert: false, contentType: 'application/pdf' })

    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
    expect(mocks.sendEmail.mock.calls[0][0]).toMatchObject({
      entityType: 'invoice',
      entityId: 13,
      templateName: FINANCE_TEMPLATE_NAMES.invoice,
    })

    expect(mocks.rpc).toHaveBeenCalledWith('record_invoice_sent', {
      p_project_id: 13,
      p_file_url: uploadedPath,
    })
    expect(result).toMatchObject({
      sendResult: 'sent',
      recorded: true,
      filePath: uploadedPath,
      projectStatus: 'awaiting_payment',
    })
  })

  it('🔴 כשל-מייל ודאי: `record_invoice_sent` **אינה נקראת**, והקובץ היתום נמחק', async () => {
    routeRpc({ record_invoice_sent: { data: { ok: true }, error: null } })
    mocks.sendEmail.mockRejectedValue(new Error('boom'))

    const result = await sendInvoiceAndRecord({
      project: PROJECT,
      customer: CUSTOMER,
      file: fakeFile(),
    })

    expect(result).toMatchObject({ sendResult: 'failed', recorded: false, filePath: null })
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(removeMock).toHaveBeenCalledTimes(1)
  })

  it('🔴 פסק-זמן = "לא ידוע": אין סימון "נשלח", ו**גם אין מחיקת-קובץ**', async () => {
    routeRpc({ record_invoice_sent: { data: { ok: true }, error: null } })
    mocks.sendEmail.mockRejectedValue(new Error('TIMEOUT'))

    const result = await sendInvoiceAndRecord({
      project: PROJECT,
      customer: CUSTOMER,
      file: fakeFile(),
    })

    expect(result.sendResult).toBe('unknown')
    expect(result.recorded).toBe(false)
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(removeMock).not.toHaveBeenCalled()
  })

  it('בלי מייל-לחיוב נעצרת לפני האחסון ולפני המייל', async () => {
    await expect(
      sendInvoiceAndRecord({ project: PROJECT, customer: { company_name: 'א' }, file: fakeFile() }),
    ).rejects.toThrow('אין כתובת מייל לחיוב בכרטיס הלקוח — לא ניתן לשלוח את החשבונית.')
    expect(uploadMock).not.toHaveBeenCalled()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it('בלי קובץ נעצרת בנוסח הנעול', async () => {
    await expect(
      sendInvoiceAndRecord({ project: PROJECT, customer: CUSTOMER, file: null }),
    ).rejects.toThrow(INVOICE_FILE_REQUIRED_NOTE)
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('מעבירה הלאה את `logFailed` — המייל יצא אך ההגנה מפני שליחה כפולה מתה', async () => {
    routeRpc({ record_invoice_sent: { data: { ok: true }, error: null } })
    mocks.sendEmail.mockResolvedValue({ logFailed: true })
    const result = await sendInvoiceAndRecord({
      project: PROJECT,
      customer: CUSTOMER,
      file: fakeFile(),
    })
    expect(result.logFailed).toBe(true)
  })
})

// ── M2: דוח-השכר ─────────────────────────────────────────────────────────────

// `getParamValue` (מיובאת מ-`06_projects/closingApi`) קוראת `params` דרך אותו מוק.
function routeParams(value = 'office@cpa-firm.co.il') {
  mocks.from.mockImplementation((table) => {
    if (table === 'params') return queryStub({ data: { param_value: value }, error: null })
    throw new Error(`טבלה לא צפויה בבדיקה: ${table}`)
  })
}

describe('generateAndSendSalaryReport (P4)', () => {
  beforeEach(() => {
    mocks.getEmailTemplate.mockResolvedValue(SALARY_TEMPLATE)
    routeParams()
  })

  it('מסלול תקין: מפיקה, מרכיבה קובץ, מעלה, שולחת וסוגרת ב-sent — עם עוגני data-set §5', async () => {
    routeRpc({
      generate_salary_report: () => ({ data: augustPayload(), error: null }),
      finalize_salary_report: { data: { ok: true, send_status: 'sent' }, error: null },
    })

    const result = await generateAndSendSalaryReport({
      period: '2026-08-01',
      generatedAt: '2026-09-01T09:00:00Z',
      accountantName: 'רו"ח דורון אשכנזי',
    })

    // העוגנים מוקלדים מהרגיסטר, לא מחושבים מהקוד.
    expect(result.totals.total).toBe(620.6)
    expect(result.lines[0].lineTotal).toBe(292.6)
    expect(result.fileName).toBe('08_2026_Payroll_Report.xlsx')
    expect(result.periodLabel).toBe('אוגוסט 2026')

    expect(uploadMock).toHaveBeenCalledTimes(1)
    const [path, , options] = uploadMock.mock.calls[0]
    expect(path).toBe('salary_reports/7_08_2026_Payroll_Report.xlsx')
    expect(options.contentType).toBe(XLSX_MIME)

    expect(mocks.sendEmail.mock.calls[0][0]).toMatchObject({
      entityType: 'salary_report',
      entityId: 7,
    })
    expect(mocks.rpc).toHaveBeenCalledWith('finalize_salary_report', {
      p_report_id: 7,
      p_file_url: 'salary_reports/7_08_2026_Payroll_Report.xlsx',
      p_status: 'sent',
    })
    expect(result.sendResult).toBe('sent')
  })

  it('🔴 כשל-מייל: הדוח **נסגר ב-failed ואינו אובד**, ושליחה-חוזרת אפשרית מההיסטוריה', async () => {
    routeRpc({
      generate_salary_report: () => ({ data: augustPayload(), error: null }),
      finalize_salary_report: { data: { ok: true, send_status: 'failed' }, error: null },
    })
    mocks.sendEmail.mockRejectedValue(new Error('boom'))

    const result = await generateAndSendSalaryReport({
      period: '2026-08-01',
      generatedAt: '2026-09-01T09:00:00Z',
    })

    expect(result.sendResult).toBe('failed')
    expect(result.sendStatus).toBe('failed')
    expect(result.reportId).toBe(7)
    expect(mocks.rpc).toHaveBeenCalledWith(
      'finalize_salary_report',
      expect.objectContaining({ p_status: 'failed' }),
    )
  })

  it('🔴 פסק-זמן: המסד נרשם failed (אין ערך שלישי) אך התשובה למסך היא "לא ידוע"', async () => {
    routeRpc({
      generate_salary_report: () => ({ data: augustPayload(), error: null }),
      finalize_salary_report: { data: { ok: true, send_status: 'failed' }, error: null },
    })
    mocks.sendEmail.mockRejectedValue(new Error('TIMEOUT'))

    const result = await generateAndSendSalaryReport({
      period: '2026-08-01',
      generatedAt: '2026-09-01T09:00:00Z',
    })

    expect(result.sendResult).toBe('unknown')
    expect(result.sendStatus).toBe('failed')
  })

  it('🔴 כשל-העלאה אינו מבטל את המייל — הרו"ח מקבל את הקובץ, וחוסר-הראיה מדווח למסך', async () => {
    routeRpc({
      generate_salary_report: () => ({ data: augustPayload(), error: null }),
      finalize_salary_report: { data: { ok: true }, error: null },
    })
    uploadMock.mockResolvedValue({ error: { message: 'mime type not supported' } })

    const result = await generateAndSendSalaryReport({
      period: '2026-08-01',
      generatedAt: '2026-09-01T09:00:00Z',
    })

    expect(result.sendResult).toBe('sent')
    expect(result.filePath).toBeNull()
    expect(result.fileError).toBeInstanceOf(Error)
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
    expect(mocks.rpc).toHaveBeenCalledWith(
      'finalize_salary_report',
      expect.objectContaining({ p_file_url: null, p_status: 'sent' }),
    )
  })

  it('🔴 שומר-הרכבה שנפל אינו נבלע כ"נכשל" גנרי — הודעתו מגיעה למסך, והדוח נסגר', async () => {
    // הסכום שהמסד רשם אינו סכום השורות ⇒ `buildSalaryReportDocument` זורק
    // `SALARY_TOTAL_MISMATCH`. ההודעה הזאת נכתבה כדי להיאמר, ולכן היא נבדקת.
    routeRpc({
      generate_salary_report: () => ({ data: augustPayload({ total_amount: 999 }), error: null }),
      finalize_salary_report: { data: { ok: true }, error: null },
    })

    const result = await generateAndSendSalaryReport({
      period: '2026-08-01',
      generatedAt: '2026-09-01T09:00:00Z',
    })

    expect(result.sendResult).toBe('failed')
    expect(result.mailError.message).toBe(
      'סכום שורות הדוח אינו תואם את הסכום שנרשם במסד — הדוח לא הורכב.',
    )
    expect(mocks.sendEmail).not.toHaveBeenCalled()
    expect(mocks.rpc).toHaveBeenCalledWith(
      'finalize_salary_report',
      expect.objectContaining({ p_report_id: 7, p_file_url: null, p_status: 'failed' }),
    )
  })

  it('חוסר-תבנית או חוסר-נמען עוצר **לפני** ההפקה הבלתי-הפיכה', async () => {
    mocks.getEmailTemplate.mockRejectedValue(new Error('תבנית המייל חסרה בהגדרות.'))
    routeRpc({})
    await expect(
      generateAndSendSalaryReport({ period: '2026-08-01', generatedAt: '2026-09-01T09:00:00Z' }),
    ).rejects.toThrow()
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('שם-הפרמטר לכתובת רואי-החשבון נקרא כפי שנזרע', () => {
    expect(ACCOUNTANT_EMAIL_PARAM).toBe('מייל_משרד_רואי_חשבון')
    expect(FINANCE_TEMPLATE_NAMES.salaryReport).toBe('תבנית_מייל_דוח_שכר')
    expect(FINANCE_TEMPLATE_NAMES.invoice).toBe('תבנית_מייל_חשבונית_מס')
  })
})

describe('resendSalaryReportMail (P4 — שליחה חוזרת)', () => {
  beforeEach(() => {
    mocks.getEmailTemplate.mockResolvedValue(SALARY_TEMPLATE)
    routeParams()
  })

  it('דוח בלי קובץ שמור אינו נשלח שוב — ואינו יוצא כמייל בלי צרופה', async () => {
    await expect(
      resendSalaryReportMail({ report: { report_id: 7, period: '2026-08-01' } }),
    ).rejects.toThrow('לא נשמר קובץ לדוח הזה — לא ניתן לשלוח אותו שוב מההיסטוריה.')
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it('שולחת את אותו קובץ מהבאקט ומעדכנת את סטטוס-השליחה — בלי הפקה חוזרת', async () => {
    downloadMock.mockResolvedValue({
      data: { arrayBuffer: () => Promise.resolve(new Uint8Array([9, 9]).buffer) },
      error: null,
    })
    routeRpc({ finalize_salary_report: { data: { ok: true }, error: null } })

    const result = await resendSalaryReportMail({
      report: {
        report_id: 7,
        period: '2026-08-01',
        report_file_url: 'salary_reports/7_08_2026_Payroll_Report.xlsx',
      },
    })

    expect(mocks.sendEmail.mock.calls[0][0].payload.filename).toBe('08_2026_Payroll_Report.xlsx')
    expect(mocks.sendEmail.mock.calls[0][0].payload.subject).toBe('דוח שכר דיילות — אוגוסט 2026')
    expect(mocks.rpc).not.toHaveBeenCalledWith('generate_salary_report', expect.anything())
    expect(mocks.rpc).toHaveBeenCalledWith('finalize_salary_report', {
      p_report_id: 7,
      p_file_url: 'salary_reports/7_08_2026_Payroll_Report.xlsx',
      p_status: 'sent',
    })
    expect(result.sendResult).toBe('sent')
  })
})
