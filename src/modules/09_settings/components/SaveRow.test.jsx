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
    expect(screen.queryByTestId('settings-dirty-count')).not.toBeInTheDocument()
    expect(screen.getByTestId('settings-save-button')).toHaveTextContent('נסי שוב')
  })

  it('בזמן שמירה הכפתור נעול ואומר "שומר..."', () => {
    render(<SaveRow dirtyCount={1} total={7} saving onCancel={() => {}} onSave={() => {}} />)
    expect(screen.getByTestId('settings-save-button')).toBeDisabled()
    expect(screen.getByTestId('settings-save-button')).toHaveTextContent('שומר...')
  })
})
