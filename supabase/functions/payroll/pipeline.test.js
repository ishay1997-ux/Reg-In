// @vitest-environment node
// תזמור `payroll` מול זיופים (חוזה §5 "C", §9.1 — אין שרת Supabase מקומי): כל פעולה, כל נקודת
// קריסה בטבלה §3.2, ומסלול השומר בכל שליחה. הזיופים מחקים את צורות ההחזרה של החוזה (§2, §4.3,
// תיקוני F1–F9); הם אינם מוכיחים את התנהגות המסד עצמו — זה של A ו-B.
import { describe, it, expect, vi } from 'vitest'
import {
  DISTRIBUTE_BATCH,
  WALL_BUDGET_MS,
  failureBody,
  handleRequest,
  normalizeRpc,
  originAllowed,
  parseRequest,
  sanitizeDetail,
} from './pipeline.ts'

const OP = '6f1d0c1e-1111-4000-8000-000000000001'
const REQ = '6f1d0c1e-2222-4000-8000-000000000002'
const ORIGIN = 'https://reg-in.example'
const CTX = { allowedOrigins: `${ORIGIN}, http://localhost:5173` }
const ACTOR = 'finance@example.com'
const ACCOUNTANT = 'office@accountants.example'

const SALARY_TEMPLATE = `שלום לצוות הנהלת חשבונות / [שם_רואה_חשבון],
מצורף קובץ השכר לחודש [חודש_דיווח_ושנה].`
const REVIEW_TEMPLATE = `שלום [שם_דיילת],
סיכום השעות לחודש [חודש_דיווח_ושנה]:
[לינק_בדיקת_שעות]
נבקש להשיב עד [מועד_אחרון_לתגובה].`

const XLSX_BYTES = new Uint8Array([80, 75, 3, 4, 1, 2, 3])

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Buffer.from(digest).toString('hex')
}

function snapshotPayload(overrides = {}) {
  return {
    ok: true,
    report_id: 77,
    period: '2026-07-01',
    total_amount: 272.6,
    line_count: 1,
    lines: [
      {
        hostess_id: 901,
        hostess_name: 'אפרת דהן',
        id_number: '012345678',
        source_project_id: 9001,
        line_basis: 'actual',
        hours: 5,
        rate: 50,
        bonus: null,
        travel: 22.6,
        line_total: 272.6,
        bank_name: 'הפועלים',
        bank_branch: '601',
        bank_account: '2047199',
        show_in_file: true,
      },
    ],
    kind: 'regular',
    original_report_id: null,
    supplement_seq: null,
    generated_at: '2026-10-14T07:00:00Z',
    prepare_attempt: 1,
    artifact_key_prefix: `payroll/2026-07/${OP}/`,
    ...overrides,
  }
}

const ok = (data) => ({ data, error: null })
const raised = (code, message = 'הודעה מהמסד', hint) => ({
  data: null,
  error: { code: 'P0001', message, details: `PAYROLL:${code}`, hint },
})

// מסד-זיוף: טבלת מטפלים לפי שם RPC; כל קריאה נרשמת עם הצד (user/admin).
function harness(handlers = {}, extra = {}) {
  const calls = []
  const storage = new Map()
  const record = (side) => async (name, args) => {
    calls.push({ side, name, args })
    const handler = handlers[name]
    if (!handler) throw new Error(`unexpected rpc ${name}`)
    return handler(args, calls)
  }
  const deps = {
    actorEmail: ACTOR,
    userRpc: record('user'),
    adminRpc: record('admin'),
    uploadArtifact: vi.fn(async (key, bytes) => {
      if (storage.has(key)) return { error: 'The resource already exists' }
      storage.set(key, bytes)
      return { error: null }
    }),
    downloadArtifact: vi.fn(async (key) =>
      storage.has(key)
        ? { bytes: storage.get(key), error: null }
        : { bytes: null, error: 'Object not found' },
    ),
    readTemplate: vi.fn(async (name) => ({
      text: name === 'תבנית_מייל_דוח_שכר' ? SALARY_TEMPLATE : REVIEW_TEMPLATE,
      error: null,
    })),
    buildXlsx: vi.fn(async () => XLSX_BYTES),
    sha256Hex,
    toBase64: (bytes) => Buffer.from(bytes).toString('base64'),
    transport: vi.fn(async () => ({ outcome: 'sent', httpStatus: 200 })),
    now: () => 0,
    ...extra,
  }
  const names = (side) => calls.filter((c) => !side || c.side === side).map((c) => c.name)
  const argsOf = (name) => calls.find((c) => c.name === name)?.args
  return { deps, calls, storage, names, argsOf }
}

