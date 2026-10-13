// נתוני-בדיקה למרחב דוח השכר — בנויים לפי צורות ה-JSON המחייבות של חוזה §4.3 (+ F6).
// משמשים את בדיקות היחידה ואת מסך-ההדגמה המקומי (צילומי המסך). שמות ומספרים סינתטיים;
// אין כאן אף אדם אמיתי. כל סכום מוקלד, לא מחושב: הבדיקות לא מחשבות שכר מחדש.

const PERIOD = '2026-07-01'

export function previewLine(overrides = {}) {
  return {
    project_id: 900101,
    hostess_id: 900001,
    assignment_number: 1,
    event_date: '2026-07-05',
    event_name: 'כנס מדע תל אביב',
    line_basis: 'actual',
    hours: 6,
    hours_raw: 6,
    rate: 45,
    bonus: 0,
    travel: 22.6,
    line_total: 292.6,
    show_in_file: true,
    hostess_name: 'נועה לוי',
    id_number: '012345678',
    bank_name: 'הפועלים',
    bank_branch: '601',
    bank_account: '2047199',
    defects: [],
    warnings: [],
    ...overrides,
  }
}

export function compensationLine(overrides = {}) {
  return previewLine({
    project_id: 900102,
    hostess_id: 900002,
    event_name: 'השקת מוצר — בוטל',
    event_date: '2026-07-12',
    line_basis: 'cancellation_compensation',
    hours: 4,
    hours_raw: 4,
    rate: 40,
    bonus: null,
    travel: null,
    line_total: 160,
    hostess_name: 'מאיה כהן',
    id_number: '204455667',
    bank_name: null,
    bank_branch: null,
    bank_account: null,
    ...overrides,
  })
}

export function makePreview(overrides = {}) {
  const lines = overrides.lines ?? [previewLine(), compensationLine()]
  const total = lines.reduce((sum, l) => sum + Math.round((l.line_total ?? 0) * 100), 0) / 100
  return {
    ok: true,
    period: PERIOD,
    period_end: '2026-07-31',
    kind: 'regular',
    original_report_id: null,
    original: null,
    supplement_seq_next: null,
    month_state: 'ended',
    captured_at: '2026-10-13T09:30:00.000Z',
    version: 'v1:abc',
    totals: {
      line_count: lines.length,
      file_line_count: lines.filter((l) => l.show_in_file).length,
      hostess_count: new Set(lines.map((l) => l.hostess_id)).size,
      total_amount: total,
      bonus_total: 0,
      travel_total: 22.6,
      zero_line_count: lines.filter((l) => !l.show_in_file).length,
    },
    lines,
    pending_closure: { ok: true, project_count: 0, assignment_count: 0, projects: [] },
    blockers: [],
    warnings: [],
    accountant: {
      recipient: 'office@accountant.example',
      recipient_valid: true,
      template_valid: true,
      delivered: 'ishay1997@gmail.com',
      redirected: true,
    },
    active_review: null,
    active_operation: null,
    ...overrides,
  }
}

export function recipient(overrides = {}) {
  return {
    recipient_id: 700001,
    hostess_id: 900001,
    hostess_name: 'נועה לוי',
    total: 292.6,
    total_hours: 6,
    row_count: 1,
    state: 'awaiting',
    decided_kind: null,
    decided_at: null,
    decision_reason: null,
    digest: 'd1:aaa',
    digest_current: true,
    contact_changed: false,
    email_present: true,
    delivery: {
      attempt_id: 800001,
      state: 'sent',
      intended_recipient: 'noa@example.com',
      delivered_recipient: 'ishay1997@gmail.com',
      redirected: true,
      completed_at: '2026-10-13T10:00:00.000Z',
      attempts_count: 1,
    },
    open_case_id: null,
    last_action_at: '2026-10-13T10:00:00.000Z',
    ...overrides,
  }
}

export function makeReadiness(overrides = {}) {
  return {
    ready: false,
    blockers: [{ code: 'DECISIONS_MISSING', count: 1 }],
    counts: {
      hostesses: 2,
      hostess_approved: 1,
      manager_approved: 0,
      manager_resolved: 0,
      awaiting: 1,
      open_cases: 0,
      correction_pending: 0,
      stale_digest: 0,
      not_covered: 0,
      never_sent: 0,
      delivery_failed: 0,
      delivery_unknown: 0,
    },
    ...overrides,
  }
}

export function makeReview({ review = {}, recipients, cases = [], readiness } = {}) {
  return {
    ok: true,
    review: {
      review_id: 600001,
      period: PERIOD,
      kind: 'regular',
      original_report_id: null,
      revision: 1,
      status: 'open',
      version_current: true,
      manager_approved: true,
      manager_approved_at: '2026-10-13T09:40:00.000Z',
      manager_approved_by: 'finance@example.com',
      response_deadline: '2026-10-14T15:00:00.000Z',
      deadline_passed: false,
      distributed_at: '2026-10-13T10:00:00.000Z',
      report_id: null,
      ...review,
    },
    recipients: recipients ?? [
      recipient(),
      recipient({
        recipient_id: 700002,
        hostess_id: 900002,
        hostess_name: 'מאיה כהן',
        total: 160,
        total_hours: 11.5,
        state: 'hostess_approved',
      }),
    ],
    cases,
    readiness: readiness ?? makeReadiness(),
  }
}

