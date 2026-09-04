// בדיקות משטח S4 — הדף הציבורי `/feedback/:token` (צעד 3.4). ה-RPC ממוקק דרך
// `./publicApi`; אין מגע ב-DB חי, בדיוק כמו שער-הריצה קובע. נועל: ארבעת המצבים
// המצוירים (טופס/תודה/כבר-התקבל/מת) + מצב-כשל-הרשת שהוסף ב-N-5 (טעינה וגם שליחה) ·
// "שלח" חסום עד בחירת-כוכב (A-1) · תשובת `invalid` לא מתקדמת מסך ולא מוצגת כהצלחה ·
// ואף פעם לא "נשמר" כשלא נשמר.
// 🔗 בדיקות הלוגיקה הטהורה (`stateFromPagePayload`/`stateFromSubmitPayload`) עברו
// ל-`src/lib/feedback.test.js` — אותו קובץ שממנו הן מיוצאות, בדיוק כמו
// `shiftInvite.test.js` מול `PublicConfirmPage.jsx`.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { FEEDBACK_STATE } from '@/lib/feedback'
import PublicFeedbackPage from './PublicFeedbackPage'
import { fetchFeedbackPage, submitFeedback } from './publicApi'

vi.mock('./publicApi', () => ({
  fetchFeedbackPage: vi.fn(),
  submitFeedback: vi.fn(),
}))

