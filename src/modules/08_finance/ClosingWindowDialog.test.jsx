// בדיקות חלון סגירת-תיק הפרויקט (מודול 8 · משטח S2, צעד 3.2).
//
// 🔑 **מה הבדיקות האלה נועלות, ולמה דווקא את זה:**
// ① **שער-הארכוב** — משפט-החסימה נבנה ממה שבאמת חסר, והמופע שהמוקאפ המאושר צייר מושווה
//    **בייט-בבייט**. שער שנפתח בטעות מקפיא רווח על פרויקט שלא שולם, ואין אחריו undo.
// ② **מכונת-המצבים** — ‏Q-1 (הכרעת-ישי 26/08/2026) הוסיפה מצב רביעי שאיש לא צייר; המעבר
//    בין ארבעת המצבים הוא הדבר היחיד שקובע איזה כפתור קיים על המסך.
// ③ **חוזה-שלושת-המצבים של המייל** — מייל שנכשל **אינו** מסמן "נשלח" (כרטיס-P1). זו הטעות
//    היחידה כאן שמייצרת פרויקט שהמערכת חושבת שחויב והלקוח לא קיבל דבר.
// ④ **שער-הצורה** — שורת-RPC שאיבדה עמודה מפילה את המסך ברעש ולא מציירת `—` על כל שדה.
//
// 🔑 **המספרים מוקלדים מהרגיסטרים, לא מחושבים מהקוד הנבדק** (מדריך-המיקרו §4.3):
// ‏3,650.00 (רווח #13) · 3,508.00 (תת-סכום דמי-הביטול #14) · ‏−692.00 (סטיית-התקציב) —
// שלושתם מ-`data-set.md` דרך המוקאפ המאושר `02_closing_window_approved.html`.
//
// ⚠️ **מה הן אינן מוכיחות:** אין כאן Supabase אמיתי ⇒ אין הוכחת-RLS ואין הוכחה שה-RPC
// מחזיר את הצורה הזאת בפועל. שני אלה נבדקים חי בצעדים 4.4/5.1.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { ToastProvider } from '@/components/ToastProvider'
import { compensationReason } from '@/lib/projectCancellation'
import ClosingWindowDialog, {
  archiveGateNote,
  closingPhase,
  feeSaveGateNote,
  feedbackGateNote,
  formatHoursBeforeEvent,
  waiveGateNote,
} from './ClosingWindowDialog'
import {
  INVOICE_FILE_REQUIRED_NOTE,
  archiveProject,
  getBillingContact,
  getCancellationFeeProposal,
  getFinanceDetail,
  recordFeedback,
  recordPayment,
  recordWriteOff,
  resolveCancellationFee,
  sendInvoiceAndRecord,
} from './api'

// ‏`api.js` מייבא את `@/supabaseClient`, שקורא ל-`createClient(import.meta.env…)` בזמן-טעינה
// ⇒ בלי `.env.local` (למשל ב-CI) הקובץ נכשל-בטעינה לפני שבדיקה רצה. אותו דפוס כמו
// ב-`api.test.js` של המודול.
vi.mock('@/supabaseClient', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn(), storage: { from: vi.fn() } },
}))

// 🔴 **מוק חלקי במכוון** (‏`importOriginal`): הפונקציות שנוגעות ברשת ממוקקות, אבל
// ‏`INVOICE_FILE_REQUIRED_NOTE`, ‏`validateInvoiceFile` ו-`fileNameOf` נשארים **האמיתיים**.
// מוק מלא היה מחייב אותי להקליד את הנוסח הנעול בקובץ-הבדיקה — ואז הבדיקה הייתה משווה
// מחרוזת לעצמה, ושינוי בנוסח שבקוד היה עובר ירוק.
vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal()),
  archiveProject: vi.fn(),
  getBillingContact: vi.fn(),
  getCancellationFeeProposal: vi.fn(),
  getFinanceDetail: vi.fn(),
  recordFeedback: vi.fn(),
  recordPayment: vi.fn(),
  recordWriteOff: vi.fn(),
  resolveCancellationFee: vi.fn(),
  sendInvoiceAndRecord: vi.fn(),
}))

// ── עוגנים ──────────────────────────────────────────────────────────────────────────
// המשפט שהמוקאפ המאושר מדפיס בתצוגה א׳ (‏`.gate-note` בפוטר), מילה-במילה.
const DRAWN_ARCHIVE_GATE =
  '🔒 חסום: חשבונית טרם נשלחה ולא נרשם תאריך-תשלום — שער-הארכוב דורש גם תשלום וגם משוב-פתור (ה10 / כרטיס-P3). המשוב כאן כבר תקין; התשלום עדיין חסר.'

// #12 "כנס משקיעים שנתי" — תצוגה א׳: נסגר תפעולית, חשבונית טרם נשלחה, משוב בציון 2 מתועד.
function detailRow(over = {}) {
  return {
    project_id: 12,
    event_name: 'כנס משקיעים שנתי',
    customer_id: 5,
    customer_name: 'קבוצת אחזקות דנוך בע"מ',
    project_status: 'awaiting_invoice',
    revenue: '5300.00',
    goods_cost: '0.00',
    labor_cost: '1650.00',
    travel_cost: '0.00',
    gross_profit: '3650.00',
    budget_deviation: '-692.00',
    final_profit: null,
    cancellation_fee: null,
    cancellation_fee_note: null,
    written_off: false,
    written_off_reason: null,
    invoice_file_url: null,
    invoice_sent: false,
    invoice_sent_at: null,
    payment_date: null,
    payment_terms_days: 30,
    feedback_status: 'completed',
    feedback_score: 2,
    negative_feedback_reason: 'תפקוד דיילות',
    feedback_notes: 'הדיילת הגיעה לא-מוכנה; תועדה שיחת-בירור.',
    cancelled_at: null,
    cancel_type: null,
    archived_at: null,
    ...over,
  }
}

// #14 "כנס פתיחת שנה" — הצעת דמי-הביטול: 328.00 + 3,180.00 = 3,508.00 (עוגן-היד).
function proposalRow(over = {}) {
  return {
    compensation_pct: '50',
    hours_before_event: '30.0',
    team_compensation: '328.00',
    goods_at_price: '3180.00',
    goods_at_cost: '1420.00',
    proposed_fee: '3508.00',
    planned_hours: '4.00',
    compensated_count: 4,
    ...over,
  }
}

function billingRow(over = {}) {
  return {
    customer_id: 5,
    company_name: 'קבוצת אחזקות דנוך בע"מ',
    contact_name: 'בודק אוטומטי',
    email: 'ishay1997@gmail.com',
    ...over,
  }
}

