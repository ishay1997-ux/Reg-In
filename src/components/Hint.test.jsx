// בדיקות <Hint> — הרכיב היחיד של שכבת-ההסבר ("מצב הטמעה", הכרעה 28④/⑭).
// מה נעול כאן: (א) רמה נמוכה מ-level ⇒ כלום על המסך · (ב) רמה 1 במסד **אינה** מציגה טקסט של
// רמה 2 (28⑭ — "הלילה כל Hint הוא level 2", ורמה 1 אינה רמה 2 מקוצרת) · (ג) מפתח חסר ⇒ null
// בשקט + אזהרה בפיתוח, בלי לזרוק ובלי להדליף את המפתח למסך · (ד) הטקסט מגיע מקובץ-הקופי בלבד.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hint from './Hint'
import { ONBOARDING_COPY } from '@/lib/onboardingCopy'

const authState = { onboardingMode: 0 }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))

const KNOWN_ID = 'onboarding.self'
const KNOWN_TEXT = ONBOARDING_COPY[KNOWN_ID].guided

beforeEach(() => {
  authState.onboardingMode = 0
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Hint — נראוּת לפי רמת-ההטמעה', () => {
  it('רמה 0 (כבוי) ⇒ לא מרנדר דבר', () => {
    const { container } = render(<Hint id={KNOWN_ID} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('רמה 2 (מודרך) ⇒ מציג את הטקסט מקובץ-הקופי, עם data-testid לפי המפתח', () => {
    authState.onboardingMode = 2
    render(<Hint id={KNOWN_ID} />)
    expect(screen.getByTestId(`hint-${KNOWN_ID}`)).toHaveTextContent(KNOWN_TEXT)
  })

  it('רמה 1 במסד אינה מציגה Hint של רמה 2 — 28⑭: רמה 1 היא סוג-אמירה אחר, לא קיצור', () => {
    authState.onboardingMode = 1
    const { container } = render(<Hint id={KNOWN_ID} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('level מפורש נמוך יותר: level={1} ורמה 1 — מציג את pointer אם קיים, ולא את guided', () => {
    authState.onboardingMode = 1
    const { container } = render(<Hint id={KNOWN_ID} level={1} />)
    // למפתח הזה אין pointer (רמה 1 אינה נכתבת הלילה) ⇒ כלום, לא נפילה ל-guided.
    expect(container).toBeEmptyDOMElement()
  })

  it('onboardingMode חסר בקונטקסט (למשל בבדיקות ישנות) ⇒ מתנהג כרמה 0', () => {
    authState.onboardingMode = undefined
    const { container } = render(<Hint id={KNOWN_ID} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('Hint — מפתח חסר', () => {
  it('מחזיר null, אינו זורק, ואינו מציג את המפתח על המסך', () => {
    authState.onboardingMode = 2
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<Hint id="no.such.key" />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText(/no\.such\.key/)).not.toBeInTheDocument()
    // בפיתוח (vitest רץ עם DEV=true) — אזהרה אחת עם המפתח, כדי שהמפתחת תראה את שגיאת-ההקלדה.
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('no.such.key')
  })

  it('כשהמתג כבוי — לא בודק את המפתח בכלל (אפס אזהרות על מסך שלא מציג הסברים)', () => {
    authState.onboardingMode = 0
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Hint id="no.such.key" />)
    expect(warn).not.toHaveBeenCalled()
  })
})
