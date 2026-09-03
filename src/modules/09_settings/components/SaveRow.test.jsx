// בדיקות `SaveRow` (צעד 3.1) — שורת-השמירה של קבוצת-הגדרות.
//
// מה נעול: מונה-השינויים A-2 · שני הכפתורים מושבתים כשאין מה לשמור · שמירה מושבתת
// כשיש שגיאת-ולידציה · **שורת-הכשל הנעולה (§3.7) מחליפה את המונה והכפתור הופך ל"נסי שוב"**.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SaveRow from './SaveRow'

describe('SaveRow', () => {
  it('מציג "שינית N מתוך M"', () => {
    render(<SaveRow dirtyCount={2} total={7} onCancel={() => {}} onSave={() => {}} />)
    expect(screen.getByTestId('settings-dirty-count')).toHaveTextContent('שינית 2 מתוך 7')
  })

  it('קבוצה בת שורה אחת בלי שינוי אומרת "לא שינית כלום", לא "שינית 0 מתוך 1"', () => {
    render(<SaveRow dirtyCount={0} total={1} onCancel={() => {}} onSave={() => {}} />)
    const counter = screen.getByTestId('settings-dirty-count')
    expect(counter).toHaveTextContent('לא שינית כלום')
    expect(counter.textContent).not.toContain('מתוך')
  })

  it('אותה קבוצה **עם** שינוי חוזרת למונה הרגיל', () => {
    render(<SaveRow dirtyCount={1} total={1} onCancel={() => {}} onSave={() => {}} />)
    expect(screen.getByTestId('settings-dirty-count')).toHaveTextContent('שינית 1 מתוך 1')
  })

  it('בלי שינויים שני הכפתורים מושבתים', () => {
    render(<SaveRow dirtyCount={0} total={7} onCancel={() => {}} onSave={() => {}} />)
    expect(screen.getByTestId('settings-save-button')).toBeDisabled()
    expect(screen.getByTestId('settings-cancel-button')).toBeDisabled()
  })

  it('שגיאת-ולידציה משביתה את השמירה אך לא את הביטול', () => {
    render(<SaveRow dirtyCount={1} total={7} disabled onCancel={() => {}} onSave={() => {}} />)
    expect(screen.getByTestId('settings-save-button')).toBeDisabled()
    expect(screen.getByTestId('settings-cancel-button')).toBeEnabled()
  })

  it('מפעיל את שני ההאנדלרים', () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()
    render(<SaveRow dirtyCount={1} total={7} onCancel={onCancel} onSave={onSave} />)
    fireEvent.click(screen.getByTestId('settings-save-button'))
    fireEvent.click(screen.getByTestId('settings-cancel-button'))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('כשל-שמירה מציג את השורה הנעולה ומחליף את תווית-הכפתור', () => {
    render(
      <SaveRow
        dirtyCount={2}
        total={7}
        failedMessage={'השמירה נכשלה ב"אחוז מע"מ" — ייתכן שאין לך הרשאה לשנות אותה'}
        onCancel={() => {}}
        onSave={() => {}}
      />,
    )
    expect(screen.getByTestId('settings-save-failed')).toHaveTextContent(
      'השמירה נכשלה ב"אחוז מע"מ" — ייתכן שאין לך הרשאה לשנות אותה',
    )
    // 🔴 **המונה נשאר** (תוקן 03/09/2026). קודם נבדק כאן ש-`settings-dirty-count` **נעלם** —
    // כלומר הבדיקה נעלה את הפגם: דווקא אחרי כשל, כשהשאלה היא "כמה עוד ממתין", המספר נמחק.
    expect(screen.getByTestId('settings-dirty-count')).toHaveTextContent('שינית 2 מתוך 7')
    expect(screen.getByTestId('settings-save-button')).toHaveTextContent('נסי שוב')
  })

  it('בזמן שמירה הכפתור נעול ואומר "שומר..."', () => {
    render(<SaveRow dirtyCount={1} total={7} saving onCancel={() => {}} onSave={() => {}} />)
    expect(screen.getByTestId('settings-save-button')).toBeDisabled()
    expect(screen.getByTestId('settings-save-button')).toHaveTextContent('שומר...')
  })
  // 🔴 **סיבת-ההשבתה יושבת ליד הכפתור** (אודיט-סגירת מ9, 554px). בלי זה הכפתור מושבת
  // והמשפט המסביר נמצא מחוץ למסך — הפגם שהבדיקות האלה נועלות.
  it('כפתור חסום מציג את הסיבה בפס עצמו, ומקושר אליה לקורא-מסך', () => {
    render(
      <SaveRow
        dirtyCount={3}
        total={9}
        disabled
        blockedReason="פיצוי מלא חייב להיות מוקדם מפיצוי חלקי"
        onCancel={() => {}}
        onSave={() => {}}
      />,
    )
    const reason = screen.getByTestId('settings-save-blocked')
    expect(reason).toHaveTextContent('פיצוי מלא חייב להיות מוקדם מפיצוי חלקי')
    const button = screen.getByTestId('settings-save-button')
    expect(button).toBeDisabled()
    // הקישור עצמו — לא רק שהטקסט קיים, אלא שהכפתור מצביע עליו.
    expect(button.getAttribute('aria-describedby')).toBe(reason.getAttribute('id'))
    expect(screen.getByTestId('settings-dirty-count')).toHaveTextContent('שינית 3 מתוך 9')
  })

  it('כשאין חסימה ואין כשל — אין שורת-סיבה ואין קישור', () => {
    render(<SaveRow dirtyCount={1} total={4} onCancel={() => {}} onSave={() => {}} />)
    expect(screen.queryByTestId('settings-save-blocked')).not.toBeInTheDocument()
    expect(screen.queryByTestId('settings-save-failed')).not.toBeInTheDocument()
    expect(screen.getByTestId('settings-save-button').getAttribute('aria-describedby')).toBeNull()
  })

  it('כשל גובר על חסימה — מוצגת הודעת-הכשל, לא סיבת-החסימה', () => {
    render(
      <SaveRow
        dirtyCount={2}
        total={5}
        disabled
        blockedReason="סיבת חסימה"
        failedMessage="השמירה נכשלה"
        onCancel={() => {}}
        onSave={() => {}}
      />,
    )
    expect(screen.getByTestId('settings-save-failed')).toHaveTextContent('השמירה נכשלה')
    expect(screen.queryByTestId('settings-save-blocked')).not.toBeInTheDocument()
  })
})