function renderPage(token = 'tok-15') {
  return render(
    <MemoryRouter initialEntries={[`/feedback/${token}`]}>
      <Routes>
        <Route path="/feedback/:token" element={<PublicFeedbackPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// 🔴 **הכוכב נבחר לפי מיקומו בקבוצה, ולא לפי ה-`aria-label` שלו — במכוון, ו**זה הוכיח
// את עצמו**.** ה-`aria-label` פר-כוכב נפלט מ-`RatingStars.jsx`, רכיב-משותף; ההערה כאן
// נכתבה כשהנוסח שלו עוד חרג מהמוקאפ, ונימקה שנעילת-הנוסח בעוזר תהפוך את הבדיקה לחסם
// בפני תיקון של מישהו אחר. ✅ **התיקון אכן הגיע (01/09/2026) והקובץ הזה לא זז בבייט**,
// בעוד **שתי בדיקות-E2E שכן נעלו את הנוסח הישן** (`public-feedback.spec.js`,
// `accessibility.spec.js` — `name: '5 מתוך 5'`) נשברו ודורשות עדכון. ⇒ **המיקום נשאר
// הצורה הנכונה לאתר כוכב בבדיקת-זרימה.** הנוסח עצמו נעול בבדיקה ייעודית אחת למטה,
// שזה מקומה הנכון: היא **על** הנוסח, ולא משתמשת בו כדי לבדוק משהו אחר.
function star(n) {
  return within(screen.getByTestId('feedback-stars')).getAllByRole('button')[n - 1]
}

describe('PublicFeedbackPage — טעינה', () => {
  it('מציג שלד ואז את הטופס עם שם-האירוע והתאריך', async () => {
    fetchFeedbackPage.mockResolvedValue({
      state: 'ok',
      event_name: 'ערב השקה — קמפוס צפון',
      event_date: '2026-09-07',
    })

    renderPage()
    expect(screen.getByTestId('feedback-loading')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByTestId('feedback-form')).toBeInTheDocument())
    expect(fetchFeedbackPage).toHaveBeenCalledWith('tok-15')
    expect(screen.getByText('ערב השקה — קמפוס צפון')).toBeInTheDocument()
    expect(screen.getByText('07/09/2026')).toBeInTheDocument()
  })

  it('"already" בטעינה ⇒ "המשוב כבר התקבל, תודה", בלי כפתור-נסיון-חוזר', async () => {
    fetchFeedbackPage.mockResolvedValue({ state: 'already' })
    renderPage()
    await waitFor(() =>
      expect(screen.getByTestId(`feedback-result-${FEEDBACK_STATE.already}`)).toBeInTheDocument(),
    )
    expect(screen.getByText('המשוב כבר התקבל, תודה')).toBeInTheDocument()
    expect(screen.queryByTestId('feedback-retry')).not.toBeInTheDocument()
  })

  it('"not_found" בטעינה ⇒ "הקישור אינו בתוקף"', async () => {
    fetchFeedbackPage.mockResolvedValue({ state: 'not_found' })
    renderPage()
    await waitFor(() =>
      expect(screen.getByTestId(`feedback-result-${FEEDBACK_STATE.dead}`)).toBeInTheDocument(),
    )
    expect(screen.getByText('הקישור אינו בתוקף')).toBeInTheDocument()
  })

  it('כשל-רשת בטעינה ⇒ מצב saveFailed עם "נסו שוב", ולחיצה עליו טוענת מחדש', async () => {
    fetchFeedbackPage.mockRejectedValueOnce(new Error('network down'))
    renderPage()

    await waitFor(() =>
      expect(
        screen.getByTestId(`feedback-result-${FEEDBACK_STATE.saveFailed}`),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('לא הצלחנו לשמור את המשוב. אפשר לנסות שוב.')).toBeInTheDocument()

    fetchFeedbackPage.mockResolvedValueOnce({
      state: 'ok',
      event_name: 'כנס משקיעים שנתי',
      event_date: '2026-08-25',
    })
    fireEvent.click(screen.getByTestId('feedback-retry'))

    await waitFor(() => expect(screen.getByTestId('feedback-form')).toBeInTheDocument())
    expect(fetchFeedbackPage).toHaveBeenCalledTimes(2)
  })
})

// 🔴 **מה החבילה הזו נועלת: מה שהלקוח קורא — ולא מה שהמנהלת קוראת.** `RatingStars` נכתב
// לקהל הפנימי, והדף הזה הוא הקהל השני. שלוש הבדיקות למטה הן היחידות במערכת שיאדימו אם
// מישהו "יאחד בחזרה" את שני הקהלים לנוסח אחד — פגם שאינו מפיל שום בדיקה אחרת, ושישי
// לא יתפוס בעין כי "טרם התרשמת" נראה כמו עברית תקינה עד שקוראים למי הוא מדבר.
describe('PublicFeedbackPage — הכוכבים מדברים אל הלקוח, לא אל המנהלת', () => {
  async function openForm() {
    fetchFeedbackPage.mockResolvedValue({
      state: 'ok',
      event_name: 'ערב השקה — קמפוס צפון',
      event_date: '2026-09-07',
    })
    renderPage()
    await waitFor(() => expect(screen.getByTestId('feedback-form')).toBeInTheDocument())
  }

  it('🔴 חמשת ה-aria-label הם "כוכב 1"…"כוכב 5" — מוקאפ מאושר + screens-approved §S4/①', async () => {
    await openForm()
    const group = within(screen.getByTestId('feedback-stars'))
    for (const n of [1, 2, 3, 4, 5]) {
      expect(group.getByRole('button', { name: `כוכב ${n}` })).toBeInTheDocument()
    }
  })

  it('🔴 אין כיתוב-מנהלת על הדף הציבורי — לא "טרם התרשמת" ולא "N מתוך 5"', async () => {
    await openForm()
    // לפני בחירה: הנוסח הריק הוא לשון-נקבה-יחיד ("התרשמת"), והדף כולו ברבים.
    expect(screen.queryByText('טרם התרשמת')).not.toBeInTheDocument()
    expect(screen.queryByText(/התרשמ/)).not.toBeInTheDocument()
    // ואחרי בחירה: גם הנוסח המלא לא צץ — הפער היה בשני הצדדים, לא רק בריק.
    fireEvent.click(star(4))
    expect(screen.queryByText(/מתוך 5/)).not.toBeInTheDocument()
    // מה שכן נשאר — הכיתוב היחיד שהמוקאפ מצייר, ברבים.
    expect(screen.getByText('געו בכוכב כדי לדרג')).toBeInTheDocument()
  })

  it('🔴 הכוכב הנבחר נצבע בטורקיז-המותג — הדירוג הוא הפעולה הראשית (§S4/⑧4)', async () => {
    await openForm()
    fireEvent.click(star(3))
    const stars = within(screen.getByTestId('feedback-stars')).getAllByRole('button')
    expect(stars.slice(0, 3).every((b) => b.className.includes('text-teal-600'))).toBe(true)
    expect(stars.slice(3).every((b) => b.className.includes('text-slate-300'))).toBe(true)
    // 🚫 ולא אפור-המנהלת, שהיה כאן עד 01/09/2026.
    expect(stars.some((b) => b.className.includes('text-slate-700'))).toBe(false)
  })
})

describe('PublicFeedbackPage — הגשה', () => {
  async function openForm() {
    fetchFeedbackPage.mockResolvedValue({
      state: 'ok',
      event_name: 'ערב השקה — קמפוס צפון',
      event_date: '2026-09-07',
    })
    renderPage()
    await waitFor(() => expect(screen.getByTestId('feedback-form')).toBeInTheDocument())
  }

  it('A-1: "שלח" חסום כל עוד לא נבחר כוכב, ונפתח אחרי בחירה', async () => {
    await openForm()
    const submitBtn = screen.getByTestId('feedback-submit')
    expect(submitBtn).toBeDisabled()

    fireEvent.click(star(3))
    expect(submitBtn).not.toBeDisabled()
  })

  it('הגשה מוצלחת שולחת token+score+notes, ומעבירה למסך-התודה', async () => {
    await openForm()
    fireEvent.click(star(4))
    fireEvent.change(screen.getByLabelText('רוצים לספר לנו עוד? (רשות)'), {
      target: { value: 'היה נהדר' },
    })
    submitFeedback.mockResolvedValue({ state: 'ok' })

    fireEvent.click(screen.getByTestId('feedback-submit'))

    await waitFor(() =>
      expect(screen.getByTestId(`feedback-result-${FEEDBACK_STATE.thankYou}`)).toBeInTheDocument(),
    )
    expect(submitFeedback).toHaveBeenCalledWith('tok-15', 4, 'היה נהדר', [], [])
    expect(screen.getByText('תודה שלקחתם רגע לספר לנו איך היה!')).toBeInTheDocument()
  })

  it('תשובת "already" בהגשה (מרוץ) ⇒ אותו מסך כמו הגשה-שנייה, לא תקלה', async () => {
    await openForm()
    fireEvent.click(star(2))
    submitFeedback.mockResolvedValue({ state: 'already' })

    fireEvent.click(screen.getByTestId('feedback-submit'))

    await waitFor(() =>
      expect(screen.getByTestId(`feedback-result-${FEEDBACK_STATE.already}`)).toBeInTheDocument(),
    )
  })

  it('כשל-רשת בהגשה ⇒ saveFailed, לעולם לא מסך-תודה על ניחוש', async () => {
    await openForm()
    fireEvent.click(star(5))
    submitFeedback.mockRejectedValue(new Error('timeout'))

    fireEvent.click(screen.getByTestId('feedback-submit'))

    await waitFor(() =>
      expect(
        screen.getByTestId(`feedback-result-${FEEDBACK_STATE.saveFailed}`),
      ).toBeInTheDocument(),
    )
    expect(
      screen.queryByTestId(`feedback-result-${FEEDBACK_STATE.thankYou}`),
    ).not.toBeInTheDocument()
  })

  it('תשובת "invalid" — נשארים בטופס עם שגיאה מקומית, לא "נשמר" מזויף', async () => {
    await openForm()
    fireEvent.click(star(1))
    submitFeedback.mockResolvedValue({ state: 'invalid' })

    fireEvent.click(screen.getByTestId('feedback-submit'))

    await waitFor(() =>
      expect(
        screen.getByText('לא ניתן לשלוח בלי לבחור דירוג — געו בכוכב ונסו שוב.'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByTestId('feedback-form')).toBeInTheDocument()
    expect(
      screen.queryByTestId(`feedback-result-${FEEDBACK_STATE.thankYou}`),
    ).not.toBeInTheDocument()
  })
})

describe("PublicFeedbackPage — צ'יפים לשיפור ולשימור (Progressive Chips)", () => {
  async function openForm() {
    fetchFeedbackPage.mockResolvedValue({
      state: 'ok',
      event_name: 'ערב השקה — קמפוס צפון',
      event_date: '2026-09-07',
    })
    renderPage()
    await waitFor(() => expect(screen.getByTestId('feedback-form')).toBeInTheDocument())
  }

  it("לפני בחירת כוכב — מקטע הצ'יפים אינו מופיע כלל", async () => {
    await openForm()
    expect(screen.queryByTestId('feedback-chips-section')).not.toBeInTheDocument()
  })

  it('בציון נמוך (1–3) — מופיעות סיבות לשיפור', async () => {
    await openForm()
    fireEvent.click(star(2))

    expect(screen.getByTestId('feedback-chips-section')).toBeInTheDocument()
    expect(screen.getByText('במה נוכל להשתפר? (אפשר לסמן יותר מאחד)')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-chip-איחור דיילות')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-chip-תפקוד דיילות')).toBeInTheDocument()
  })

  it('בציון גבוה (4–5) — מופיעים הדגשים לשימור', async () => {
    await openForm()
    fireEvent.click(star(5))

    expect(screen.getByTestId('feedback-chips-section')).toBeInTheDocument()
    expect(screen.getByText('מה בלט לטובה? (אפשר לסמן יותר מאחד)')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-chip-מקצועיות הדיילות')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-chip-עמידה בזמנים')).toBeInTheDocument()
  })

  it("לחיצה על צ'יפ בוחרת אותו, ולחיצה חוזרת מבטלת (Toggle)", async () => {
    await openForm()
    fireEvent.click(star(2))

    const chip = screen.getByTestId('feedback-chip-איחור דיילות')
    expect(chip).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it("מעבר מציון נמוך לציון גבוה מאפס את הבחירה השלילית ומציג צ'יפים חיוביים", async () => {
    await openForm()
    fireEvent.click(star(2))
    const negChip = screen.getByTestId('feedback-chip-איחור דיילות')
    fireEvent.click(negChip)
    expect(negChip).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(star(5))
    expect(screen.queryByTestId('feedback-chip-איחור דיילות')).not.toBeInTheDocument()
    expect(screen.getByText('מה בלט לטובה? (אפשר לסמן יותר מאחד)')).toBeInTheDocument()
  })

  it("שליחה עם מספר צ'יפים שליליים מעבירה negativeReasons כמערך ל-API", async () => {
    await openForm()
    fireEvent.click(star(2))
    fireEvent.click(screen.getByTestId('feedback-chip-איחור דיילות'))
    fireEvent.click(screen.getByTestId('feedback-chip-תפקוד דיילות'))
    submitFeedback.mockResolvedValue({ state: 'ok' })

    fireEvent.click(screen.getByTestId('feedback-submit'))

    await waitFor(() =>
      expect(screen.getByTestId(`feedback-result-${FEEDBACK_STATE.thankYou}`)).toBeInTheDocument(),
    )
    expect(submitFeedback).toHaveBeenCalledWith(
      'tok-15',
      2,
      '',
      ['איחור דיילות', 'תפקוד דיילות'],
      [],
    )
  })

  it("שליחה עם מספר צ'יפים חיוביים מעבירה positiveReasons כמערך ל-API", async () => {
    await openForm()
    fireEvent.click(star(5))
    fireEvent.click(screen.getByTestId('feedback-chip-מקצועיות הדיילות'))
    fireEvent.click(screen.getByTestId('feedback-chip-עמידה בזמנים'))
    submitFeedback.mockResolvedValue({ state: 'ok' })

    fireEvent.click(screen.getByTestId('feedback-submit'))

    await waitFor(() =>
      expect(screen.getByTestId(`feedback-result-${FEEDBACK_STATE.thankYou}`)).toBeInTheDocument(),
    )
    expect(submitFeedback).toHaveBeenCalledWith(
      'tok-15',
      5,
      '',
      [],
      ['מקצועיות הדיילות', 'עמידה בזמנים'],
    )
  })
})