async function accountantClaim(storage, overrides = {}) {
  const key = `payroll/2026-07/${OP}/1_07_2026_Payroll_Report.xlsx`
  if (!storage.has(key)) storage.set(key, XLSX_BYTES)
  return {
    attempt_id: 501,
    kind: 'accountant',
    intended_recipient: ACCOUNTANT,
    report_id: 77,
    recipient_id: null,
    artifact: {
      key,
      sha256: await sha256Hex(XLSX_BYTES),
      filename: '07_2026_Payroll_Report.xlsx',
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    period: '2026-07-01',
    report_kind: 'regular',
    supplement_seq: null,
    template_name: 'תבנית_מייל_דוח_שכר',
    ...overrides,
  }
}

// ‏MAKE + commit + complete תקינים — הבסיס של רוב התרחישים.
function issueHandlers(h, state = 'preparing', overrides = {}) {
  return {
    payroll_operation_begin: () => ok({ ok: true, operation_id: OP }),
    payroll_operation_status: () => ok({ ok: true, operation_id: OP, state }),
    payroll_operation_snapshot: () => ok(snapshotPayload()),
    payroll_operation_record_artifact: () => ok({ ok: true }),
    payroll_operation_fail: () => ok({ ok: true }),
    payroll_commit: () =>
      ok({ ok: true, report_id: 77, attempt_id: 501, total_amount: 272.6, line_count: 1 }),
    payroll_attempt_claim: async () => ok(await accountantClaim(h.storage)),
    payroll_attempt_complete: () => ok({ ok: true }),
    ...overrides,
  }
}

function issueBody(overrides = {}) {
  return {
    action: 'issue',
    operation_id: OP,
    review_id: 12,
    expected_version: 'v1:abc',
    period: '2026-07-01',
    kind: 'regular',
    original_report_id: null,
    ...overrides,
  }
}

// עוזר: harness שהמטפלים שלו תלויים ב-harness עצמו (לגישה ל-storage).
function issueHarness(state, overrides = {}, extra = {}) {
  const handlers = {}
  const h = harness(handlers, extra)
  Object.assign(handlers, issueHandlers(h, state, overrides))
  return h
}

// ── אימות הבקשה ───────────────────────────────────────────────────────────────

describe('parseRequest — גוף לא תקין לא מגיע למסד', () => {
  it.each([
    ['null', null],
    ['מערך', []],
    ['פעולה לא מוכרת', { action: 'delete_everything' }],
    ['issue בלי operation_id', issueBody({ operation_id: undefined })],
    ['issue עם UUID פגום', issueBody({ operation_id: 'abc' })],
    ['issue עם kind לא מוכר', issueBody({ kind: 'adjustment' })],
    ['issue עם תקופה פגומה', issueBody({ period: '07/2026' })],
    ['issue עם original שלילי', issueBody({ original_report_id: -1 })],
    [
      'distribute בלי request_id',
      { action: 'distribute', review_id: 1, expected_revision: 1, mode: 'initial' },
    ],
    [
      'distribute עם mode לא מוכר',
      { action: 'distribute', review_id: 1, expected_revision: 1, mode: 'all', request_id: REQ },
    ],
    [
      'distribute עם רשימה ריקה',
      {
        action: 'distribute',
        review_id: 1,
        expected_revision: 1,
        mode: 'initial',
        request_id: REQ,
        recipient_ids: [],
      },
    ],
    [
      'retry_accountant בלי נמען מאושר',
      { action: 'retry_accountant', report_id: 1, prior_attempt_id: 2 },
    ],
    [
      'resend_review עם acknowledge לא בוליאני',
      { action: 'resend_review', recipient_id: 1, prior_attempt_id: 2, acknowledge_unknown: 'yes' },
    ],
  ])('%s ⇒ INVALID_REQUEST', async (_name, body) => {
    const h = harness()
    const out = await handleRequest(h.deps, body, CTX)
    expect(out).toMatchObject({ ok: false, code: 'INVALID_REQUEST' })
    expect(h.calls).toHaveLength(0)
  })

  it('תקופה YYYY-MM מנורמלת ל-YYYY-MM-01 לפני begin', async () => {
    const h = issueHarness('committed', { payroll_attempt_claim: () => raised('NOT_CLAIMABLE') })
    await handleRequest(h.deps, issueBody({ period: '2026-07' }), CTX)
    expect(h.argsOf('payroll_operation_begin').p_period).toBe('2026-07-01')
  })

  it('parseRequest ממלא ברירות-מחדל', () => {
    expect(parseRequest(issueBody({ original_report_id: undefined })).original_report_id).toBeNull()
  })
})

describe('originAllowed', () => {
  it.each([
    [ORIGIN, ORIGIN],
    [`${ORIGIN}/`, ORIGIN],
    ['http://localhost:5173', 'http://localhost:5173'],
    ['https://evil.example', null],
    [`${ORIGIN}.evil.example`, null],
    [undefined, null],
  ])('%s ⇒ %s', (origin, expected) => {
    expect(originAllowed(origin, CTX.allowedOrigins)).toBe(expected)
  })

  it('בלי הגדרה — שום מקור אינו מותר (נעילה)', () => {
    expect(originAllowed(ORIGIN, undefined)).toBeNull()
    expect(originAllowed(ORIGIN, '')).toBeNull()
  })
})

describe('normalizeRpc / sanitizeDetail / failureBody', () => {
  it('detail PAYROLL:<CODE> ⇒ הקוד, ההודעה העברית והרמז', () => {
    const out = normalizeRpc('x', raised('PERIOD_EXISTS', 'כבר הופק', '{"report_id":15}'))
    expect(out).toMatchObject({
      ok: false,
      code: 'PERIOD_EXISTS',
      message: 'כבר הופק',
      extra: { report_id: 15 },
    })
  })

  it('42501 ⇒ PERMISSION_DENIED עם HTTP 403', () => {
    const out = normalizeRpc('x', {
      data: null,
      error: { code: '42501', message: 'permission denied' },
    })
    expect(out).toMatchObject({ code: 'PERMISSION_DENIED', httpStatus: 403 })
    expect(failureBody(out).status).toBe(403)
  })

  it('{ok:false} מהמסד ⇒ הקוד ושאר השדות', () => {
    const out = normalizeRpc(
      'x',
      ok({ ok: false, code: 'REVIEW_NOT_READY', blockers: [{ code: 'OBJECTION_OPEN' }] }),
    )
    expect(out).toMatchObject({
      code: 'REVIEW_NOT_READY',
      retryable: true,
      extra: { blockers: [{ code: 'OBJECTION_OPEN' }] },
    })
    expect(failureBody(out)).toEqual({
      status: 200,
      body: expect.objectContaining({ ok: false, code: 'REVIEW_NOT_READY', retryable: true }),
    })
  })

  it('שגיאה לא מזוהה ⇒ RPC_ERROR בלי הטקסט הגולמי', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const out = normalizeRpc('x', {
      data: null,
      error: { code: '42P01', message: 'relation "secret_table" does not exist' },
    })
    expect(out.code).toBe('RPC_ERROR')
    expect(out.message).not.toContain('secret_table')
    spy.mockRestore()
  })

  it('פרטי-שגיאה: בלי כתובות URL ועד 500 תווים', () => {
    expect(sanitizeDetail('error sending request for url (https://hook.eu1.make.com/SECRET)')).toBe(
      'error sending request for url ([url]',
    )
    expect(sanitizeDetail('x'.repeat(900))).toHaveLength(500)
    expect(sanitizeDetail(null)).toBeNull()
  })
})

