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

// 🔴 **הכוכב נבחר לפי מיקומו בקבוצה, ולא לפי ה-`aria-label` שלו — במכוון.**
// ה-`aria-label` פר-כוכב נפלט מ-`RatingStars.jsx`, רכיב-משותף שהקובץ הזה אינו בבעלותו,
// והנוסח שלו כרגע חורג ממה שהמוקאפ המאושר נועל (ר' פער (3) בהערת-הראש של המסך). שאילתה
// לפי הנוסח הנוכחי הייתה **נועלת את הפער בבדיקה** ומאדימה אותה ברגע שהרכיב יתוקן —
// כלומר הופכת את הבדיקה שלי לחסם בפני תיקון של מישהו אחר. המיקום יציב בשני העולמות.
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
    expect(submitFeedback).toHaveBeenCalledWith('tok-15', 4, 'היה נהדר')
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