export function opStatus(overrides = {}) {
  return {
    ok: true,
    operation_id: '11111111-1111-4111-8111-111111111111',
    state: 'committed',
    failure_code: null,
    review_id: 600001,
    period: PERIOD,
    kind: 'regular',
    original_report_id: null,
    report_id: 31,
    updated_at: '2026-10-13T11:00:00.000Z',
    accountant_attempt: {
      attempt_id: 810001,
      state: 'sent',
      intended_recipient: 'office@accountant.example',
      delivered_recipient: 'ishay1997@gmail.com',
      completed_at: '2026-10-13T11:00:05.000Z',
    },
    next_action: 'none',
    ...overrides,
  }
}

export function reportItem(overrides = {}) {
  return {
    report_id: 31,
    period: PERIOD,
    report_kind: 'regular',
    original_report_id: null,
    supplement_seq: null,
    total_amount: 452.6,
    line_count: 2,
    issued_at: '2026-10-13T11:00:00.000Z',
    send_status: 'sent',
    delivery_state: 'sent',
    legacy: false,
    artifact_available: true,
    artifact_filename: '07_2026_Payroll_Report.xlsx',
    last_attempt: {
      state: 'sent',
      intended_recipient: 'office@accountant.example',
      delivered_recipient: 'ishay1997@gmail.com',
      completed_at: '2026-10-13T11:00:05.000Z',
    },
    open_post_issue_cases: 0,
    ...overrides,
  }
}

export function frozenLine(overrides = {}) {
  return {
    line_id: 1,
    report_id: 31,
    hostess_id: 900001,
    hostess_name: 'נועה לוי',
    id_number: '012345678',
    source_project_id: 900101,
    assignment_number: 1,
    event_date: '2026-07-05',
    event_name: 'כנס מדע תל אביב',
    line_basis: 'actual',
    hours: 6,
    rate: 45,
    bonus: null,
    travel: 22.6,
    line_total: 292.6,
    ...overrides,
  }
}

export function reportDetail(overrides = {}) {
  return {
    ok: true,
    ...reportItem(),
    lines: [
      frozenLine(),
      frozenLine({
        line_id: 2,
        hostess_id: 900002,
        hostess_name: 'מאיה כהן',
        id_number: '204455667',
        source_project_id: 900102,
        event_name: 'השקת מוצר — בוטל',
        line_basis: 'cancellation_compensation',
        hours: 4,
        rate: 40,
        bonus: null,
        travel: null,
        line_total: 160,
      }),
    ],
    attempts: [
      {
        attempt_id: 810001,
        state: 'sent',
        intended_recipient: 'office@accountant.example',
        delivered_recipient: 'ishay1997@gmail.com',
        redirected: true,
        created_at: '2026-10-13T11:00:00.000Z',
        completed_at: '2026-10-13T11:00:05.000Z',
      },
    ],
    artifact: {
      key: 'payroll/2026-07/op/1_07_2026_Payroll_Report.xlsx',
      filename: '07_2026_Payroll_Report.xlsx',
      sha256: 'abc',
      size: 9000,
      reference_missing: false,
    },
    review: { review_id: 600001, counts: {} },
    supplements: [],
    original: null,
    post_issue_cases: [],
    ...overrides,
  }
}

export function caseDetail(overrides = {}) {
  return {
    ok: true,
    case: {
      case_id: 500001,
      recipient_id: 700001,
      hostess_id: 900001,
      hostess_name: 'נועה לוי',
      phase: 'pre_issue',
      category: 'hours',
      affected_rows: ['r1'],
      missing_shift: false,
      description: 'עבדתי 7 שעות ולא 6',
      suggested_value: 7,
      status: 'open',
      revision: 1,
      created_at: '2026-10-13T12:00:00.000Z',
      resolution_reason: null,
    },
    snapshot_rows: [
      {
        key: 'r1',
        project_id: 900101,
        assignment_number: 1,
        event_date: '2026-07-05',
        event_name: 'כנס מדע תל אביב',
        line_basis: 'actual',
        hours: 6,
      },
    ],
    current_rows: [
      {
        project_id: 900101,
        assignment_number: 1,
        event_date: '2026-07-05',
        event_name: 'כנס מדע תל אביב',
        line_basis: 'actual',
        hours: 6,
        actual_hours: 6,
        bonus: 0,
        personal_bonus: 0,
        attendance_status: 'attended',
        project_actual_hours: 6,
        project_status: 'awaiting_invoice',
        salary_report_id: null,
      },
    ],
    corrections: [],
    ...overrides,
  }
}
