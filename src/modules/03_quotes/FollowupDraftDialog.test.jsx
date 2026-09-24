// "נסחי מייל מעקב" + חלון-הטיוטה (ליטושי-הכנס D2, 24/09/2026).
//
// 🔴 **אף בדיקה כאן אינה פונה ל-Gemini:** מכסת-ה-AI לא ידועה ומשותפת עם `classify-feedback`
// (`supabase/functions/classify-feedback/README.md`, "What is *not* verified" §1). ‏`functions.invoke`
// ממוקם, והבדיקה עוברת דרך `draftFollowupEmail` האמיתי ב-`api.js` — כלומר נבדק מסלול-הקריאה
// (הגוף, ה-timeout, קריאת-הגוף העברי מ-`error.context`), לא הספק.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ToastProvider } from '@/components/ToastProvider'
import FollowupDraftDialog from './FollowupDraftDialog'
import {
  FOLLOWUP_DRAFT_TIMEOUT_MS,
  FOLLOWUP_FAILED_MESSAGE,
  FOLLOWUP_NO_EMAIL_REASON,
  FOLLOWUP_NOTICE,
  FOLLOWUP_QUOTA_MESSAGE,
} from '@/lib/quoteFollowup'

const invoke = vi.fn()
vi.mock('@/supabaseClient', () => ({
  supabase: { functions: { invoke: (...a) => invoke(...a) } },
}))

const auth = {
  user: { fullName: 'דנה לוי', roleName: 'מנהלת פרויקטים', email: 'dana@reg-in.co' },
  onboardingMode: 0,
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }))

const QUOTE = { quote_id: 31, event_name: 'כנס השנתי', quote_status: 'in_progress' }
const DRAFT = {
  draft: { subject: 'מעקב — כנס השנתי', body: 'שלום אורית,\nרצינו לבדוק אם עלו שאלות.\nבברכה,' },
  to: 'orit@client.co.il',
}

function httpError(status, body) {
  return {
    data: null,
    error: { context: { status, json: async () => body } },
  }
}

function renderDialog(props = {}, { strict = false } = {}) {
  const tree = (
    <ToastProvider>
      <FollowupDraftDialog quote={QUOTE} {...props} />
    </ToastProvider>
  )
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree)
}

async function openAndWaitForDraft() {
  fireEvent.click(screen.getByTestId('quote-followup-open'))
  await screen.findByTestId('followup-draft')
}

const writeText = vi.fn()

