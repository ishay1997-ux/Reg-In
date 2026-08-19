// בדיקות הטיוטה-בזיכרון של לשונית-הסגירה (צעד 3.5) — נועלות את חוזה-הפיילוד (8 מפתחות,
// preference ולא quality_mark, assignment_number לעולם לא מושמט), את כפיית-ט4-א על no_show,
// את ניתוק-ברירת-המחדל (ט4-ב) ואת שבע מחרוזות-הכרטיס עם דריסת-ה-2MB.
import { describe, it, expect } from 'vitest'
import {
  buildClosingRows,
  rowKey,
  rowEffectiveHours,
  applyAttendance,
  applyQuality,
  applyQualityReason,
  applyRowHours,
  NEGATIVE_QUALITY_LABEL,
  isRowMarked,
  markedRowsCount,
  assignedCounterText,
  totalActualCost,
  draftForValidation,
  buildPayloadRows,
  EVENT_HOURS_ERROR,
  EVENT_GUESTS_ERROR,
  reportFileErrorText,
  attendanceMissingError,
  qualityMissingError,
  NEGATIVE_REASON_ERROR,
  rowHoursError,
  eventHoursInvalid,
  eventGuestsInvalid,
  rowHoursUpperBound,
  rowHoursOutOfRange,
  fileSizeText,
  changeLineText,
  validateReportFile,
  isStalenessMessage,
  RESEND_STATE_SENTENCE,
  attendanceLabelFromColumns,
  qualityLabelFromValue,
} from '@/lib/closingDraft'

// שורות-שיבוץ גולמיות כתוצאת getProjectAssignments — כולל דיילת עם שתי שורות (סירבה-
// וזומנה-שוב), שבלי קיפול MAX(assignment_number) הייתה מופיעה פעמיים ברשימת-הסגירה
// ונדחית בשרת ("מופיעה פעמיים"). נתונים מגוונים בכוונה — לא מונוטוניים לפי אינדקס.
function assignmentFixture() {
  return [
    {
      project_id: 7,
      hostess_id: 11,
      assignment_number: 1,
      assignment_status: 'declined',
      hourly_rate_snapshot: 42,
      is_shift_lead: false,
      hostesses: { hostess_id: 11, full_name: 'מיכל אברהם', city: 'חיפה' },
    },
    {
      project_id: 7,
      hostess_id: 11,
      assignment_number: 2,
      assignment_status: 'finally_approved',
      hourly_rate_snapshot: 42,
      is_shift_lead: true,
      hostesses: { hostess_id: 11, full_name: 'מיכל אברהם', city: 'חיפה' },
    },
    {
      project_id: 7,
      hostess_id: 12,
      assignment_number: 1,
      assignment_status: 'finally_approved',
      hourly_rate_snapshot: 46,
      is_shift_lead: false,
      hostesses: { hostess_id: 12, full_name: 'תמר גולן', city: 'נתניה' },
    },
    // מוזמנת שטרם אושרה סופית — אינה על רשימת-הסגירה (הסט = finally_approved בלבד).
    {
      project_id: 7,
      hostess_id: 13,
      assignment_number: 1,
      assignment_status: 'pending',
      hourly_rate_snapshot: 44,
      is_shift_lead: false,
      hostesses: { hostess_id: 13, full_name: 'אביגיל רוזן', city: 'נתניה' },
    },
  ]
}

describe('buildClosingRows — הסט המדויק שה-RPC בודק שלושה-כיוונים', () => {
  it('רק finally_approved, ורק השורה הקובעת (MAX assignment_number) פר-דיילת', () => {
    const rows = buildClosingRows(assignmentFixture())
    expect(rows).toHaveLength(2)
    const michal = rows.find((r) => r.hostessId === 11)
    // הקיפול לקח את שורה 2 (המאושרת), לא את שורה 1 (הסירוב הישן).
    expect(michal.assignmentNumber).toBe(2)
    expect(michal.isShiftLead).toBe(true)
    expect(rows.map((r) => r.name)).toContain('תמר גולן')
  })

  it('התעריף הוא ה-snapshot מהשיבוץ, והשם הוא hostesses.full_name', () => {
    const rows = buildClosingRows(assignmentFixture())
    expect(rows.find((r) => r.hostessId === 12).rateSnapshot).toBe(46)
    expect(rows.every((r) => r.name.length > 0)).toBe(true)
  })

  it('אפס שיבוצים ⇒ מערך ריק (המצב-הריק החוקי #7, לא שגיאה)', () => {
    expect(buildClosingRows([])).toEqual([])
  })
})