// ── issue / resume: נקודות הקריסה של §3.2 ─────────────────────────────────────

describe('issue — מסלול מלא', () => {
  it('begin ⇒ status ⇒ snapshot ⇒ upload ⇒ record ⇒ commit ⇒ claim ⇒ send ⇒ complete', async () => {
    const h = issueHarness('preparing')
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(h.names()).toEqual([
      'payroll_operation_begin',
      'payroll_operation_status',
      'payroll_operation_snapshot',
      'payroll_operation_record_artifact',
      'payroll_commit',
      'payroll_attempt_claim',
      'payroll_attempt_complete',
    ])
    // ההרשאה נבדקת קודם בזהות המשתמשת; קריאות-השירות נושאות את ה-actor המאומת.
    expect(h.calls[0].side).toBe('user')
    h.calls
      .filter((c) => c.side === 'admin')
      .forEach((c) => expect(c.args.p_actor_email).toBe(ACTOR))
    expect(out).toMatchObject({
      ok: true,
      operation_id: OP,
      report_id: 77,
      attempt: {
        attempt_id: 501,
        state: 'sent',
        delivered_recipient: 'ishay1997@gmail.com',
        redirected: true,
      },
    })
  })

  it('הקובץ: מפתח לפי prepare_attempt, upsert:false (נבדק בזיוף), גיבוב ומטא-דאטה נרשמים', async () => {
    const h = issueHarness('preparing')
    await handleRequest(h.deps, issueBody(), CTX)
    const key = `payroll/2026-07/${OP}/1_07_2026_Payroll_Report.xlsx`
    expect(h.deps.uploadArtifact).toHaveBeenCalledWith(
      key,
      XLSX_BYTES,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    expect(h.argsOf('payroll_operation_record_artifact')).toEqual({
      p_operation_id: OP,
      p_actor_email: ACTOR,
      p_key: key,
      p_sha256: await sha256Hex(XLSX_BYTES),
      p_size: XLSX_BYTES.length,
      p_mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      p_filename: '07_2026_Payroll_Report.xlsx',
    })
  })

  it('המסמך נבנה מתמונת-המצב עם generated_at של המסד, לא משעון השרת', async () => {
    const h = issueHarness('preparing')
    await handleRequest(h.deps, issueBody(), CTX)
    const doc = h.deps.buildXlsx.mock.calls[0][0]
    expect(doc.sheet[2][1].value).toBe('14/10/2026 10:00')
    expect(doc.reportId).toBe(77)
  })

  it('השלמה: שם הקובץ, ונושא מייל הרו"ח עם "— השלמה 1"', async () => {
    const h = issueHarness('preparing', {
      payroll_operation_snapshot: () =>
        ok(
          snapshotPayload({
            kind: 'supplement',
            original_report_id: 15,
            supplement_seq: 1,
            report_id: 78,
            period: '2026-08-01',
          }),
        ),
      payroll_attempt_claim: async () =>
        ok(
          await accountantClaim(h.storage, {
            period: '2026-08-01',
            report_kind: 'supplement',
            supplement_seq: 1,
          }),
        ),
    })
    await handleRequest(
      h.deps,
      issueBody({ kind: 'supplement', original_report_id: 15, period: '2026-08-01' }),
      CTX,
    )
    expect(h.argsOf('payroll_operation_record_artifact').p_filename).toBe(
      '08_2026_Payroll_Report_Supplement_1.xlsx',
    )
    const sent = h.deps.transport.mock.calls[0][0]
    expect(sent.subject).toBe(`[הופנה: ${ACCOUNTANT}] דוח שכר דיילות — אוגוסט 2026 — השלמה 1`)
  })

  it('begin כשל (הרשאה) ⇒ 403, ואין אף קריאת שירות', async () => {
    const h = harness({
      payroll_operation_begin: () => ({ data: null, error: { code: '42501', message: 'denied' } }),
    })
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(out).toMatchObject({ code: 'PERMISSION_DENIED', httpStatus: 403 })
    expect(h.names('admin')).toEqual([])
  })

  it('begin מחזיר שגיאה עסקית (REVIEW_NOT_READY + חסמים) ⇒ עוברת ללקוח עם operation_id', async () => {
    const h = harness({
      payroll_operation_begin: () =>
        raised(
          'REVIEW_NOT_READY',
          'לא מוכן',
          '{"blockers":[{"code":"DECISIONS_MISSING","count":3}]}',
        ),
    })
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(out).toMatchObject({
      ok: false,
      code: 'REVIEW_NOT_READY',
      extra: { operation_id: OP, blockers: [{ code: 'DECISIONS_MISSING', count: 3 }] },
    })
  })
})

describe('§3.2 — begin: התשובה אבדה', () => {
  it('אותו UUID שוב ⇒ begin מחזיר existing ⇒ ממשיכים מהמצב השמור (prepared ⇒ commit בלבד)', async () => {
    const h = issueHarness('prepared', {
      payroll_operation_begin: () => ok({ ok: true, existing: true, operation_id: OP }),
    })
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(h.names()).not.toContain('payroll_operation_snapshot')
    expect(h.deps.uploadArtifact).not.toHaveBeenCalled()
    expect(out.ok).toBe(true)
  })

  it('פעולה פעילה אחרת עם אותה גרסה (לשונית שנייה) ⇒ ממשיכים אותה, לא פותחים חדשה', async () => {
    const OTHER = '6f1d0c1e-3333-4000-8000-000000000003'
    const h = issueHarness('committed', {
      payroll_operation_begin: () => ok({ ok: true, existing: true, operation_id: OTHER }),
      payroll_attempt_claim: () => raised('NOT_CLAIMABLE'),
    })
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(h.argsOf('payroll_operation_status').p_operation_id).toBe(OTHER)
    expect(h.argsOf('payroll_commit').p_operation_id).toBe(OTHER)
    expect(out.operation_id).toBe(OTHER)
  })
})

describe('§3.2 — קריסה אחרי snapshot / build / upload (preparing)', () => {
  it('resume בונה מחדש עם prepare_attempt+1 ומפתח חדש; הקובץ הקודם לא נדרס', async () => {
    const h = issueHarness('preparing', {
      payroll_operation_snapshot: () => ok(snapshotPayload({ prepare_attempt: 2 })),
    })
    const orphan = `payroll/2026-07/${OP}/1_07_2026_Payroll_Report.xlsx`
    h.storage.set(orphan, new Uint8Array([9, 9, 9]))
    const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
    expect(h.argsOf('payroll_operation_record_artifact').p_key).toBe(
      `payroll/2026-07/${OP}/2_07_2026_Payroll_Report.xlsx`,
    )
    expect(h.storage.get(orphan)).toEqual(new Uint8Array([9, 9, 9]))
    expect(out.ok).toBe(true)
  })

  it('snapshot מחזיר PREVIEW_CHANGED (המסד כבר סימן failed) ⇒ אין בנייה, אין העלאה', async () => {
    const h = issueHarness('preparing', {
      payroll_operation_snapshot: () =>
        ok({ ok: false, code: 'PREVIEW_CHANGED', message: 'הנתונים השתנו' }),
    })
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(out).toMatchObject({ ok: false, code: 'PREVIEW_CHANGED', extra: { operation_id: OP } })
    expect(h.deps.buildXlsx).not.toHaveBeenCalled()
    expect(h.deps.uploadArtifact).not.toHaveBeenCalled()
    expect(h.names()).not.toContain('payroll_commit')
  })

  it('שגיאת הרכבה (סכום לא תואם) ⇒ payroll_operation_fail עם הקוד, בלי קובץ ובלי commit', async () => {
    const h = issueHarness('preparing', {
      payroll_operation_snapshot: () => ok(snapshotPayload({ total_amount: 999 })),
    })
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(out.code).toBe('SALARY_TOTAL_MISMATCH')
    expect(h.argsOf('payroll_operation_fail')).toMatchObject({
      p_code: 'SALARY_TOTAL_MISMATCH',
      p_actor_email: ACTOR,
    })
    expect(h.deps.uploadArtifact).not.toHaveBeenCalled()
    expect(h.names()).not.toContain('payroll_commit')
  })

  it('כתיבת xlsx נכשלה ⇒ XLSX_BUILD_FAILED', async () => {
    const h = issueHarness(
      'preparing',
      {},
      {
        buildXlsx: vi.fn(async () => {
          throw new Error('boom')
        }),
      },
    )
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(out.code).toBe('XLSX_BUILD_FAILED')
    expect(h.argsOf('payroll_operation_fail').p_code).toBe('XLSX_BUILD_FAILED')
  })

  it.each([
    ['מעל 10MiB', 10 * 1024 * 1024 + 1],
    ['מעל תקרת המצורף (base64 > 4,000,000)', 3_000_001],
  ])('קובץ גדול %s ⇒ ARTIFACT_TOO_LARGE, בלי העלאה', async (_name, size) => {
    const h = issueHarness('preparing', {}, { buildXlsx: vi.fn(async () => new Uint8Array(size)) })
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(out.code).toBe('ARTIFACT_TOO_LARGE')
    expect(h.deps.uploadArtifact).not.toHaveBeenCalled()
    expect(h.argsOf('payroll_operation_fail').p_code).toBe('ARTIFACT_TOO_LARGE')
  })

  it('קובץ בגבול המותר (base64 בדיוק 4,000,000) עובר', async () => {
    const h = issueHarness(
      'preparing',
      {},
      { buildXlsx: vi.fn(async () => new Uint8Array(3_000_000)) },
    )
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(h.deps.uploadArtifact).toHaveBeenCalled()
    expect(out.code).toBeUndefined()
  })

  it('העלאה נכשלה ⇒ STORAGE_UPLOAD_FAILED, בלי record ובלי commit', async () => {
    const h = issueHarness(
      'preparing',
      {},
      { uploadArtifact: vi.fn(async () => ({ error: 'network' })) },
    )
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(out.code).toBe('STORAGE_UPLOAD_FAILED')
    expect(h.names()).not.toContain('payroll_operation_record_artifact')
    expect(h.names()).not.toContain('payroll_commit')
  })

  it('גם רישום הכשל נכשל ⇒ מחזירים את הכשל המקורי (הפעולה נשארת preparing)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const h = issueHarness('preparing', {
      payroll_operation_snapshot: () => ok(snapshotPayload({ total_amount: 999 })),
      payroll_operation_fail: () => ({
        data: null,
        error: { code: '08006', message: 'connection' },
      }),
    })
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(out.code).toBe('SALARY_TOTAL_MISMATCH')
    spy.mockRestore()
  })

  it('תחילית-מפתח שאינה payroll/… ⇒ לא מעלים', async () => {
    const h = issueHarness('preparing', {
      payroll_operation_snapshot: () =>
        ok(snapshotPayload({ artifact_key_prefix: 'salary_reports/' })),
    })
    const out = await handleRequest(h.deps, issueBody(), CTX)
    expect(out.code).toBe('STORAGE_UPLOAD_FAILED')
    expect(h.deps.uploadArtifact).not.toHaveBeenCalled()
  })
})

