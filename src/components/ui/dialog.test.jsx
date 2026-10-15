// 🔴 נולדה מממצא של בודק נפרד (15/10/2026): אחרי שההודעות הקופצות הועלו מעל רקע החלון (z-[60]),
// לחיצה על ה-X של הודעת-שגיאה נחשבה "לחיצה מחוץ לחלון" — ו-Radix סגר גם את החלון, עם הקלט שלא נשמר.
import { describe, it, expect } from 'vitest'

// ⚠️ חלון מודאלי של Radix מסמן את כל שאר הדף aria-hidden — כולל ההודעות. לכן מאתרים את ההודעה
// ב-DOM ולא לפי role: ‏getByRole לא מוצא אותה כשהחלון פתוח (חוב נגישות — PROJECT_MASTER §6).
const toastText = (text) =>
  [...document.querySelectorAll('[data-toast-region] *')].find((el) => el.textContent === text)
import { render, screen, act } from '@testing-library/react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, keepOpenOnToast } from './dialog'
import { ToastProvider, useToast } from '../ToastProvider'

function DialogWithToast() {
  const toast = useToast()
  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent>
        <DialogTitle>זמינות דיילת</DialogTitle>
        <DialogDescription>טווח אי-זמינות</DialogDescription>
        <button
          type="button"
          onClick={() => toast.error('יש לבחור גם תאריך התחלה וגם תאריך סיום.')}
        >
          + טווח חדש
        </button>
      </DialogContent>
    </Dialog>
  )
}

describe('DialogContent — לחיצה על הודעה קופצת אינה סוגרת את החלון', () => {
  it('ההודעה מסומנת כאזור-הודעות, כך שהחלון מזהה אותה', () => {
    render(
      <ToastProvider>
        <DialogWithToast />
      </ToastProvider>,
    )
    act(() => screen.getByRole('button', { name: '+ טווח חדש' }).click())
    expect(toastText('יש לבחור גם תאריך התחלה וגם תאריך סיום.')).toBeTruthy()
  })

  // ⚠️ jsdom לא מפעיל את מאזין ה"לחיצה בחוץ" של Radix (נמדד: גם לחיצה על רקע אמיתי לא סגרה את החלון
  // בבדיקה) — בדיקת-לחיצה מלאה כאן הייתה עוברת בלי להוכיח כלום. לכן הפונקציה נבדקת ישירות, והלחיצה
  // האמיתית נבדקת בדפדפן על האתר החי (FREEZE.md · בדיקה בעיניים, 15/10/2026).
  it('keepOpenOnToast: לחיצה בתוך אזור-ההודעות נחסמת ולא מגיעה לסגירה', () => {
    const region = document.createElement('div')
    region.setAttribute('data-toast-region', '')
    const button = document.createElement('button')
    region.append(button)
    document.body.append(region)
    let prevented = false
    let forwarded = false
    keepOpenOnToast(() => {
      forwarded = true
    })({ target: button, preventDefault: () => (prevented = true) })
    expect(prevented).toBe(true)
    expect(forwarded).toBe(false)
    region.remove()
  })

  it('keepOpenOnToast: לחיצה בכל מקום אחר עוברת הלאה כרגיל', () => {
    const outside = document.createElement('div')
    document.body.append(outside)
    let prevented = false
    let forwarded = false
    keepOpenOnToast(() => {
      forwarded = true
    })({ target: outside, preventDefault: () => (prevented = true) })
    expect(prevented).toBe(false)
    expect(forwarded).toBe(true)
    outside.remove()
  })
})