describe('rowEffectiveHours + applyRowHours — ט4-ב: ברירת-מחדל, דריסה, ו-no_show', () => {
  it('שורה לא-נדרסת יורשת את שעות-האירוע; שינוי שעות-האירוע מזיז אותה', () => {
    const [row] = buildClosingRows(assignmentFixture())
    expect(rowEffectiveHours(row, 6.5)).toBe(6.5)
    expect(rowEffectiveHours(row, 7)).toBe(7)
  })

  it('הקלדה מנתקת את השורה מברירת-המחדל — גם כששעות-האירוע משתנות אחר-כך', () => {
    let rows = buildClosingRows(assignmentFixture())
    const key = rowKey(rows[0])
    rows = applyRowHours(rows, key, '5.5')
    const row = rows.find((r) => rowKey(r) === key)
    expect(rowEffectiveHours(row, 6.5)).toBe('5.5')
    expect(rowEffectiveHours(row, 8)).toBe('5.5') // מנותקת לתמיד (עד רענון)
    expect(row.hoursOverridden).toBe(true)
  })

  it('no_show ⇒ 0 כפוי, גם על שורה שנדרסה ידנית', () => {
    let rows = buildClosingRows(assignmentFixture())
    const key = rowKey(rows[0])
    rows = applyRowHours(rows, key, '5.5')
    rows = applyAttendance(rows, key, 'לא הגיעה — הבריזה')
    expect(
      rowEffectiveHours(
        rows.find((r) => rowKey(r) === key),
        6.5,
      ),
    ).toBe(0)
  })
})

describe('applyQuality — יציאה מהשלילי מוחקת את הסיבה', () => {
  it('סיבה שהוקלדה על "לא לשלוח שוב" נמחקת במעבר ל"מצוינת"', () => {
    let rows = buildClosingRows(assignmentFixture())
    const key = rowKey(rows[0])
    rows = applyQuality(rows, key, NEGATIVE_QUALITY_LABEL)
    rows = applyQualityReason(rows, key, 'איחרה מאוד ודיברה בטלפון')
    rows = applyQuality(rows, key, 'מצוינת')
    const row = rows.find((r) => rowKey(r) === key)
    expect(row.qualityLabel).toBe('מצוינת')
    expect(row.qualityReason).toBe('')
  })
})

describe('isRowMarked / assignedCounterText — "סומנה" = נוכחות + (איכות או לא-הגיעה)', () => {
  it('נוכחות בלבד אינה סימון; נוכחות+איכות כן; "לא הגיעה" מייתרת את האיכות', () => {
    let rows = buildClosingRows(assignmentFixture())
    const [k1, k2] = rows.map(rowKey)
    rows = applyAttendance(rows, k1, 'הגיעה')
    expect(isRowMarked(rows.find((r) => rowKey(r) === k1))).toBe(false)
    rows = applyQuality(rows, k1, 'בסדר')
    expect(isRowMarked(rows.find((r) => rowKey(r) === k1))).toBe(true)
    rows = applyAttendance(rows, k2, 'לא הגיעה — חולה')
    expect(isRowMarked(rows.find((r) => rowKey(r) === k2))).toBe(true)
    expect(markedRowsCount(rows)).toBe(2)
    expect(assignedCounterText(rows)).toBe('2 דיילות שובצו · כולן סומנו')
  })

  it('אפס שורות ⇒ אין מונה (המצב-הריק החוקי אינו "0 מתוך 0")', () => {
    expect(assignedCounterText([])).toBeNull()
  })
})

describe('totalActualCost — סכימת עלות-בפועל על התעריף הקפוא', () => {
  it('שתי שורות בתעריפים שונים, אחת נדרסת — הסכום נכון והשורה הנדרסת נספרת לפי הדריסה', () => {
    let rows = buildClosingRows(assignmentFixture())
    // מיכל 42 ₪ · תמר 46 ₪. תמר נדרסת ל-5.5.
    const tamar = rows.find((r) => r.hostessId === 12)
    rows = applyRowHours(rows, rowKey(tamar), '5.5')
    // 6.5×42 = 273 · 5.5×46 = 253 ⇒ 526
    expect(totalActualCost(rows, 6.5)).toBe(526)
  })
})