describe('§3.2 — קריסה אחרי record_artifact (prepared)', () => {
  it('resume ⇒ commit (שמאמת גרסה מחדש) בלי לבנות שוב', async () => {
    const h = issueHarness('prepared')
    const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
    expect(h.names()).toEqual([
      'payroll_operation_status',
      'payroll_commit',
      'payroll_attempt_claim',
      'payroll_attempt_complete',
    ])
    expect(out.ok).toBe(true)
  })

  it.each([['REVIEW_NOT_READY'], ['PAYROLL_BUSY']])(
    'commit מחזיר %s ⇒ retryable, אין שליחה, הפעולה נשארת prepared',
    async (code) => {
      const h = issueHarness('prepared', {
        payroll_commit: () =>
          ok({ ok: false, code, blockers: [{ code: 'OBJECTION_OPEN', count: 1 }] }),
      })
      const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
      expect(out).toMatchObject({ ok: false, code, retryable: true })
      expect(h.names()).not.toContain('payroll_attempt_claim')
      expect(h.names()).not.toContain('payroll_operation_fail')
      expect(h.deps.transport).not.toHaveBeenCalled()
    },
  )

  it('commit מחזיר PREVIEW_CHANGED ⇒ לא retryable, אין שליחה', async () => {
    const h = issueHarness('prepared', {
      payroll_commit: () => ok({ ok: false, code: 'PREVIEW_CHANGED' }),
    })
    const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
    expect(out).toMatchObject({ code: 'PREVIEW_CHANGED', retryable: false })
    expect(h.deps.transport).not.toHaveBeenCalled()
  })
})