// שורת-S1 שממנה נפתח החלון. שני שדות-התצוגה שאינם ב-RPC של S2 חיים כאן בלבד.
function s1Row(over = {}) {
  return {
    project_id: 12,
    event_name: 'כנס משקיעים שנתי',
    customer_name: 'קבוצת אחזקות דנוך בע"מ',
    operationally_closed_at: '2026-08-20T21:06:00Z',
    credit_note_flag: false,
    ...over,
  }
}

function renderDialog(props = {}) {
  return render(
    <ConfirmProvider>
      <ToastProvider>
        <ClosingWindowDialog
          project={props.project ?? s1Row()}
          open
          onOpenChange={props.onOpenChange ?? vi.fn()}
          onChanged={props.onChanged ?? vi.fn()}
        />
      </ToastProvider>
    </ConfirmProvider>,
  )
}

async function renderLoaded(props = {}) {
  renderDialog(props)
  await screen.findByTestId('closing-meta')
}

beforeEach(() => {
  vi.clearAllMocks()
  getFinanceDetail.mockResolvedValue(detailRow())
  getBillingContact.mockResolvedValue(billingRow())
  getCancellationFeeProposal.mockResolvedValue(proposalRow())
})

// ── ① שער-הארכוב — פונקציה טהורה, נבדקת ישירות ─────────────────────────────────────
describe('archiveGateNote', () => {
  it('משחזר מילה-במילה את משפט-החסימה שצויר במוקאפ המאושר', () => {
    expect(
      archiveGateNote({
        invoiceSent: false,
        paid: false,
        writtenOff: false,
        feedbackResolved: true,
      }),
    ).toBe(DRAWN_ARCHIVE_GATE)
  })

  it('אומר "לא נרשם תאריך-תשלום" בלבד כשהחשבונית כבר יצאה — לא את משפט-החשבונית', () => {
    const note = archiveGateNote({
      invoiceSent: true,
      paid: false,
      writtenOff: false,
      feedbackResolved: true,
    })
    expect(note).toContain('🔒 חסום: לא נרשם תאריך-תשלום —')
    expect(note).not.toContain('חשבונית טרם נשלחה')
  })

  it('כשהתשלום תקין והמשוב לא — מחליף צדדים בשתי השורות', () => {
    const note = archiveGateNote({
      invoiceSent: true,
      paid: true,
      writtenOff: false,
      feedbackResolved: false,
    })
    expect(note).toContain('🔒 חסום: המשוב טרם נפתר —')
    expect(note).toContain('התשלום כאן כבר תקין; המשוב עדיין חסר.')
  })

  it('כששני הצדדים חסרים — מונה את שניהם ואינו מנחם באף אחד מהם', () => {
    const note = archiveGateNote({
      invoiceSent: false,
      paid: false,
      writtenOff: false,
      feedbackResolved: false,
    })
    expect(note).toContain('חשבונית טרם נשלחה ולא נרשם תאריך-תשלום, והמשוב טרם נפתר')
    expect(note).not.toContain('כבר תקין')
  })

  // 🔴 המסלול שהמסך לא הכיר: הדף הציבורי כותב `completed` עם ציון 2 ובלי סיבה (אין לו
  // שדה-סיבה כלל), ו-`archive_project` חוסמת זאת. שער-מסך שלא ידע זאת היה מציג כפתור
  // פעיל שלחיצה עליו נכשלת בשרת.
  it('ציון נמוך בלי סיבה חוסם — גם כשהמשוב "נפתר" וגם כשהתשלום נרשם', () => {
    const note = archiveGateNote({
      invoiceSent: true,
      paid: true,
      writtenOff: false,
      feedbackResolved: true,
      feedbackScore: 2,
      feedbackReason: null,
    })
    expect(note).toContain('הלקוח נתן ציון 2 ונדרשים בירור טלפוני ובחירת סיבה')
    expect(
      archiveGateNote({
        invoiceSent: true,
        paid: true,
        writtenOff: false,
        feedbackResolved: true,
        feedbackScore: 2,
        feedbackReason: '   ',
      }),
    ).toBe(note)
  })

  it('אותו ציון נמוך עם סיבה — השער נפתח; ציון גבוה בלי סיבה אינו נחסם כלל', () => {
    expect(
      archiveGateNote({
        invoiceSent: true,
        paid: true,
        writtenOff: false,
        feedbackResolved: true,
        feedbackScore: 2,
        feedbackReason: 'תפקוד דיילות',
      }),
    ).toBeNull()
    expect(
      archiveGateNote({
        invoiceSent: true,
        paid: true,
        writtenOff: false,
        feedbackResolved: true,
        feedbackScore: 4,
        feedbackReason: null,
      }),
    ).toBeNull()
  })

  it('חוב-אבוד פותח את צד-התשלום בדיוק כמו תשלום שנרשם (P3)', () => {
    expect(
      archiveGateNote({
        invoiceSent: true,
        paid: false,
        writtenOff: true,
        feedbackResolved: true,
      }),
    ).toBeNull()
    expect(
      archiveGateNote({
        invoiceSent: true,
        paid: true,
        writtenOff: false,
        feedbackResolved: true,
      }),
    ).toBeNull()
  })
})

// ── ② מכונת-המצבים ─────────────────────────────────────────────────────────────────
describe('closingPhase', () => {
  it('ארכוב נועל, וגם ביטול שנפתר (רווח קפוא) נועל — Q-4', () => {
    expect(
      closingPhase(detailRow({ project_status: 'finished', archived_at: '2026-09-06T10:00:00Z' }))
        .locked,
    ).toBe(true)
    expect(
      closingPhase(detailRow({ project_status: 'cancelled', final_profit: '-1200.00' })).locked,
    ).toBe(true)
  })

  it('מבוטל בלי סכום — מציג את הצעת דמי-הביטול ואינו מציג חשבונית', () => {
    const phase = closingPhase(detailRow({ project_status: 'cancelled' }))
    expect(phase.showFeeProposal).toBe(true)
    expect(phase.showInvoiceBlock).toBe(false)
    expect(phase.showFeedbackBlock).toBe(false)
  })

  it('מבוטל שנקבע לו סכום — נפתח מסלול-P1 (F-9 של Q-1) והצעת-הדמים נעלמת', () => {
    const phase = closingPhase(
      detailRow({ project_status: 'cancelled', cancellation_fee: '3508.00' }),
    )
    expect(phase.showFeeProposal).toBe(false)
    expect(phase.showInvoiceBlock).toBe(true)
  })

  it('תחשיב-המאזן מוצג רק בתיק שאורכב — כפי שהתצוגה המאושרת מציגה', () => {
    expect(closingPhase(detailRow()).showBalance).toBe(false)
    expect(closingPhase(detailRow({ project_status: 'finished' })).showBalance).toBe(true)
  })

  // ‏`finance_project_money` מחזירה למבוטל `revenue` = ההצעה הקפואה שלא נגבתה, בעוד
  // `final_profit` שלו נגזר מדמי-הביטול (Q-3). הצגת שניהם יחד = שני מספרי-רווח סותרים.
  it('מבוטל שנפתר מקבל את הרווח הקפוא בלבד — לא תחשיב-מאזן', () => {
    const phase = closingPhase(detailRow({ project_status: 'cancelled', final_profit: '-1200.00' }))
    expect(phase.showBalance).toBe(false)
    expect(phase.showCancelledProfit).toBe(true)
    expect(closingPhase(detailRow({ project_status: 'finished' })).showCancelledProfit).toBe(false)
  })
})

