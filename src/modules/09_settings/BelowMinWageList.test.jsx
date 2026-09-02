// בדיקות `BelowMinWageList` (צעד 3.6) — שלושת המצבים ששלמות המסך תלויה בהם.
//
// 🔴 המצב השלישי הוא הקריטי: `blocked` (‏42501 מה-RPC) חייב **להעלים את הפאנל**, לעולם
// לא להציג "0". "אפס שורות ⇒ אין אף אחת מתחת לרף" על קריאה שנחסמה הוא בדיוק השקר
// שכל מודול 6 בנה נגדו `DENIED_MARK` (‏`src/CLAUDE.md`).

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import BelowMinWageList from './BelowMinWageList'
import { listBelowMinWage, PARAMS_ERROR_CODE } from './api'

vi.mock('@/supabaseClient', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn(), auth: { getSession: vi.fn() } },
}))

vi.mock('./api', async () => {
  const actual = await vi.importActual('./api')
  return { ...actual, listBelowMinWage: vi.fn() }
})

beforeEach(() => vi.clearAllMocks())

describe('BelowMinWageList', () => {
  it('ריק — אומר זאת במפורש, עם הרף השמור בכותרת', async () => {
    listBelowMinWage.mockResolvedValue([])
    render(<BelowMinWageList threshold="35" />)
    expect(await screen.findByTestId('settings-below-min-wage-empty')).toHaveTextContent(
      'אין דיילות פעילות מתחת לרף הנוכחי',
    )
    expect(screen.getByTestId('settings-below-min-wage')).toHaveTextContent('מי מתחת לשכר המינימום')
    expect(screen.getByTestId('settings-below-min-wage')).toHaveTextContent('35 ₪')
  })

  it('מאוכלס — שורה לכל דיילת עם שמה ותעריפה', async () => {
    listBelowMinWage.mockResolvedValue([
      { hostess_id: 7, full_name: 'מירב אטיאס', hourly_rate: '38' },
      { hostess_id: 9, full_name: 'ליאת פרץ', hourly_rate: '39' },
    ])
    render(<BelowMinWageList threshold="40" />)
    const rows = await screen.findAllByTestId('settings-below-min-wage-row')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('מירב אטיאס')
    expect(rows[0]).toHaveTextContent('38 ₪')
    expect(rows[1]).toHaveTextContent('ליאת פרץ')
  })

  it('חסום (42501) — הפאנל נעלם לגמרי, ולא מוצג "0"', async () => {
    const blocked = Object.assign(new Error('אין לך הרשאה לצפות ברשימת השכר'), {
      code: PARAMS_ERROR_CODE.BLOCKED,
    })
    listBelowMinWage.mockRejectedValue(blocked)
    render(<BelowMinWageList threshold="35" />)
    await waitFor(() =>
      expect(screen.queryByTestId('settings-below-min-wage')).not.toBeInTheDocument(),
    )
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('תקלה אחרת — נאמרת ולא נבלעת', async () => {
    listBelowMinWage.mockRejectedValue(new Error('שגיאה בטעינת רשימת הדיילות.'))
    render(<BelowMinWageList threshold="35" />)
    expect(await screen.findByText('שגיאה בטעינת רשימת הדיילות.')).toBeInTheDocument()
  })

  it('`refreshKey` מפעיל שליפה מחדש — הרשימה מגיבה לרף שנשמר', async () => {
    listBelowMinWage.mockResolvedValue([])
    const { rerender } = render(<BelowMinWageList threshold="35" refreshKey={0} />)
    await screen.findByTestId('settings-below-min-wage-empty')
    expect(listBelowMinWage).toHaveBeenCalledTimes(1)

    listBelowMinWage.mockResolvedValue([
      { hostess_id: 7, full_name: 'מירב אטיאס', hourly_rate: '38' },
    ])
    rerender(<BelowMinWageList threshold="40" refreshKey={1} />)
    expect(await screen.findByTestId('settings-below-min-wage-row')).toHaveTextContent('מירב אטיאס')
    expect(listBelowMinWage).toHaveBeenCalledTimes(2)
  })
})

// 🆕 תצוגה-מקדימה (הוראת-אורקסטרטור, מיגרציה D 02/09/2026): `draftThreshold` שונה מהרף
// השמור ⇒ אחרי דמדום ~400ms נשלפת רשימה מול הערך המוקלד, עם הערה "תצוגה מקדימה — טרם נשמר".
// 🕓 שעונים אמיתיים במתכוון (לא `vi.useFakeTimers`) — `findBy*`/`waitFor` של testing-library
// סוקרים ב-`setTimeout` אמיתי, ומעורבים עם שעונים-מדומים הם נתקעים עד תפוגת-הבדיקה (נמדד:
// הניסיון הראשון עם שעון-מדומה קרס ב-timeout של 5000ms על הבדיקה הראשונה בדיוק מהסיבה הזו).
describe('BelowMinWageList — תצוגה מקדימה מול טיוטה', () => {
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  it('טיוטה שונה מהרף השמור ⇒ אחרי הדמדום נקראת listBelowMinWage(40), עם הערת-תצוגה-מקדימה', async () => {
    listBelowMinWage.mockResolvedValue([])
    render(<BelowMinWageList threshold="35" draftThreshold="40" />)

    // לפני שהדמדום הסתיים — עדיין רק הקריאה הראשונית (בלי סף, מול השמור).
    expect(listBelowMinWage).toHaveBeenCalledTimes(1)
    expect(listBelowMinWage).not.toHaveBeenCalledWith(40)

    await wait(450)
    await waitFor(() => expect(listBelowMinWage).toHaveBeenCalledWith(40))

    expect(await screen.findByTestId('settings-below-min-wage-preview')).toHaveTextContent(
      'תצוגה מקדימה — טרם נשמר',
    )
    expect(screen.getByTestId('settings-below-min-wage')).toHaveTextContent('40 ₪')
  })

  it('טיוטה זהה לרף השמור ⇒ אין תצוגה-מקדימה, נקראת listBelowMinWage() בלי סף', async () => {
    listBelowMinWage.mockResolvedValue([])
    render(<BelowMinWageList threshold="35" draftThreshold="35" />)
    await wait(450)

    expect(listBelowMinWage).toHaveBeenCalledWith(undefined)
    expect(screen.queryByTestId('settings-below-min-wage-preview')).not.toBeInTheDocument()
  })
})