describe('§3.2 — תשובת commit אבדה / קריסה אחרי commit', () => {
  it('committed + הניסיון עוד queued ⇒ resume שולח פעם אחת', async () => {
    const h = issueHarness('committed')
    const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
    expect(h.names()).toEqual([
      'payroll_operation_status',
      'payroll_commit',
      'payroll_attempt_claim',
      'payroll_attempt_complete',
    ])
    expect(h.deps.transport).toHaveBeenCalledTimes(1)
    expect(out.attempt.state).toBe('sent')
  })

  it('committed + הניסיון כבר נשלח/בשליחה (NOT_CLAIMABLE) ⇒ אין שליחה שנייה', async () => {
    const h = issueHarness('committed', { payroll_attempt_claim: () => raised('NOT_CLAIMABLE') })
    const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
    expect(h.deps.transport).not.toHaveBeenCalled()
    expect(h.names()).not.toContain('payroll_attempt_complete')
    expect(out).toMatchObject({
      ok: true,
      report_id: 77,
      attempt: { attempt_id: 501, state: 'skipped' },
    })
  })

  it('claim מחזיר ISSUE_DISABLED ⇒ not_started, הניסיון נשאר בתור', async () => {
    const h = issueHarness('committed', { payroll_attempt_claim: () => raised('ISSUE_DISABLED') })
    const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
    expect(out.attempt).toMatchObject({ state: 'not_started', code: 'ISSUE_DISABLED' })
    expect(h.deps.transport).not.toHaveBeenCalled()
  })

  it.each([
    ['failed', 'PREVIEW_CHANGED'],
    ['superseded', null],
  ])('פעולה במצב %s ⇒ אין commit', async (state, failureCode) => {
    const h = issueHarness(state, {
      payroll_operation_status: () => ok({ ok: true, state, failure_code: failureCode }),
    })
    const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
    expect(out).toMatchObject({ ok: false, code: failureCode ?? 'OPERATION_STATE' })
    expect(h.names()).toEqual(['payroll_operation_status'])
  })

  it('resume למשתמשת צפייה: status מותר, snapshot נדחה במסד ⇒ PERMISSION_DENIED', async () => {
    const h = issueHarness('preparing', {
      payroll_operation_snapshot: () => raised('PERMISSION_DENIED', 'אין הרשאה'),
    })
    const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
    expect(out).toMatchObject({ code: 'PERMISSION_DENIED', httpStatus: 403 })
    expect(h.deps.uploadArtifact).not.toHaveBeenCalled()
  })
})

// ── שליחה לרו"ח: הקובץ, התבנית, השומר והתוצאה ─────────────────────────────────

