// בדיקות גלולת-המסנן המשותפת — נכתבו 26/08/2026 יחד עם תיקון-ה-tooltip.
//
// מה שנעול כאן הוא **חצי אחד** של ㉚: "מושבת **ומנומק**". החצי השני ("לא מוסתר") נעול
// באתרי-הקריאה — `LogisticsPage.test.jsx` (מ5) ו-`ProjectsPage.test.jsx` (מ6) — ששניהם
// כבר בודקים שגלולת-0 נשארת על המסך ונושאת `title`. מה שאיש לא בדק עד היום הוא שהנימוק
// הזה בכלל **מגיע למשתמשת**: ‏`Button` המשותף נושא `disabled:pointer-events-none`, ולכן
// כפתור מושבת אינו מקבל hit-test והדפדפן אינו מרנדר לו tooltip. הנימוק היה בקוד ולא במסך.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterPill from './FilterPill'

const TITLE = 'אין כרגע פרויקט במצב הזה'

describe('FilterPill — גלולה מושבתת ומנומקת (㉚)', () => {
  it('הנימוק נגיש להינף-עכבר: עטיפה שאינה מושבתת נושאת את אותו title', () => {
    render(
      <FilterPill disabled title={TITLE} testId="probe-pill">
        ממתין למשלוח
      </FilterPill>,
    )
    const button = screen.getByTestId('probe-pill')

    // ① החוזה הקיים לא נשבר: הכפתור עצמו עדיין מושבת ועדיין נושא את הנימוק כשם-נגיש.
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('title', TITLE)

    // ② וזו הסיבה שהעטיפה נחוצה — המחלקה שמכבה את ה-hit-test יושבת על הכפתור עצמו.
    expect(button.className).toContain('disabled:pointer-events-none')

    // ③ ולכן ההינף נופל על העטיפה, שאינה מושבתת ונושאת את אותו נוסח בדיוק.
    const hoverTarget = button.parentElement
    expect(hoverTarget.tagName).toBe('SPAN')
    expect(hoverTarget).toHaveAttribute('title', TITLE)
    expect(hoverTarget).not.toBeDisabled()
  })

  it('העטיפה אינה מחזירה לחיצות לגלולה חסומה', () => {
    const onClick = vi.fn()
    render(
      <FilterPill disabled title={TITLE} onClick={onClick} testId="probe-pill">
        ממתין למשלוח
      </FilterPill>,
    )
    fireEvent.click(screen.getByTestId('probe-pill'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('גלולה מושבתת בלי נימוק אינה נעטפת ואינה ממציאה title', () => {
    // הענף החסום של מ5: "אין כרגע פרויקט במצב הזה" היה טענה על דאטה שאיננו רשאים לקרוא.
    render(
      <FilterPill disabled testId="probe-pill">
        דורש טיפול
      </FilterPill>,
    )
    const button = screen.getByTestId('probe-pill')
    expect(button).toBeDisabled()
    expect(button).not.toHaveAttribute('title')
    expect(button.parentElement).not.toHaveAttribute('title')
    expect(button.parentElement.tagName).not.toBe('SPAN')
  })

  it('גלולה פעילה נשארת ללא עטיפה וללא נימוק', () => {
    const onClick = vi.fn()
    render(
      <FilterPill on onClick={onClick} testId="probe-pill">
        הכול
      </FilterPill>,
    )
    const button = screen.getByTestId('probe-pill')
    expect(button).not.toBeDisabled()
    expect(button).not.toHaveAttribute('title')
    expect(button.parentElement.tagName).not.toBe('SPAN')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