describe('buildPayloadRows — 📜 חוזה-הפיילוד: 8 מפתחות, preference, לעולם לא בלי assignment_number', () => {
  it('שורת "איחרה — בינוני" עם "בסדר" ⇒ השלישייה המדויקת + preference עברי', () => {
    let rows = buildClosingRows(assignmentFixture())
    const key = rowKey(rows.find((r) => r.hostessId === 11))
    rows = applyAttendance(rows, key, 'איחרה — בינוני')
    rows = applyQuality(rows, key, 'בסדר')
    const payload = buildPayloadRows(rows, 6.5).find((p) => p.hostess_id === 11)
    expect(payload).toEqual({
      hostess_id: 11,
      assignment_number: 2, // השורה הקובעת — לא 1
      attendance_status: 'late',
      lateness_level: 'medium',
      no_show_reason: null,
      actual_hours: 6.5,
      preference: 'בסדר',
      preference_reason: null,
    })
  })

  it('"לא לשלוח שוב" ⇒ הערך במסד לא_לשלוח + הסיבה; no_show ⇒ שעות 0 והעדפה null', () => {
    let rows = buildClosingRows(assignmentFixture())
    const [k1, k2] = rows.map(rowKey)
    rows = applyAttendance(rows, k1, 'הגיעה')
    rows = applyQuality(rows, k1, NEGATIVE_QUALITY_LABEL)
    rows = applyQualityReason(rows, k1, 'עישנה מול אורחים')
    rows = applyAttendance(rows, k2, 'לא הגיעה — הבריזה')
    rows = applyQuality(rows, k2, 'מצוינת') // יסונן — אי-אפשר לשפוט מי שלא ראית
    const payloads = buildPayloadRows(rows, 6.5)
    const p1 = payloads.find(
      (p) => rowKey({ hostessId: p.hostess_id, assignmentNumber: p.assignment_number }) === k1,
    )
    expect(p1.preference).toBe('לא_לשלוח')
    expect(p1.preference_reason).toBe('עישנה מול אורחים')
    const p2 = payloads.find(
      (p) => rowKey({ hostessId: p.hostess_id, assignmentNumber: p.assignment_number }) === k2,
    )
    expect(p2.attendance_status).toBe('no_show')
    expect(p2.no_show_reason).toBe('ghosted')
    expect(p2.actual_hours).toBe(0)
    expect(p2.preference).toBeNull()
    expect(p2.preference_reason).toBeNull()
  })

  it('שעות שנדרסו כמחרוזת יוצאות ב-payload כמספר', () => {
    let rows = buildClosingRows(assignmentFixture())
    const key = rowKey(rows[0])
    rows = applyAttendance(rows, key, 'הגיעה')
    rows = applyRowHours(rows, key, '5.5')
    const payload = buildPayloadRows(rows, 6.5).find((p) => p.hostess_id === rows[0].hostessId)
    expect(payload.actual_hours).toBe(5.5)
    expect(typeof payload.actual_hours).toBe('number')
  })
})

describe('draftForValidation — הגשר אל closingValidationSummary של צעד 2.3', () => {
  it('שורת no_show עוברת עם שעות 0 ואינה נספרת כחסרת-איכות', () => {
    let rows = buildClosingRows(assignmentFixture())
    rows = applyAttendance(rows, rowKey(rows[0]), 'לא הגיעה — חולה')
    const draft = draftForValidation({
      rows,
      eventHours: '6.5',
      eventGuests: '180',
      hasReport: true,
    })
    expect(draft.rows[0].actualHours).toBe(0)
    expect(draft.actualHours).toBe('6.5')
  })
})

describe('שבע מחרוזות-הכרטיס — מילה-במילה, עם דריסת-ה-2MB המרונדרת מהקבוע', () => {
  it('שני שדות-האירוע', () => {
    expect(EVENT_HOURS_ERROR).toBe('חובה להזין שעות ביצוע — מספר בין 0.5 ל-24.')
    expect(EVENT_GUESTS_ERROR).toBe('חובה להזין כמות אורחים בפועל. אם לא הגיע איש — הזיני 0.')
  })

  it('מחרוזת-הקובץ נגזרת מהקבוע — 2MB, לא ה-10MB שבכרטיס (superseded, הכרעת-ישי 14/08)', () => {
    expect(reportFileErrorText(2 * 1024 * 1024)).toBe(
      'חובה לצרף דוח-סיכום. קבצי PDF, JPG או PNG בלבד, עד 2MB.',
    )
  })

  it('ארבע מחרוזות-השורה', () => {
    expect(attendanceMissingError('קרן אשכנזי')).toBe('חסר סימון נוכחות ל-קרן אשכנזי.')
    expect(qualityMissingError('תמר גולן')).toBe('חסר סימון איכות ל-תמר גולן.')
    expect(NEGATIVE_REASON_ERROR).toBe("סימון 'לא לשלוח שוב' מחייב סיבה — היא תופיע בכרטיס הדיילת.")
    expect(rowHoursError('מיכל אברהם', 6.5)).toBe(
      'מיכל אברהם: שעות בפועל חייבות להיות בין 0 ל-8.5.',
    )
  })
})