describe('dispatchAccountant', () => {
  async function resumeWith(overrides, extra) {
    const h = issueHarness('committed', overrides, extra)
    const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
    return { h, out, complete: h.argsOf('payroll_attempt_complete') }
  }

  it('שולח את הקובץ החתום עם השומר: נמען ⇒ ישי, תגית בנושא, באנר בגוף, מצורף base64', async () => {
    const { h, complete } = await resumeWith()
    const sent = h.deps.transport.mock.calls[0][0]
    expect(sent.to).toBe('ishay1997@gmail.com')
    expect(sent.subject).toBe(`[הופנה: ${ACCOUNTANT}] דוח שכר דיילות — יולי 2026`)
    expect(sent.body).toContain('הודעת בדיקה: ההודעה נועדה ל־')
    expect(sent.body).toContain('שלום לצוות הנהלת חשבונות,<br>')
    expect(sent.body.startsWith('<div dir="rtl"')).toBe(true)
    expect(sent.filename).toBe('07_2026_Payroll_Report.xlsx')
    expect(sent.pdf_base64).toBe(Buffer.from(XLSX_BYTES).toString('base64'))
    expect(complete).toMatchObject({
      p_attempt_id: 501,
      p_outcome: 'sent',
      p_delivered: 'ishay1997@gmail.com',
      p_redirected: true,
      p_subject: sent.subject,
      p_http_status: 200,
      p_error_code: null,
      p_template_sha256: await sha256Hex(new TextEncoder().encode(SALARY_TEMPLATE)),
    })
  })

  it('נמען שהוא ישי עצמו ⇒ בלי הפניה ובלי באנר', async () => {
    const { h, complete } = await resumeWith(
      {
        payroll_attempt_claim: async () =>
          ok(await accountantClaim(new Map(), { intended_recipient: 'ishay1997+acc@gmail.com' })),
      },
      { downloadArtifact: vi.fn(async () => ({ bytes: XLSX_BYTES, error: null })) },
    )
    const sent = h.deps.transport.mock.calls[0][0]
    expect(sent.to).toBe('ishay1997+acc@gmail.com')
    expect(sent.body).not.toContain('הודעת בדיקה')
    expect(complete.p_redirected).toBe(false)
  })

  async function failedBeforeFetch(overrides, extra, code) {
    const { h, out, complete } = await resumeWith(overrides, extra)
    expect(h.deps.transport).not.toHaveBeenCalled()
    expect(complete).toMatchObject({ p_outcome: 'failed', p_error_code: code, p_delivered: null })
    expect(out.attempt).toMatchObject({ state: 'failed', code })
  }

  it('גיבוב הקובץ שהורד שונה מהרשום ⇒ failed ARTIFACT_HASH_MISMATCH, בלי שליחה', async () => {
    await failedBeforeFetch(
      {
        payroll_attempt_claim: async () => {
          const claim = await accountantClaim(new Map())
          return ok({ ...claim, artifact: { ...claim.artifact, sha256: 'f'.repeat(64) } })
        },
      },
      {
        downloadArtifact: vi.fn(async () => ({ bytes: XLSX_BYTES, error: null })),
      },
      'ARTIFACT_HASH_MISMATCH',
    )
  })

  it('הקובץ חסר באחסון ⇒ failed ARTIFACT_UNAVAILABLE', async () => {
    await failedBeforeFetch(
      {},
      { downloadArtifact: vi.fn(async () => ({ bytes: null, error: 'Object not found' })) },
      'ARTIFACT_UNAVAILABLE',
    )
  })

  it('תבנית עם שדה לא מוכר ⇒ failed TEMPLATE_INVALID', async () => {
    await failedBeforeFetch(
      {},
      { readTemplate: vi.fn(async () => ({ text: `${SALARY_TEMPLATE}\n[טלפון]`, error: null })) },
      'TEMPLATE_INVALID',
    )
  })

  it('תבנית חסרה ⇒ failed TEMPLATE_INVALID', async () => {
    await failedBeforeFetch(
      {},
      { readTemplate: vi.fn(async () => ({ text: null, error: null })) },
      'TEMPLATE_INVALID',
    )
  })

  it('נמען לא תקין (שתי כתובות) ⇒ השומר זורק ⇒ failed RECIPIENT_INVALID, בלי שליחה', async () => {
    let storage
    const h = issueHarness('committed', {
      payroll_attempt_claim: async () =>
        ok(await accountantClaim(storage, { intended_recipient: 'a@x.com,ishay1997@gmail.com' })),
    })
    storage = h.storage
    const out = await handleRequest(h.deps, { action: 'resume', operation_id: OP }, CTX)
    expect(h.deps.transport).not.toHaveBeenCalled()
    expect(h.argsOf('payroll_attempt_complete')).toMatchObject({
      p_outcome: 'failed',
      p_error_code: 'RECIPIENT_INVALID',
    })
    expect(out.attempt.state).toBe('failed')
  })

  it('Make החזיר 502 ⇒ failed עם קוד-HTTP', async () => {
    const { complete, out } = await resumeWith(
      {},
      {
        transport: vi.fn(async () => ({
          outcome: 'failed',
          httpStatus: 502,
          errorCode: 'TRANSPORT_REJECTED',
        })),
      },
    )
    expect(complete).toMatchObject({
      p_outcome: 'failed',
      p_http_status: 502,
      p_error_code: 'TRANSPORT_REJECTED',
    })
    expect(out.attempt).toMatchObject({
      state: 'failed',
      delivered_recipient: 'ishay1997@gmail.com',
    })
  })

  it('פסק-זמן אחרי היציאה ⇒ unknown, ופרטי-השגיאה בלי כתובת ה-webhook', async () => {
    const { complete, out } = await resumeWith(
      {},
      {
        transport: vi.fn(async () => ({
          outcome: 'unknown',
          httpStatus: null,
          errorCode: 'TRANSPORT_UNKNOWN',
          detail: 'AbortError: request to https://hook.eu1.make.com/SECRET aborted',
        })),
      },
    )
    expect(complete).toMatchObject({ p_outcome: 'unknown', p_error_code: 'TRANSPORT_UNKNOWN' })
    expect(complete.p_error_detail).not.toContain('make.com')
    expect(out.attempt.state).toBe('unknown')
  })

  it('complete עצמו נכשל אחרי שליחה מוצלחת ⇒ מדווחים unknown (המצב השמור יהיה unknown)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { out, h } = await resumeWith({
      payroll_attempt_complete: () => ({
        data: null,
        error: { code: '08006', message: 'connection lost' },
      }),
    })
    expect(h.deps.transport).toHaveBeenCalledTimes(1)
    expect(out.attempt.state).toBe('unknown')
    spy.mockRestore()
  })

  it('complete מחזיר STALE_ATTEMPT (ניסיון חדש יותר כבר קיים) ⇒ לא דורסים, מדווחים unknown', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { out } = await resumeWith({ payroll_attempt_complete: () => raised('STALE_ATTEMPT') })
    expect(out.attempt.state).toBe('unknown')
    spy.mockRestore()
  })
})

describe('retry_accountant', () => {
  const body = {
    action: 'retry_accountant',
    report_id: 77,
    prior_attempt_id: 501,
    confirmed_recipient: ACCOUNTANT,
    acknowledge_unknown: true,
  }

  it('reserve בזהות המשתמשת ⇒ שליחת הניסיון החדש עם אותו קובץ', async () => {
    const h = issueHarness('committed', {
      payroll_accountant_retry_reserve: () => ok({ attempt_id: 502 }),
      payroll_attempt_claim: async () => ok(await accountantClaim(h.storage, { attempt_id: 502 })),
    })
    const out = await handleRequest(h.deps, body, CTX)
    expect(h.calls[0]).toMatchObject({
      side: 'user',
      name: 'payroll_accountant_retry_reserve',
      args: {
        p_report_id: 77,
        p_prior_attempt_id: 501,
        p_confirmed_recipient: ACCOUNTANT,
        p_acknowledge_unknown: true,
      },
    })
    expect(h.argsOf('payroll_attempt_claim').p_attempt_id).toBe(502)
    expect(out).toMatchObject({
      ok: true,
      report_id: 77,
      attempt: { attempt_id: 502, state: 'sent' },
    })
  })

  it.each([['DELIVERY_UNKNOWN'], ['NOT_RETRYABLE'], ['STALE_VERSION'], ['LEGACY_REPORT_MISMATCH']])(
    'reserve נדחה (%s) ⇒ אין שליחה',
    async (code) => {
      const h = harness({ payroll_accountant_retry_reserve: () => raised(code) })
      const out = await handleRequest(h.deps, body, CTX)
      expect(out).toMatchObject({ ok: false, code, extra: { report_id: 77 } })
      expect(h.deps.transport).not.toHaveBeenCalled()
      expect(h.names('admin')).toEqual([])
    },
  )
})