beforeEach(() => {
  invoke.mockReset()
  writeText.mockReset().mockResolvedValue(undefined)
  auth.onboardingMode = 0
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('הכפתור בחלון-המסמך', () => {
  it('מושבת עם נימוק — הנימוק **טקסט גלוי** שמקושר לכפתור, ושום קריאה לא יוצאת', () => {
    renderDialog({ disabledReason: 'ההצעה עוד לא נשלחה ללקוח' })
    const button = screen.getByTestId('quote-followup-open')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('נסחי מייל מעקב')
    const reason = screen.getByTestId('quote-followup-reason')
    expect(reason).toBeVisible()
    expect(reason).toHaveTextContent('ההצעה עוד לא נשלחה ללקוח')
    expect(button).toHaveAttribute('aria-describedby', reason.id)
    fireEvent.click(button)
    expect(invoke).not.toHaveBeenCalled()
    expect(screen.queryByTestId('followup-dialog')).not.toBeInTheDocument()
  })

  it('פעיל ⇒ פותח את חלון-הטיוטה, קורא לשרת פעם אחת עם `quote_id` בלבד', async () => {
    invoke.mockResolvedValue({ data: DRAFT, error: null })
    renderDialog()
    await openAndWaitForDraft()
    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith('draft-followup', { body: { quote_id: 31 } })
  })

  it('StrictMode (כמו `src/main.jsx`) ⇒ עדיין **בקשה אחת** לכל פתיחה — לא מכסה כפולה', async () => {
    invoke.mockResolvedValue({ data: DRAFT, error: null })
    renderDialog({}, { strict: true })
    await openAndWaitForDraft()
    expect(invoke).toHaveBeenCalledTimes(1)
  })
})

describe('חלון-הטיוטה — המצב המוצלח', () => {
  it('שלד + "מנסחת טיוטה — זה יכול לקחת עד חצי דקה." בזמן ההמתנה, ובאזור-חי', async () => {
    let resolve
    invoke.mockReturnValue(new Promise((r) => (resolve = r)))
    renderDialog()
    fireEvent.click(screen.getByTestId('quote-followup-open'))
    expect(await screen.findByTestId('followup-skeleton')).toBeInTheDocument()
    const status = screen.getByTestId('followup-status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent('מנסחת טיוטה — זה יכול לקחת עד חצי דקה.')
    await act(async () => resolve({ data: DRAFT, error: null }))
    expect(screen.queryByTestId('followup-skeleton')).not.toBeInTheDocument()
    expect(status).toHaveTextContent('הטיוטה מוכנה.')
  })

  it('נושא וגוף ניתנים-לעריכה עם `<label>`, החתימה של מי שלחצה מתחת, והאזהרה קבועה', async () => {
    invoke.mockResolvedValue({ data: DRAFT, error: null })
    renderDialog()
    await openAndWaitForDraft()
    expect(screen.getByLabelText('נושא')).toHaveValue('מעקב — כנס השנתי')
    const body = screen.getByLabelText('גוף המייל')
    expect(body.value.startsWith('שלום אורית,\nרצינו לבדוק אם עלו שאלות.\nבברכה,\nדנה לוי')).toBe(
      true,
    )
    expect(body.value).toContain('דנה לוי | מנהלת פרויקטים, REG-IN')
    expect(screen.getByTestId('followup-notice')).toHaveTextContent(FOLLOWUP_NOTICE)
    expect(FOLLOWUP_NOTICE).toBe('טיוטה — בדקי לפני שליחה.')
    expect(screen.getByText(/נוסחה בעזרת AI/)).toBeInTheDocument()
  })

  it('הכתובת ב-`dir="ltr"`, ו"פתחי במייל" נבנה מהנוסח **הערוך**', async () => {
    invoke.mockResolvedValue({ data: DRAFT, error: null })
    renderDialog()
    await openAndWaitForDraft()
    expect(screen.getByTestId('followup-to')).toHaveAttribute('dir', 'ltr')
    fireEvent.change(screen.getByLabelText('נושא'), { target: { value: 'נושא ערוך' } })
    const link = screen.getByTestId('followup-open-mail')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toContain(
      `mailto:${encodeURIComponent('orit@client.co.il')}?subject=${encodeURIComponent('נושא ערוך')}`,
    )
  })

  it('"העתיקי" מעתיק את הגוף (כולל עריכה) ומכריז "הועתק."', async () => {
    invoke.mockResolvedValue({ data: DRAFT, error: null })
    renderDialog()
    await openAndWaitForDraft()
    fireEvent.change(screen.getByLabelText('גוף המייל'), { target: { value: 'גוף ערוך' } })
    fireEvent.click(screen.getByTestId('followup-copy'))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('גוף ערוך'))
    expect(await screen.findByText('הועתק.')).toBeInTheDocument()
  })

  it('טיוטה ארוכה מדי לקישור ⇒ "פתחי במייל" בלי גוף, והלחיצה מעתיקה את הגוף ואומרת זאת', async () => {
    const long = 'שלום רב, רצינו לבדוק אם ההצעה עדיין רלוונטית עבורכם.\n'.repeat(8)
    invoke.mockResolvedValue({
      data: { ...DRAFT, draft: { ...DRAFT.draft, body: long } },
      error: null,
    })
    renderDialog()
    await openAndWaitForDraft()
    const link = screen.getByTestId('followup-open-mail')
    expect(link.getAttribute('href')).not.toContain('body=')
    fireEvent.click(link)
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(
      await screen.findByText('גוף הטיוטה הועתק — הדביקי אותו במייל שנפתח.'),
    ).toBeInTheDocument()
  })

  it('אין מייל לאיש-הקשר הראשי ⇒ "פתחי במייל" מושבת, והנימוק גלוי ומקושר', async () => {
    invoke.mockResolvedValue({ data: { ...DRAFT, to: null }, error: null })
    renderDialog()
    await openAndWaitForDraft()
    const button = screen.getByTestId('followup-open-mail')
    expect(button.tagName).toBe('BUTTON')
    expect(button).toBeDisabled()
    const reason = screen.getByTestId('followup-no-email')
    expect(reason).toHaveTextContent(FOLLOWUP_NO_EMAIL_REASON)
    expect(button).toHaveAttribute('aria-describedby', reason.id)
    expect(screen.getByTestId('followup-copy')).toBeEnabled()
  })

  it('🔒 אין בחלון שום פעולת-שליחה', async () => {
    invoke.mockResolvedValue({ data: DRAFT, error: null })
    renderDialog()
    await openAndWaitForDraft()
    expect(screen.queryByRole('button', { name: /שלחי/ })).not.toBeInTheDocument()
    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke.mock.calls.every(([name]) => name === 'draft-followup')).toBe(true)
  })

  it('מצב 2: רמז-הפרטיות מופיע; מצב 0: לא', async () => {
    invoke.mockResolvedValue({ data: DRAFT, error: null })
    auth.onboardingMode = 2
    renderDialog()
    await openAndWaitForDraft()
    expect(screen.getByTestId('hint-quoteFollowup.privacy')).toBeInTheDocument()
  })
})

describe('חלון-הטיוטה — כשל, מכסה, ולעולם לא טיוטה ריקה', () => {
  it('מכסה (429) ⇒ הנוסח של המכסה, בלי "נסי שוב"', async () => {
    invoke.mockResolvedValue(httpError(429, { status: 'quota', error: FOLLOWUP_QUOTA_MESSAGE }))
    renderDialog()
    fireEvent.click(screen.getByTestId('quote-followup-open'))
    expect(await screen.findByText(FOLLOWUP_QUOTA_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByTestId('followup-retry')).not.toBeInTheDocument()
    expect(screen.queryByTestId('followup-draft')).not.toBeInTheDocument()
    // בכשל אין טיוטה לבדוק ⇒ גם אין "טיוטה — בדקי לפני שליחה." (הייתה רעש, נמצא בצילום 24/09).
    expect(screen.queryByTestId('followup-notice')).not.toBeInTheDocument()
  })

  it('כשל-ספק (502) ⇒ "הניסוח נכשל — נסי שוב." + ניסיון-חוזר שמצליח', async () => {
    invoke
      .mockResolvedValueOnce(httpError(502, { status: 'failed', error: FOLLOWUP_FAILED_MESSAGE }))
      .mockResolvedValueOnce({ data: DRAFT, error: null })
    renderDialog()
    fireEvent.click(screen.getByTestId('quote-followup-open'))
    expect(await screen.findByText(FOLLOWUP_FAILED_MESSAGE)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('followup-retry'))
    await screen.findByTestId('followup-draft')
    expect(invoke).toHaveBeenCalledTimes(2)
  })

  it('409 (לא-זכאית) ⇒ ההודעה של השרת כלשונה, בלי "נסי שוב"', async () => {
    invoke.mockResolvedValue(httpError(409, { error: 'ההצעה עוד לא נשלחה ללקוח.' }))
    renderDialog()
    fireEvent.click(screen.getByTestId('quote-followup-open'))
    expect(await screen.findByText('ההצעה עוד לא נשלחה ללקוח.')).toBeInTheDocument()
    expect(screen.queryByTestId('followup-retry')).not.toBeInTheDocument()
  })

  it('200 עם גוף ריק ⇒ כשל, לא עורך ריק', async () => {
    invoke.mockResolvedValue({
      data: { draft: { subject: 'נושא', body: '' }, to: null },
      error: null,
    })
    renderDialog()
    fireEvent.click(screen.getByTestId('quote-followup-open'))
    expect(await screen.findByText(FOLLOWUP_FAILED_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByTestId('followup-draft')).not.toBeInTheDocument()
  })

  it('כשל-רשת בלי גוף-תשובה ⇒ "הניסוח נכשל — נסי שוב."', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    invoke.mockResolvedValue({ data: null, error: { context: new Error('offline') } })
    renderDialog()
    fireEvent.click(screen.getByTestId('quote-followup-open'))
    expect(await screen.findByText(FOLLOWUP_FAILED_MESSAGE)).toBeInTheDocument()
    expect(screen.getByTestId('followup-retry')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('השרת לא עונה ⇒ אחרי תקרת-הזמן: "הניסוח נכשל — נסי שוב.", לא שלד לנצח', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    invoke.mockReturnValue(new Promise(() => {}))
    renderDialog()
    fireEvent.click(screen.getByTestId('quote-followup-open'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FOLLOWUP_DRAFT_TIMEOUT_MS + 10)
    })
    expect(screen.getByText(FOLLOWUP_FAILED_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByTestId('followup-skeleton')).not.toBeInTheDocument()
  })
})

describe('מקלדת', () => {
  it('Esc סוגר את חלון-הטיוטה והפוקוס חוזר לכפתור שפתח', async () => {
    invoke.mockResolvedValue({ data: DRAFT, error: null })
    renderDialog()
    const trigger = screen.getByTestId('quote-followup-open')
    trigger.focus()
    await openAndWaitForDraft()
    fireEvent.keyDown(screen.getByTestId('followup-dialog'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByTestId('followup-dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})

// ✏️ 24/09/2026 (הסגן): הנוסח בציווי-נקבה (מדריך-הסגנון §1), זהה לאזור-השיווק (R30).
describe('העתקה שנכשלה', () => {
  it('הלוח חסום ⇒ "העתקה נכשלה — סמני את הטקסט והעתיקי ידנית."', async () => {
    invoke.mockResolvedValue({ data: DRAFT, error: null })
    writeText.mockRejectedValue(new Error('denied'))
    renderDialog()
    await openAndWaitForDraft()
    fireEvent.click(screen.getByTestId('followup-copy'))
    expect(
      await screen.findByText('העתקה נכשלה — סמני את הטקסט והעתיקי ידנית.'),
    ).toBeInTheDocument()
  })
})