describe('גבולות-הקלט — הבית היחיד (כלל 14), אותם מספרים כמו closingValidationSummary', () => {
  it('שעות-אירוע: 0.5–24 כולל; ריק/לא-מספר/מחוץ-לתחום פסולים', () => {
    expect(eventHoursInvalid(0.5)).toBe(false)
    expect(eventHoursInvalid(24)).toBe(false)
    expect(eventHoursInvalid('6.5')).toBe(false)
    expect(eventHoursInvalid(0.4)).toBe(true)
    expect(eventHoursInvalid(24.5)).toBe(true)
    expect(eventHoursInvalid(null)).toBe(true)
    expect(eventHoursInvalid('')).toBe(true)
  })

  it('אורחים: ≥ 0; ריק פסול (Number("") הוא 0 — ולכן ריק נפסל במפורש, לא מתחזה ל-0)', () => {
    expect(eventGuestsInvalid(0)).toBe(false)
    expect(eventGuestsInvalid(180)).toBe(false)
    expect(eventGuestsInvalid(-1)).toBe(true)
    expect(eventGuestsInvalid(null)).toBe(true)
    expect(eventGuestsInvalid('')).toBe(true)
  })

  it('הגבול העליון של שעות-שורה: שעות-האירוע + 2, ו-null כשאין שעות-אירוע', () => {
    expect(rowHoursUpperBound(6.5)).toBe(8.5)
    expect(rowHoursUpperBound(null)).toBeNull()
    expect(rowHoursUpperBound('')).toBeNull()
  })

  it('rowHoursOutOfRange: רק שורה שנדרסה נבדקת, no_show לעולם לא, והגבול הוא +2', () => {
    let rows = buildClosingRows(assignmentFixture())
    const key = rowKey(rows[0])
    // לא נדרסה — ברירת-המחדל תקפה מעצם היותה שעות-האירוע.
    expect(rowHoursOutOfRange(rows[0], 6.5)).toBe(false)
    // נדרסה לערך מעל הגבול (6.5+2=8.5) ⇒ שגויה; בתוך הגבול ⇒ תקינה.
    rows = applyRowHours(rows, key, '9')
    expect(
      rowHoursOutOfRange(
        rows.find((r) => rowKey(r) === key),
        6.5,
      ),
    ).toBe(true)
    rows = applyRowHours(rows, key, '8.5')
    expect(
      rowHoursOutOfRange(
        rows.find((r) => rowKey(r) === key),
        6.5,
      ),
    ).toBe(false)
    // דריסה שנמחקה (ריק בכוונה) ⇒ שגויה — ריק אינו 0.
    rows = applyRowHours(rows, key, '')
    expect(
      rowHoursOutOfRange(
        rows.find((r) => rowKey(r) === key),
        6.5,
      ),
    ).toBe(true)
    // no_show משבית את השדה — לעולם לא שגיאה, גם על דריסה ישנה מחוץ לגבול.
    rows = applyRowHours(rows, key, '99')
    rows = applyAttendance(rows, key, 'לא הגיעה — חולה')
    expect(
      rowHoursOutOfRange(
        rows.find((r) => rowKey(r) === key),
        6.5,
      ),
    ).toBe(false)
  })
})

describe('fileSizeText — MB בעשירית מ-1MB ומעלה, KB עם רצפת 1KB מתחת', () => {
  it('הגדלים המוצגים בשורת-הקובץ', () => {
    expect(fileSizeText(1.85 * 1024 * 1024)).toBe('1.9MB')
    expect(fileSizeText(512 * 1024)).toBe('512KB')
    // קובץ בן כמה בייטים הוא "1KB", לא "0KB" שנקרא כקובץ ריק.
    expect(fileSizeText(16)).toBe('1KB')
    expect(fileSizeText(NaN)).toBe('')
  })
})