// ── מיילים אישיים לדיילות ─────────────────────────────────────────────────────

function reviewClaim(attemptId, overrides = {}) {
  return {
    attempt_id: attemptId,
    kind: 'personal_review',
    intended_recipient: `hostess${attemptId}@example.com`,
    report_id: null,
    recipient_id: 1000 + attemptId,
    artifact: null,
    period: '2026-07-01',
    report_kind: 'regular',
    supplement_seq: null,
    template_name: 'תבנית_מייל_סיכום_שעות_דיילת',
    hostess_name: `דיילת ${attemptId}`,
    response_deadline: '2026-10-20T15:00:00Z',
    review_id: 12,
    ...overrides,
  }
}

function reviewHarness(queuedIds, overrides = {}, extra = {}) {
  return harness(
    {
      payroll_review_distribute_begin: () =>
        ok({
          queued: queuedIds,
          skipped: [{ recipient_id: 77, code: 'CONTACT_MISSING' }],
          template: {},
        }),
      payroll_review_queued_attempts: () =>
        ok(queuedIds.map((id) => ({ attempt_id: id, recipient_id: 1000 + id }))),
      payroll_attempt_claim: (args) => ok(reviewClaim(args.p_attempt_id)),
      payroll_review_mint_token: (args) =>
        ok(`tok_${args.p_attempt_id}_abcdefghijklmnopqrstuvwxyz0123`),
      payroll_attempt_complete: () => ok({ ok: true }),
      ...overrides,
    },
    extra,
  )
}

const distributeBody = (overrides = {}) => ({
  action: 'distribute',
  review_id: 12,
  expected_revision: 3,
  recipient_ids: null,
  mode: 'initial',
  request_id: REQ,
  app_origin: ORIGIN,
  ...overrides,
})

describe('distribute', () => {
  it('begin בזהות המשתמשת ⇒ כל ניסיון: claim ⇒ mint ⇒ שליחה בלי מצורף ⇒ complete', async () => {
    const h = reviewHarness([1, 2])
    const out = await handleRequest(h.deps, distributeBody(), CTX)
    expect(h.calls[0]).toMatchObject({
      side: 'user',
      name: 'payroll_review_distribute_begin',
      args: {
        p_review_id: 12,
        p_expected_revision: 3,
        p_recipient_ids: null,
        p_mode: 'initial',
        p_request_id: REQ,
      },
    })
    expect(h.deps.transport).toHaveBeenCalledTimes(2)
    const sent = h.deps.transport.mock.calls[0][0]
    expect(sent.to).toBe('ishay1997@gmail.com')
    expect(sent.subject).toBe('[הופנה: hostess1@example.com] סיכום שעות לבדיקה — יולי 2026')
    expect(sent.body).toContain(`${ORIGIN}/payroll-review/tok_1_abcdefghijklmnopqrstuvwxyz0123`)
    expect(sent.body).toContain('שלום דיילת 1,')
    expect(sent.body).toContain('נבקש להשיב עד 20/10/2026 18:00.')
    expect(sent.filename).toBe('')
    expect(sent.pdf_base64).toBe('')
    expect(h.argsOf('payroll_review_mint_token')).toEqual({
      p_recipient_id: 1001,
      p_attempt_id: 1,
      p_actor_email: ACTOR,
    })
    expect(out).toEqual({
      ok: true,
      processed: [
        {
          attempt_id: 1,
          recipient_id: 1001,
          state: 'sent',
          delivered_recipient: 'ishay1997@gmail.com',
          redirected: true,
        },
        {
          attempt_id: 2,
          recipient_id: 1002,
          state: 'sent',
          delivered_recipient: 'ishay1997@gmail.com',
          redirected: true,
        },
      ],
      skipped: [{ recipient_id: 77, code: 'CONTACT_MISSING' }],
      remaining: 0,
    })
  })

  it('השלמה: הנושא נושא "— השלמה 1"', async () => {
    const h = reviewHarness([1], {
      payroll_attempt_claim: (args) =>
        ok(
          reviewClaim(args.p_attempt_id, {
            period: '2026-08-01',
            report_kind: 'supplement',
            supplement_seq: 1,
          }),
        ),
    })
    await handleRequest(h.deps, distributeBody(), CTX)
    expect(h.deps.transport.mock.calls[0][0].subject).toBe(
      '[הופנה: hostess1@example.com] סיכום שעות לבדיקה — אוגוסט 2026 — השלמה 1',
    )
  })

  it(`יותר מ-${DISTRIBUTE_BATCH} בתור ⇒ שולחים ${DISTRIBUTE_BATCH}, remaining = השאר`, async () => {
    const ids = Array.from({ length: 11 }, (_, i) => i + 1)
    const h = reviewHarness(ids)
    const out = await handleRequest(h.deps, distributeBody(), CTX)
    expect(h.deps.transport).toHaveBeenCalledTimes(DISTRIBUTE_BATCH)
    expect(out.remaining).toBe(11 - DISTRIBUTE_BATCH)
  })

  it('תקציב-הזמן נגמר ⇒ לא מתחילים ניסיון חדש; מה שלא התחיל נשאר בתור', async () => {
    let clock = 0
    const h = reviewHarness(
      [1, 2, 3],
      {},
      {
        now: () => clock,
        transport: vi.fn(async () => {
          clock += WALL_BUDGET_MS * 0.8
          return { outcome: 'sent', httpStatus: 200 }
        }),
      },
    )
    const out = await handleRequest(h.deps, distributeBody(), CTX)
    expect(h.deps.transport).toHaveBeenCalledTimes(1)
    expect(h.names().filter((n) => n === 'payroll_attempt_claim')).toHaveLength(1)
    expect(out.remaining).toBe(2)
  })

  it('מקור לא מורשה ⇒ ORIGIN_NOT_ALLOWED, ואין אף קריאה למסד', async () => {
    const h = reviewHarness([1])
    const out = await handleRequest(
      h.deps,
      distributeBody({ app_origin: 'https://evil.example' }),
      CTX,
    )
    expect(out.code).toBe('ORIGIN_NOT_ALLOWED')
    expect(h.calls).toHaveLength(0)
  })

  it('begin נדחה (MANAGER_REVIEW_REQUIRED) ⇒ אין שליחה', async () => {
    const h = reviewHarness([1], {
      payroll_review_distribute_begin: () => raised('MANAGER_REVIEW_REQUIRED'),
    })
    const out = await handleRequest(h.deps, distributeBody(), CTX)
    expect(out.code).toBe('MANAGER_REVIEW_REQUIRED')
    expect(h.deps.transport).not.toHaveBeenCalled()
  })

  it('הנפקת טוקן נכשלה ⇒ failed לניסיון הזה, השאר ממשיכים', async () => {
    const h = reviewHarness([1, 2], {
      payroll_review_mint_token: (args) =>
        args.p_attempt_id === 1
          ? raised('STALE_VERSION')
          : ok('tok_2_abcdefghijklmnopqrstuvwxyz0123'),
    })
    const out = await handleRequest(h.deps, distributeBody(), CTX)
    expect(out.processed.map((p) => p.state)).toEqual(['failed', 'sent'])
    expect(h.deps.transport).toHaveBeenCalledTimes(1)
  })

  it('טוקן בצורה לא צפויה ⇒ failed TOKEN_INVALID, בלי שליחה', async () => {
    const h = reviewHarness([1], { payroll_review_mint_token: () => ok('short') })
    const out = await handleRequest(h.deps, distributeBody(), CTX)
    expect(out.processed[0]).toMatchObject({ state: 'failed', code: 'TOKEN_INVALID' })
    expect(h.deps.transport).not.toHaveBeenCalled()
  })

  it('claim בלי שם דיילת או מועד ⇒ failed CLAIM_INCOMPLETE, בלי הנפקת טוקן', async () => {
    const h = reviewHarness([1], {
      payroll_attempt_claim: (args) =>
        ok(reviewClaim(args.p_attempt_id, { response_deadline: null })),
    })
    const out = await handleRequest(h.deps, distributeBody(), CTX)
    expect(out.processed[0]).toMatchObject({ state: 'failed', code: 'CLAIM_INCOMPLETE' })
    expect(h.names()).not.toContain('payroll_review_mint_token')
  })

  it('ניסיון שמישהו אחר כבר שולח (NOT_CLAIMABLE) ⇒ skipped', async () => {
    const h = reviewHarness([1], { payroll_attempt_claim: () => raised('NOT_CLAIMABLE') })
    const out = await handleRequest(h.deps, distributeBody(), CTX)
    expect(out.processed[0]).toMatchObject({ attempt_id: 1, state: 'skipped' })
    expect(h.deps.transport).not.toHaveBeenCalled()
  })

  it('queued_attempts בצורת {attempts:[…]} נתמך גם הוא', async () => {
    const h = reviewHarness([1], {
      payroll_review_queued_attempts: () => ok({ attempts: [{ attempt_id: 1 }], template: {} }),
    })
    const out = await handleRequest(h.deps, distributeBody(), CTX)
    expect(out.processed).toHaveLength(1)
  })
})