// ── ②ב שער "שמור סטטוס" — שלושה ענפים, שלושה משפטים ────────────────────────────────
describe('feedbackGateNote', () => {
  it('אין ציון ⇒ המשפט שמצביע גם על "לא ענה לסקר"', () => {
    expect(feedbackGateNote({ score: null, reason: '', touched: true })).toContain(
      'יש לבחור ציון בין 1 ל-5',
    )
  })

  it('ציון נמוך בלי סיבה ⇒ משפט-הסיבה של כרטיס-P2', () => {
    expect(feedbackGateNote({ score: 2, reason: '  ', touched: true })).toContain('סיבת-בירור')
  })

  it('הכול תקין אך שום דבר לא נגע ⇒ "אין שינוי לשמור", ולא כפתור אילם', () => {
    expect(feedbackGateNote({ score: 4, reason: '', touched: false })).toBe(
      'אין שינוי לשמור — עדכני ציון, סיבה או הערות.',
    )
  })

  it('נגע ותקין ⇒ השער פתוח', () => {
    expect(feedbackGateNote({ score: 2, reason: 'איכות תגים', touched: true })).toBeNull()
    expect(feedbackGateNote({ score: 5, reason: '', touched: true })).toBeNull()
  })
})

// ── ③ תצוגה א׳ — המסלול הרגיל ──────────────────────────────────────────────────────
describe('תצוגה א׳ — ממתין לחשבונית', () => {
  it('מציג פרטי-חיוב, באנר-§7.38 ואזור-העלאה, ואינו מציג תחשיב-מאזן', async () => {
    await renderLoaded()
    expect(screen.getByTestId('closing-status-tag')).toHaveTextContent('ממתין לחשבונית')
    expect(
      within(screen.getByTestId('closing-identity')).getByText('בודק אוטומטי'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('closing-invoice-banner')).toHaveTextContent(
      'המערכת אינה מפיקה חשבונית (§7.38).',
    )
    expect(screen.getByTestId('closing-file-hint')).toHaveTextContent('לא נבחר קובץ עדיין')
    expect(screen.queryByTestId('closing-balance')).not.toBeInTheDocument()
  })

  it('אזור-ההעלאה נושא את משפט-הגרירה המצויר, וגרירת קובץ מצרפת אותו כמו בורר-הקבצים', async () => {
    await renderLoaded()
    const zone = screen.getByTestId('closing-dropzone')
    expect(zone).toHaveTextContent('גררי קובץ-חשבונית לכאן, או')

    const file = new File(['x'], 'Invoice_4127.pdf', { type: 'application/pdf' })
    fireEvent.drop(zone, { dataTransfer: { files: [file] } })
    expect(screen.getByTestId('closing-file-hint')).toHaveTextContent('Invoice_4127.pdf')
    expect(screen.getByTestId('closing-send-invoice')).toBeEnabled()
  })

  it('גרירת קובץ פסול עוברת באותה ולידציה ואינה פותחת את השליחה', async () => {
    await renderLoaded()
    const bad = new File(['x'], 'notes.txt', { type: 'text/plain' })
    fireEvent.drop(screen.getByTestId('closing-dropzone'), { dataTransfer: { files: [bad] } })
    expect(screen.getByTestId('closing-file-error')).toBeInTheDocument()
    expect(screen.getByTestId('closing-send-invoice')).toBeDisabled()
  })

  it('"שמור ושלח" מושבת בלי קובץ, עם הנוסח הנעול של api.js', async () => {
    await renderLoaded()
    expect(screen.getByTestId('closing-send-invoice')).toBeDisabled()
    expect(screen.getByTestId('closing-invoice-gate')).toHaveTextContent(INVOICE_FILE_REQUIRED_NOTE)
  })

  it('"העבר לארכיון" מושבת עם משפט-השער המצויר', async () => {
    await renderLoaded()
    expect(screen.getByTestId('closing-archive')).toBeDisabled()
    expect(screen.getByTestId('closing-archive-gate')).toHaveTextContent(DRAWN_ARCHIVE_GATE)
  })

  it('אין כתובת מייל לחיוב ⇒ השליחה חסומה עם הפניה לכרטיס-הלקוח (כרטיס-P1)', async () => {
    getBillingContact.mockResolvedValue(billingRow({ email: null }))
    await renderLoaded()
    const file = new File(['x'], 'Invoice_4127.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByTestId('closing-file-input'), { target: { files: [file] } })
    expect(screen.getByTestId('closing-send-invoice')).toBeDisabled()
    expect(screen.getByTestId('closing-invoice-gate')).toHaveTextContent('כרטיס הלקוח')
  })

  it('קובץ שנבחר פותח את השליחה; שליחה מוצלחת מרעננת מהשרת ומדווחת', async () => {
    sendInvoiceAndRecord.mockResolvedValue({
      sendResult: 'sent',
      recorded: true,
      filePath: '12/1_Invoice_4127.pdf',
      logFailed: false,
    })
    getFinanceDetail.mockResolvedValueOnce(detailRow()).mockResolvedValue(
      detailRow({
        project_status: 'awaiting_payment',
        invoice_sent: true,
        invoice_sent_at: '2026-08-28T09:00:00Z',
        invoice_file_url: '12/1_Invoice_4127.pdf',
      }),
    )
    const onChanged = vi.fn()
    await renderLoaded({ onChanged })

    const file = new File(['x'], 'Invoice_4127.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByTestId('closing-file-input'), { target: { files: [file] } })
    expect(screen.getByTestId('closing-file-hint')).toHaveTextContent('Invoice_4127.pdf')

    fireEvent.click(screen.getByTestId('closing-send-invoice'))
    await waitFor(() => expect(sendInvoiceAndRecord).toHaveBeenCalledTimes(1))
    await screen.findByTestId('closing-payment-block')
    expect(onChanged).toHaveBeenCalled()
    // שם-הקובץ מגיע מ-`fileNameOf` האמיתי — חותמת-הזמן שבנתיב נחתכת.
    expect(screen.getByTestId('closing-invoice-done')).toHaveTextContent('Invoice_4127.pdf')
  })

  it('🔴 מייל שנכשל — המסך אומר זאת ואינו עובר למצב "נשלח" (כרטיס-P1)', async () => {
    sendInvoiceAndRecord.mockResolvedValue({
      sendResult: 'failed',
      recorded: false,
      filePath: null,
      logFailed: false,
    })
    await renderLoaded()
    const file = new File(['x'], 'Invoice_4127.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByTestId('closing-file-input'), { target: { files: [file] } })
    fireEvent.click(screen.getByTestId('closing-send-invoice'))

    expect(await screen.findByTestId('closing-server-error')).toHaveTextContent('לא נשלחה')
    // רק הטעינה הראשונה — אין רענון, כלומר לא נטען שום מצב חדש.
    expect(getFinanceDetail).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('closing-invoice-banner')).toBeInTheDocument()
  })

  it('פסק-זמן ("לא ידוע") אינו כישלון — ומקבל את משפט-האזהרה של המנוע', async () => {
    sendInvoiceAndRecord.mockResolvedValue({
      sendResult: 'unknown',
      recorded: false,
      filePath: null,
      logFailed: false,
    })
    await renderLoaded()
    const file = new File(['x'], 'Invoice_4127.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByTestId('closing-file-input'), { target: { files: [file] } })
    fireEvent.click(screen.getByTestId('closing-send-invoice'))
    expect(await screen.findByTestId('closing-server-error')).toHaveTextContent(
      'לא התקבל אישור שהמייל נשלח',
    )
  })
})

// ── ④ המשוב — שלושת המצבים של Q-1 ──────────────────────────────────────────────────
describe('בלוק-המשוב', () => {
  it('ציון 2 ⇒ תג-אדום בפורמט-S1 (תווית בלבד) + סיבה מחמש המחרוזות', async () => {
    await renderLoaded()
    const tag = screen.getByTestId('closing-feedback-tag')
    expect(tag).toHaveTextContent('טעון בירור')
    expect(tag.textContent).not.toMatch(/\d/)
    expect(screen.getByTestId('closing-feedback-reason')).toHaveValue('תפקוד דיילות')
  })

  it('אין ציון ⇒ כוכבי-הזנה + "לא ענה לסקר", ואין select של סיבה', async () => {
    getFinanceDetail.mockResolvedValue(
      detailRow({ feedback_status: 'sent', feedback_score: null, negative_feedback_reason: null }),
    )
    await renderLoaded()
    expect(screen.getByTestId('closing-feedback-stars')).toBeInTheDocument()
    expect(screen.getByTestId('closing-no-response')).toBeInTheDocument()
    expect(screen.queryByTestId('closing-feedback-reason')).not.toBeInTheDocument()
  })

  it('"לא ענה לסקר" כותב no_response דרך ה-RPC ולא מזין ציון', async () => {
    getFinanceDetail.mockResolvedValue(
      detailRow({ feedback_status: 'sent', feedback_score: null, negative_feedback_reason: null }),
    )
    recordFeedback.mockResolvedValue({ ok: true })
    await renderLoaded()
    fireEvent.click(screen.getByTestId('closing-no-response'))
    await waitFor(() => expect(recordFeedback).toHaveBeenCalledWith(12, { markNoResponse: true }))
  })

  // 🔴 המסלול שמגיע מהדף הציבורי: הלקוח מגיש 2, אין לו איפה לבחור סיבה, והמסד יחסום
  // ארכוב. עד 28/08/2026 הכפתור נראה פעיל ולחיצה עליו הייתה נכשלת מול השרת.
  it('ציון 2 מהדף הציבורי בלי סיבה — הארכוב חסום על המסך, לא רק בשרת', async () => {
    getFinanceDetail.mockResolvedValue(
      detailRow({
        project_status: 'awaiting_payment',
        invoice_sent: true,
        invoice_sent_at: '2026-08-28T09:00:00Z',
        payment_date: '2026-09-05',
        feedback_status: 'completed',
        feedback_score: 2,
        negative_feedback_reason: null,
      }),
    )
    await renderLoaded()
    expect(screen.getByTestId('closing-archive')).toBeDisabled()
    expect(screen.getByTestId('closing-archive-gate')).toHaveTextContent('הלקוח נתן ציון 2')
  })

  it('כפתור "שמור סטטוס" מושבת לעולם עם סיבה כתובה וקשורה אליו (A-1)', async () => {
    await renderLoaded() // ‏#12: ציון 2, סיבה קיימת, שום דבר לא נגע
    const save = screen.getByTestId('closing-save-status')
    expect(save).toBeDisabled()
    const note = screen.getByTestId('closing-feedback-gate')
    expect(note).toHaveTextContent('אין שינוי לשמור')
    expect(save).toHaveAttribute('aria-describedby', note.id)
    expect(note.id).not.toBe('')
  })

  it('ציון שהוזן מתחת ל-3 בלי סיבה — "שמור סטטוס" חסום עם הסבר (כרטיס-P2)', async () => {
    getFinanceDetail.mockResolvedValue(
      detailRow({ feedback_status: 'sent', feedback_score: null, negative_feedback_reason: null }),
    )
    await renderLoaded()
    const stars = within(screen.getByTestId('closing-feedback-stars')).getAllByRole('button')
    fireEvent.click(stars[1]) // ציון 2
    expect(screen.getByTestId('closing-save-status')).toBeDisabled()
    expect(screen.getByTestId('closing-feedback-gate')).toHaveTextContent('סיבת-בירור')

    fireEvent.change(screen.getByTestId('closing-feedback-reason'), {
      target: { value: 'איכות תגים' },
    })
    expect(screen.getByTestId('closing-save-status')).toBeEnabled()
  })
})

// ── ⑤ המצב הרביעי של Q-1 — ממתין לתשלום ────────────────────────────────────────────
describe('ממתין לתשלום (המצב שהוסף ב-Q-1)', () => {
  const awaitingPayment = () =>
    detailRow({
      project_status: 'awaiting_payment',
      invoice_sent: true,
      invoice_sent_at: '2026-08-28T09:00:00Z',
      invoice_file_url: '12/1755000000_Invoice_4127.pdf',
    })

  it('החשבונית מוצגת מקופלת-בוצע, ובמקום אזור-ההעלאה יש שדה תאריך-תשלום', async () => {
    getFinanceDetail.mockResolvedValue(awaitingPayment())
    await renderLoaded()
    expect(screen.getByTestId('closing-invoice-done')).toHaveTextContent('Invoice_4127.pdf')
    expect(screen.queryByTestId('closing-dropzone')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-payment-date')).toBeInTheDocument()
  })

  it('שמירת תאריך-תשלום קוראת ל-record_payment עם התאריך שהוקלד', async () => {
    getFinanceDetail.mockResolvedValue(awaitingPayment())
    recordPayment.mockResolvedValue({ ok: true })
    await renderLoaded()
    expect(screen.getByTestId('closing-save-payment')).toBeDisabled()
    fireEvent.change(screen.getByTestId('closing-payment-date'), {
      target: { value: '2026-09-05' },
    })
    fireEvent.click(screen.getByTestId('closing-save-payment'))
    await waitFor(() => expect(recordPayment).toHaveBeenCalledWith(12, '2026-09-05'))
  })

  it('"סגור ללא תשלום" דורש סיבה וחלונית-וידוא לפני שהוא כותב (P3)', async () => {
    getFinanceDetail.mockResolvedValue(awaitingPayment())
    recordWriteOff.mockResolvedValue({ ok: true })
    await renderLoaded()

    fireEvent.click(screen.getByTestId('closing-write-off-open'))
    expect(screen.getByTestId('closing-write-off-confirm')).toBeDisabled()

    fireEvent.change(screen.getByTestId('closing-write-off-reason'), {
      target: { value: 'הלקוח נכנס לפירוק' },
    })
    fireEvent.click(screen.getByTestId('closing-write-off-confirm'))

    fireEvent.click(await screen.findByTestId('confirm-dialog-confirm'))
    await waitFor(() => expect(recordWriteOff).toHaveBeenCalledWith(12, 'הלקוח נכנס לפירוק'))
  })

  it('שער פתוח (תשלום + משוב) ⇒ הארכוב פעיל ורץ רק אחרי חלונית-הווידוא (א37)', async () => {
    getFinanceDetail.mockResolvedValue(
      detailRow({
        project_status: 'awaiting_payment',
        invoice_sent: true,
        invoice_sent_at: '2026-08-28T09:00:00Z',
        payment_date: '2026-09-05',
      }),
    )
    archiveProject.mockResolvedValue({ ok: true })
    await renderLoaded()

    expect(screen.queryByTestId('closing-archive-gate')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('closing-archive'))
    expect(archiveProject).not.toHaveBeenCalled()

    fireEvent.click(await screen.findByTestId('confirm-dialog-confirm'))
    await waitFor(() => expect(archiveProject).toHaveBeenCalledWith(12))
  })
})

// ── ⑥ תצוגה ב׳ — תיק נעול ──────────────────────────────────────────────────────────
describe('תצוגה ב׳ — תיק נעול', () => {
  const archived = (over = {}) =>
    detailRow({
      project_status: 'finished',
      invoice_sent: true,
      invoice_sent_at: '2026-08-28T09:00:00Z',
      invoice_file_url: '13/1_Invoice_4127.pdf',
      payment_date: '2026-09-05',
      archived_at: '2026-09-06T07:00:00Z',
      final_profit: '3650.00',
      feedback_score: 4,
      negative_feedback_reason: null,
      ...over,
    })

  it('מציג את תחשיב-המאזן עם עוגן-היד 3,650.00 ואת סטיית-התקציב −692.00', async () => {
    getFinanceDetail.mockResolvedValue(archived())
    await renderLoaded()
    expect(screen.getByTestId('closing-balance-revenue')).toHaveTextContent('5,300.00 ₪')
    expect(screen.getByTestId('closing-balance-profit')).toHaveTextContent('3,650.00 ₪')
    expect(screen.getByTestId('closing-deviation-tile')).toHaveTextContent('692.00 ₪')
    expect(screen.getByTestId('closing-deviation-tile')).toHaveTextContent('בפועל מתחת למתוכנן')
  })

  // ⚠️ הבדיקה בודקת **פקדי-כתיבה**, לא נתונים. עד 28/08/2026 היא שאלה
  // `closing-feedback-block` ובכך נעלה גם את היעלמות **הנתון** — בעוד התצוגה המאושרת ב'
  // מציירת את המשוב בתוך רשת-הזהות. הרשימה כאן מונה את הפקדים אחד-אחד.
  it('אינו מציג ולו פקד-כתיבה אחד — רק "סגירה"', async () => {
    getFinanceDetail.mockResolvedValue(archived())
    await renderLoaded()
    expect(screen.getByTestId('closing-locked-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('closing-dropzone')).not.toBeInTheDocument()
    expect(screen.queryByTestId('closing-payment-date')).not.toBeInTheDocument()
    expect(screen.queryByTestId('closing-feedback-stars')).not.toBeInTheDocument()
    expect(screen.queryByTestId('closing-feedback-reason')).not.toBeInTheDocument()
    expect(screen.queryByTestId('closing-feedback-notes')).not.toBeInTheDocument()
    expect(screen.queryByTestId('closing-no-response')).not.toBeInTheDocument()
    expect(screen.queryByTestId('closing-archive')).not.toBeInTheDocument()
    expect(screen.queryByTestId('closing-save-status')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-close')).toBeInTheDocument()
  })

  it("המשוב נשאר על המסך כתא-קריאה — תג, סיבה והערות (התצוגה המאושרת ב')", async () => {
    getFinanceDetail.mockResolvedValue(
      archived({
        feedback_score: 2,
        negative_feedback_reason: 'תפקוד דיילות',
        feedback_notes: 'הלקוח ציין שהדיילת הגיעה לא-מוכנה.',
      }),
    )
    await renderLoaded()
    const cell = screen.getByTestId('closing-feedback-locked')
    expect(within(cell).getByTestId('closing-feedback-locked-tag')).toHaveTextContent('טעון בירור')
    expect(cell).toHaveTextContent('תפקוד דיילות')
    expect(cell).toHaveTextContent('הדיילת הגיעה לא-מוכנה')
    expect(screen.getByTestId('closing-identity')).toBeInTheDocument()
  })

  it('סטיית-תקציב null (T7/A-8) מוצגת כמשפט רועש — ובלשון סטייה, לא פיצוי', async () => {
    getFinanceDetail.mockResolvedValue({ ...archived(), budget_deviation: null })
    await renderLoaded()
    const tile = screen.getByTestId('closing-deviation-tile')
    expect(tile).toHaveTextContent('לא ניתן לחשב סטייה — חסרות שעות סופיות')
    expect(tile).not.toHaveTextContent('פיצוי')
    expect(tile).not.toHaveTextContent('0.00 ₪')
  })
})

// ── ⑦ תצוגה ג׳ — דמי-ביטול ─────────────────────────────────────────────────────────
describe('תצוגה ג׳ — דמי-ביטול', () => {
  const cancelled = (over = {}) =>
    detailRow({
      project_id: 14,
      event_name: 'כנס פתיחת שנה',
      project_status: 'cancelled',
      cancelled_at: '2026-08-26T08:00:00Z',
      cancel_type: 'customer',
      feedback_status: 'not_sent',
      feedback_score: null,
      negative_feedback_reason: null,
      ...over,
    })

  it('שלושת הרכיבים ותת-הסכום 3,508.00, והסכום-שייחתם נזרע ממנו (ה28)', async () => {
    getFinanceDetail.mockResolvedValue(cancelled())
    await renderLoaded({ project: s1Row({ project_id: 14, event_name: 'כנס פתיחת שנה' }) })
    expect(screen.getByTestId('closing-fee-comp')).toHaveTextContent('328.00 ₪')
    expect(screen.getByTestId('closing-fee-goods')).toHaveTextContent('3,180.00 ₪')
    expect(screen.getByTestId('closing-fee-subtotal')).toHaveTextContent('3,508.00 ₪')
    expect(screen.getByTestId('closing-fee-amount')).toHaveValue(3508)
  })

  it('אין ארכוב ואין בלוק-משוב לפרויקט מבוטל', async () => {
    getFinanceDetail.mockResolvedValue(cancelled())
    await renderLoaded({ project: s1Row({ project_id: 14 }) })
    expect(screen.queryByTestId('closing-archive')).not.toBeInTheDocument()
    expect(screen.queryByTestId('closing-feedback-block')).not.toBeInTheDocument()
  })

  it('השורה הידנית מוצגת כתוספת ואינה נכנסת מעצמה לסכום שייחתם', async () => {
    getFinanceDetail.mockResolvedValue(cancelled())
    await renderLoaded({ project: s1Row({ project_id: 14 }) })
    fireEvent.change(screen.getByTestId('closing-manual-amount'), { target: { value: '250' } })
    expect(screen.getByTestId('closing-fee-with-manual')).toHaveTextContent('3,758.00 ₪')
    expect(screen.getByTestId('closing-fee-amount')).toHaveValue(3508)
  })

  it('"שמור דמי-ביטול" שולח bill עם הסכום שהוקלד', async () => {
    getFinanceDetail.mockResolvedValue(cancelled())
    resolveCancellationFee.mockResolvedValue({ ok: true })
    await renderLoaded({ project: s1Row({ project_id: 14 }) })
    fireEvent.change(screen.getByTestId('closing-fee-amount'), { target: { value: '3000' } })
    fireEvent.change(screen.getByTestId('closing-fee-note'), { target: { value: 'סוכם בטלפון' } })
    fireEvent.click(screen.getByTestId('closing-save-fee'))
    await waitFor(() =>
      expect(resolveCancellationFee).toHaveBeenCalledWith(14, 'bill', {
        amount: 3000,
        note: 'סוכם בטלפון',
      }),
    )
  })

  it('"ויתור על החוב" חסום בלי הערה, ואחריה עובר דרך חלונית-וידוא (P1)', async () => {
    getFinanceDetail.mockResolvedValue(cancelled())
    resolveCancellationFee.mockResolvedValue({ ok: true })
    await renderLoaded({ project: s1Row({ project_id: 14 }) })
    expect(screen.getByTestId('closing-waive')).toBeDisabled()
    fireEvent.change(screen.getByTestId('closing-fee-note'), {
      target: { value: 'ויתור מסחרי מול לקוח ותיק' },
    })
    fireEvent.click(screen.getByTestId('closing-waive'))
    fireEvent.click(await screen.findByTestId('confirm-dialog-confirm'))
    await waitFor(() =>
      expect(resolveCancellationFee).toHaveBeenCalledWith(14, 'waive', {
        note: 'ויתור מסחרי מול לקוח ותיק',
      }),
    )
  })

  it('שעות-סופיות חסרות (A-8) ⇒ משפט רועש במקום פיצוי 0', async () => {
    getFinanceDetail.mockResolvedValue(cancelled())
    getCancellationFeeProposal.mockResolvedValue(
      proposalRow({ team_compensation: null, proposed_fee: null, planned_hours: null }),
    )
    await renderLoaded({ project: s1Row({ project_id: 14 }) })
    expect(screen.getByTestId('closing-fee-comp-missing')).toHaveTextContent(
      'לא ניתן לחשב פיצוי — חסרות שעות סופיות',
    )
    expect(screen.queryByTestId('closing-fee-comp')).not.toBeInTheDocument()
  })

  // 🔴 שני מספרי-רווח על מסך אחד: `revenue` של מבוטל היא ההצעה הקפואה שלא נגבתה,
  // בעוד `final_profit` נגזר מדמי-הביטול (Q-3). המסך מציג את הקפוא בלבד.
  it('מבוטל שנפתר — רווח קפוא בלבד, בלי הכנסות ובלי רווח-גולמי סותר', async () => {
    getFinanceDetail.mockResolvedValue(
      cancelled({ cancellation_fee: '0.00', final_profit: '-1748.00' }),
    )
    await renderLoaded({ project: s1Row({ project_id: 14 }) })
    expect(screen.getByTestId('closing-final-profit-tile')).toHaveTextContent('1,748.00 ₪')
    expect(screen.queryByTestId('closing-balance')).not.toBeInTheDocument()
    expect(screen.queryByTestId('closing-balance-revenue')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-cancelled-no-balance')).toHaveTextContent(
      'אין תחשיב-מאזן לפרויקט מבוטל',
    )
  })

  it('אחרי שנקבע סכום — נפתח מסלול-P1 (חשבונית), והדגל §7.20ב מוצג כשהוא דולק', async () => {
    getFinanceDetail.mockResolvedValue(cancelled({ cancellation_fee: '3508.00' }))
    await renderLoaded({
      project: s1Row({ project_id: 14, credit_note_flag: true }),
    })
    expect(screen.getByTestId('closing-fee-saved')).toHaveTextContent('3,508.00 ₪')
    expect(screen.getByTestId('closing-credit-note')).toHaveTextContent('נדרשת חשבונית זיכוי')
    expect(screen.getByTestId('closing-invoice-banner')).toBeInTheDocument()
  })
})

// ── ⑧ שער-הצורה ────────────────────────────────────────────────────────────────────
describe('שער-הצורה (assertFinanceShape)', () => {
  it('עמודה שנעלמה מפילה את המסך ברעש, ואינה מצוירת כ-`—`', async () => {
    const broken = detailRow()
    delete broken.gross_profit
    getFinanceDetail.mockResolvedValue(broken)
    renderDialog()
    const box = await screen.findByTestId('closing-load-error')
    expect(box).toHaveTextContent('לא ניתן לטעון את הנתונים.')
    expect(box).toHaveTextContent('gross_profit')
    expect(screen.queryByTestId('closing-balance')).not.toBeInTheDocument()
  })

  it('כשל-טעינה מציג "נסי שוב" וטעינה חוזרת מצליחה', async () => {
    getFinanceDetail
      .mockRejectedValueOnce(new Error('שגיאה בטעינת נתוני הכספים של הפרויקט.'))
      .mockResolvedValue(detailRow())
    renderDialog()
    fireEvent.click(await screen.findByRole('button', { name: 'נסי שוב' }))
    await screen.findByTestId('closing-meta')
    expect(screen.getByTestId('closing-invoice-banner')).toBeInTheDocument()
  })
})

// ── ⑨ מקרי-הקצה שחודש-עבודה אמיתי מייצר (נוספו 28/08/2026) ─────────────────────────
// חמישה, וכל אחד נולד מממצא מדוד ולא מדמיון: מספר-שעות גולמי · ביטול בכוח-עליון ·
// כפתור-מת בענף-הביטול · תאריך-תשלום שהוקלד שגוי · הערת-משוב שאי-אפשר היה למחוק.

describe('formatHoursBeforeEvent — ‏numeric גולמי אינו מגיע למסך-כספים', () => {
  it('מקצץ את זנב-הספרות של `numeric` לספרה אחת', () => {
    // הצורה שבה PostgREST מעביר `extract(epoch …)/3600.0` — המדידה החיה מתועדת בכותרת
    // `src/lib/projectFinance.js` ("202.5000000000000000").
    expect(formatHoursBeforeEvent('45.716666666666666667')).toBe('45.7')
    // ‏`Number(...)` ולא ליטרל: ליטרל בדיוק כזה הוא `no-loss-of-precision` בלינטר.
    expect(formatHoursBeforeEvent(Number('45.716666666666666667'))).toBe('45.7')
    expect(formatHoursBeforeEvent('30.0')).toBe('30.0')
  })

  it('חוסר-נתון נשאר `—` ולעולם לא 0 (§4.3)', () => {
    expect(formatHoursBeforeEvent(null)).toBe('—')
    expect(formatHoursBeforeEvent(undefined)).toBe('—')
    expect(formatHoursBeforeEvent('לא-מספר')).toBe('—')
    expect(formatHoursBeforeEvent(0)).toBe('0.0')
  })
})

describe('שערי ענף-הביטול — משפט, לא בוליאני (A-1)', () => {
  it('סכום ריק וסכום 0 הם שתי סיבות שונות, ו-0 מפנה לפעולת-הוויתור', () => {
    expect(feeSaveGateNote({ amount: null })).toContain('יש להזין את הסכום')
    expect(feeSaveGateNote({ amount: Number.NaN })).toContain('יש להזין את הסכום')
    expect(feeSaveGateNote({ amount: 0 })).toContain('ויתור על החוב')
    expect(feeSaveGateNote({ amount: -5 })).toContain('ויתור על החוב')
    expect(feeSaveGateNote({ amount: 3508 })).toBeNull()
  })

  it('ויתור בלי הערה חסום, ורווחים בלבד אינם הערה', () => {
    expect(waiveGateNote({ note: '' })).toContain('הערת-פירוט')
    expect(waiveGateNote({ note: '   ' })).toContain('הערת-פירוט')
    expect(waiveGateNote({ note: null })).toContain('הערת-פירוט')
    expect(waiveGateNote({ note: 'ויתור מסחרי' })).toBeNull()
  })
})

describe('תצוגה ג׳ — מקרי-הקצה של דמי-הביטול', () => {
  const cancelledRow = (over = {}) =>
    detailRow({
      project_id: 14,
      event_name: 'כנס פתיחת שנה',
      project_status: 'cancelled',
      cancelled_at: '2026-08-26T08:00:00Z',
      cancel_type: 'customer',
      feedback_status: 'not_sent',
      feedback_score: null,
      negative_feedback_reason: null,
      ...over,
    })

  const openCancelled = async (detailOver = {}, proposalOver = {}) => {
    getFinanceDetail.mockResolvedValue(cancelledRow(detailOver))
    getCancellationFeeProposal.mockResolvedValue(proposalRow(proposalOver))
    await renderLoaded({ project: s1Row({ project_id: 14, event_name: 'כנס פתיחת שנה' }) })
  }

  it('🔴 שעות-הביטול מוצגות מעוגלות — לא זנב-`numeric` בן 16 ספרות', async () => {
    await openCancelled({}, { hours_before_event: '45.716666666666666667' })
    const why = screen.getByTestId('closing-fee-comp-why')
    expect(why).toHaveTextContent('45.7 שעות לפני האירוע')
    expect(why).not.toHaveTextContent('45.716')
  })

  // 🔴 המסד קובע 0% בענף `force_majeure` **לפני** שהשעון נבדק (ה24/ה25). משפט אחד
  // שמצרף תמיד שעות⇐אחוז היה קורא כמו חישוב שבור: "5 שעות ⇐ הסולם נותן 0%".
  it('כוח-עליון — האחוז אינו מיוחס לשעון, והמשפט הוא זה שנעול במודול 6', async () => {
    await openCancelled(
      { cancel_type: 'force_majeure' },
      { compensation_pct: '0', hours_before_event: '5.0', team_compensation: '0.00' },
    )
    const why = screen.getByTestId('closing-fee-comp-why')
    expect(why).toHaveTextContent('הביטול סווג ככוח-עליון (ה25)')
    expect(why).toHaveTextContent('כוח עליון מאפס פיצוי תמיד, ללא תלות במרחק-הזמן.')
    expect(why).not.toHaveTextContent('סולם-הביטול (ה24) נותן')
    // השעות נשארות עובדה נפרדת — הן נכונות, הן פשוט אינן הסיבה לאחוז.
    expect(why).toHaveTextContent('5.0 שעות לפני האירוע')
  })

  it('הנוסח נשאב מ-`compensationReason` של מודול 6 ואינו מוקלד כאן מחדש', () => {
    expect(compensationReason({ cancelType: 'force_majeure' })).toBe(
      'כוח עליון מאפס פיצוי תמיד, ללא תלות במרחק-הזמן.',
    )
  })

  // 🔴 ה25 (`processes-approved.md`): `other` ⇒ **אין הצעה אוטומטית** — שיקול-המנהלת.
  // המסד לא בנה את הענף (‏`v_pct` מטפל ב-`force_majeure` בלבד), ולכן השער הוא המסך.
  it('🔴 ביטול בסיווג "אחר" — שדה-הסכום נשאר ריק ואומר למה (ה25)', async () => {
    await openCancelled({ cancel_type: 'other' })
    expect(screen.getByTestId('closing-fee-amount')).toHaveValue(null)
    expect(screen.getByTestId('closing-fee-manual-only')).toHaveTextContent('אין הצעה אוטומטית')
    // ההצעה עצמה **נשארת מוצגת** — היא מידע לעיון; מה שהוסר הוא ההסכמה השקטה.
    expect(screen.getByTestId('closing-fee-subtotal')).toBeInTheDocument()
    // ומכיוון שהשדה ריק, שער-השמירה חוסם עד שהמנהלת תקליד סכום — בדיוק הכוונה.
    expect(screen.getByTestId('closing-save-fee')).toBeDisabled()
  })

  it('ביטול ע"י הלקוח כן נזרע — כדי ש"לא נזרע" לא יהיה התנהגות גורפת', async () => {
    await openCancelled({ cancel_type: 'customer' }, { proposed_fee: '3508.00' })
    expect(screen.getByTestId('closing-fee-amount')).toHaveValue(3508)
    expect(screen.queryByTestId('closing-fee-manual-only')).not.toBeInTheDocument()
  })

  it('ביטול רגיל ממשיך לצטט את הסולם, בלי משפט כוח-עליון', async () => {
    await openCancelled()
    const why = screen.getByTestId('closing-fee-comp-why')
    expect(why).toHaveTextContent('סולם-הביטול (ה24) נותן')
    expect(why).not.toHaveTextContent('כוח עליון')
  })

  it('"ויתור על החוב" מושבת עם סיבה כתובה וקשורה אליו (A-1)', async () => {
    await openCancelled()
    const waive = screen.getByTestId('closing-waive')
    expect(waive).toBeDisabled()
    const note = screen.getByTestId('closing-waive-gate')
    expect(note).toHaveTextContent('ויתור מחייב הערת-חובה')
    expect(waive).toHaveAttribute('aria-describedby', note.id)
    expect(note.id).not.toBe('')

    fireEvent.change(screen.getByTestId('closing-fee-note'), { target: { value: 'ויתור מסחרי' } })
    expect(screen.getByTestId('closing-waive')).toBeEnabled()
    expect(screen.queryByTestId('closing-waive-gate')).not.toBeInTheDocument()
  })

  it('סכום 0 — "שמור דמי-ביטול" מושבת ומפנה לפעולת-הוויתור, לא נכבה בשתיקה', async () => {
    await openCancelled()
    fireEvent.change(screen.getByTestId('closing-fee-amount'), { target: { value: '0' } })
    const save = screen.getByTestId('closing-save-fee')
    expect(save).toBeDisabled()
    const note = screen.getByTestId('closing-fee-save-gate')
    expect(note).toHaveTextContent('ויתור על החוב')
    expect(save).toHaveAttribute('aria-describedby', note.id)
  })

  // Q-4 — אצל מבוטל רישום-התשלום הוא רגע הקפאת-הרווח, ולכן אין שם "תיקון תאריך".
  it('מבוטל שנרשם לו תשלום — בלוק-התשלום אינו חוזר (Q-4)', async () => {
    getFinanceDetail.mockResolvedValue(
      cancelledRow({
        cancellation_fee: '3508.00',
        invoice_sent: true,
        invoice_sent_at: '2026-08-28T09:00:00Z',
        invoice_file_url: '14/1_Invoice_9001.pdf',
        payment_date: '2026-08-27',
      }),
    )
    await renderLoaded({ project: s1Row({ project_id: 14 }) })
    expect(screen.queryByTestId('closing-payment-block')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-payment-done')).toHaveTextContent('27/08/2026')
  })
})

describe('תיקון תאריך-תשלום שהוקלד שגוי', () => {
  const paidRow = () =>
    detailRow({
      project_status: 'awaiting_payment',
      invoice_sent: true,
      invoice_sent_at: '2026-08-28T09:00:00Z',
      invoice_file_url: '12/1_Invoice_4127.pdf',
      payment_date: '2026-08-04',
    })

  it('🔴 הבלוק נשאר פתוח אחרי שנרשם תשלום, זרוע בתאריך שנשמר', async () => {
    getFinanceDetail.mockResolvedValue(paidRow())
    await renderLoaded()
    expect(screen.getByTestId('closing-payment-block')).toBeInTheDocument()
    expect(screen.getByTestId('closing-payment-date')).toHaveValue('2026-08-04')
    expect(screen.getByTestId('closing-save-payment')).toHaveTextContent('עדכון תאריך התשלום')
  })

  it('אותו תאריך אינו מופיע פעמיים — תא-הקריאה נסוג מפני השדה העריך', async () => {
    getFinanceDetail.mockResolvedValue(paidRow())
    await renderLoaded()
    expect(screen.queryByTestId('closing-payment-done')).not.toBeInTheDocument()
  })

  it('תיקון התאריך נשלח ל-record_payment כערך החדש', async () => {
    getFinanceDetail.mockResolvedValue(paidRow())
    recordPayment.mockResolvedValue({ ok: true })
    await renderLoaded()
    fireEvent.change(screen.getByTestId('closing-payment-date'), {
      target: { value: '2026-08-14' },
    })
    fireEvent.click(screen.getByTestId('closing-save-payment'))
    await waitFor(() => expect(recordPayment).toHaveBeenCalledWith(12, '2026-08-14'))
  })

  it('תיק שהועבר לארכיון עדיין אינו מציג את השדה — הנעילה גוברת', async () => {
    getFinanceDetail.mockResolvedValue({
      ...paidRow(),
      project_status: 'finished',
      archived_at: '2026-09-06T07:00:00Z',
      final_profit: '3650.00',
    })
    await renderLoaded()
    expect(screen.queryByTestId('closing-payment-block')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-payment-done')).toHaveTextContent('04/08/2026')
  })
})

// 🔴 `record_feedback` כותב `feedback_notes = coalesce(p_notes, feedback_notes)` ⇒ `null`
// פירושו "אל תיגע". המסך התכוון ב-`null` ל"רוקן", ולכן מחיקת הערה שגויה לא הייתה אפשרית.
describe('מחיקת הערת-משוב', () => {
  it('תיבה שרוקנה נשלחת כמחרוזת ריקה, לא כ-null', async () => {
    recordFeedback.mockResolvedValue({ ok: true })
    await renderLoaded() // ‏#12 נטען עם הערה קיימת
    fireEvent.change(screen.getByTestId('closing-feedback-notes'), { target: { value: '' } })
    fireEvent.click(screen.getByTestId('closing-save-status'))
    await waitFor(() =>
      expect(recordFeedback).toHaveBeenCalledWith(12, {
        score: 2,
        reason: 'תפקוד דיילות',
        notes: '',
      }),
    )
  })

  it('הערה אמיתית ממשיכה להישלח כלשונה (גזומת-רווחים בלבד)', async () => {
    recordFeedback.mockResolvedValue({ ok: true })
    await renderLoaded()
    fireEvent.change(screen.getByTestId('closing-feedback-notes'), {
      target: { value: '  שיחת-בירור בוצעה  ' },
    })
    fireEvent.click(screen.getByTestId('closing-save-status'))
    await waitFor(() =>
      expect(recordFeedback).toHaveBeenCalledWith(12, {
        score: 2,
        reason: 'תפקוד דיילות',
        notes: 'שיחת-בירור בוצעה',
      }),
    )
  })
})