describe('changeLineText — שורת-הפירוט של מקטע שינויי-התכולה (㉔)', () => {
  it('לוגיסטיקה במק"ט (עם צבע), כמות-דיילות בתווית, וסימן + מפורש להגדלה', () => {
    expect(
      changeLineText({
        change_target: 'logistics',
        sku: 'B-REG-TAG',
        color: 'כחול',
        delta_qty: 80,
      }),
    ).toBe('B-REG-TAG · כחול: +80')
    expect(
      changeLineText({ change_target: 'logistics', sku: 'B-FAB-LAN', color: null, delta_qty: -50 }),
    ).toBe('B-FAB-LAN: -50')
    expect(changeLineText({ change_target: 'hostess_count', sku: null, delta_qty: 2 })).toBe(
      'כמות הדיילות: +2',
    )
  })
})

describe('validateReportFile — סוג/גודל מול מגבלות-ה-bucket', () => {
  const limits = {
    maxBytes: 2 * 1024 * 1024,
    allowedMime: ['application/pdf', 'image/jpeg', 'image/png'],
  }

  it('PDF בגודל חוקי ⇒ null; סוג זר או גודל-יתר ⇒ מחרוזת-הכרטיס', () => {
    expect(validateReportFile({ type: 'application/pdf', size: 1024 }, limits)).toBeNull()
    expect(validateReportFile({ type: 'application/zip', size: 1024 }, limits)).toBe(
      reportFileErrorText(limits.maxBytes),
    )
    expect(validateReportFile({ type: 'image/png', size: 3 * 1024 * 1024 }, limits)).toBe(
      reportFileErrorText(limits.maxBytes),
    )
  })
})

describe('staleness (as-built ③) ומשפט-השליחה-החוזרת', () => {
  it('הודעת ה-P0001 של השרת מזוהה כמצב-בשם; שגיאה אחרת לא', () => {
    expect(
      isStalenessMessage(
        'רשימת-הסגירה אינה מעודכנת: הזימון של תמר גולן השתנה מאז שהמסך נטען. רענני את המסך ונסי שוב.',
      ),
    ).toBe(true)
    expect(isStalenessMessage('סגירת האירוע נכשלה.')).toBe(false)
    expect(isStalenessMessage(null)).toBe(false)
  })

  it('משפט-המצב של השליחה-החוזרת — מילה-במילה מהמדריך', () => {
    expect(RESEND_STATE_SENTENCE).toBe('הסגירה נשמרה. מייל הסקר לא יצא — אפשר לשלוח שוב.')
  })
})

describe('שחזור תוויות למצב-הנעול — שלוש עמודות ⇒ תווית, ערך-מסד ⇒ תווית', () => {
  it('כל שבע השלישיות חוזרות לתווית המקורית', () => {
    // round-trip על כל שבע האפשרויות — מוכיח שהמיפוי ההפוך שלם, לא רק דגימה.
    const tuples = [
      { attendance_status: 'arrived', lateness_level: null, no_show_reason: null },
      { attendance_status: 'late', lateness_level: 'light', no_show_reason: null },
      { attendance_status: 'late', lateness_level: 'medium', no_show_reason: null },
      { attendance_status: 'late', lateness_level: 'heavy', no_show_reason: null },
      { attendance_status: 'no_show', lateness_level: null, no_show_reason: 'sick' },
      { attendance_status: 'no_show', lateness_level: null, no_show_reason: 'approved_absence' },
      { attendance_status: 'no_show', lateness_level: null, no_show_reason: 'ghosted' },
    ]
    const labels = tuples.map(attendanceLabelFromColumns)
    expect(labels).toEqual([
      'הגיעה',
      'איחרה — קל',
      'איחרה — בינוני',
      'איחרה — רב',
      'לא הגיעה — חולה',
      'לא הגיעה — אישור מראש',
      'לא הגיעה — הבריזה',
    ])
    expect(attendanceLabelFromColumns({ attendance_status: null })).toBeNull()
  })

  it('ערכי-האיכות: לא_לשלוח ⇒ "לא לשלוח שוב"; ערך זר ⇒ null (—)', () => {
    expect(qualityLabelFromValue('לא_לשלוח')).toBe('לא לשלוח שוב')
    expect(qualityLabelFromValue('מצוינת')).toBe('מצוינת')
    expect(qualityLabelFromValue(undefined)).toBeNull()
  })
})