describe('distribute_continue / resend_review', () => {
  it('distribute_continue ⇒ queued_attempts בזהות המשתמשת ⇒ שליחה', async () => {
    const h = reviewHarness([4])
    const out = await handleRequest(
      h.deps,
      { action: 'distribute_continue', review_id: 12, app_origin: ORIGIN },
      CTX,
    )
    expect(h.calls[0]).toMatchObject({ side: 'user', name: 'payroll_review_queued_attempts' })
    expect(out).toMatchObject({
      ok: true,
      skipped: [],
      remaining: 0,
      processed: [{ attempt_id: 4, state: 'sent' }],
    })
  })

  it('distribute_continue בלי מקור ⇒ ORIGIN_NOT_ALLOWED', async () => {
    const h = reviewHarness([4])
    const out = await handleRequest(h.deps, { action: 'distribute_continue', review_id: 12 }, CTX)
    expect(out.code).toBe('ORIGIN_NOT_ALLOWED')
    expect(h.calls).toHaveLength(0)
  })

  it('resend_review ⇒ reserve ⇒ אותו מסלול שליחה, נתוני העיבוד מה-claim בלבד', async () => {
    const h = reviewHarness([], { payroll_review_resend_reserve: () => ok({ attempt_id: 9 }) })
    const out = await handleRequest(
      h.deps,
      {
        action: 'resend_review',
        recipient_id: 1009,
        prior_attempt_id: 8,
        acknowledge_unknown: true,
        app_origin: ORIGIN,
      },
      CTX,
    )
    expect(h.calls[0]).toMatchObject({
      side: 'user',
      name: 'payroll_review_resend_reserve',
      args: { p_recipient_id: 1009, p_prior_attempt_id: 8, p_acknowledge_unknown: true },
    })
    expect(h.names()).not.toContain('payroll_review_queued_attempts')
    expect(h.deps.transport.mock.calls[0][0].body).toContain('שלום דיילת 9,')
    expect(out).toMatchObject({ ok: true, attempt: { attempt_id: 9, state: 'sent' } })
  })

  it('resend_review נדחה (DELIVERY_UNKNOWN בלי אישור) ⇒ אין שליחה', async () => {
    const h = reviewHarness([], { payroll_review_resend_reserve: () => raised('DELIVERY_UNKNOWN') })
    const out = await handleRequest(
      h.deps,
      { action: 'resend_review', recipient_id: 1009, prior_attempt_id: 8, app_origin: ORIGIN },
      CTX,
    )
    expect(out.code).toBe('DELIVERY_UNKNOWN')
    expect(h.argsOf('payroll_review_resend_reserve').p_acknowledge_unknown).toBe(false)
    expect(h.deps.transport).not.toHaveBeenCalled()
  })
})
