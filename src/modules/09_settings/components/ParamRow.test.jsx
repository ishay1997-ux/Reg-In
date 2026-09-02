// בדיקות `ParamRow` (צעד 3.1) — שורת-ההגדרה שמשמשת את שלושת המשטחים.
//
// מה נעול: התווית/ההסבר/היחידה מגיעים **מהמרשם** ולא מהקומפוננטה · זוג ערך+יחידה בעטיפת
// כיווניות אחת (`src/CLAUDE.md`) · בוליאני הוא מתג ולא שדה-טקסט · שורת-תבנית לקריאה בלבד
// (רשת-הביטחון אם `PaneComponent` נעדר, §3.4) · שורה שאין לה שורה במרשם **מוצגת** ולא
// מוסתרת (§2.8) · `disabled` ללא הרשאה · קישור ההודעה לשדה ב-`aria-describedby`.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ParamRow from './ParamRow'

function renderRow(props) {
  return render(
    <table>
      <tbody>
        <ParamRow canEdit onChange={() => {}} {...props} />
      </tbody>
    </table>,
  )
}

function row(name, value, type = 'pricing_timing') {
  return { param_name: name, param_value: value, param_type: type, owner_role_id: null }
}

describe('ParamRow', () => {
  it('מציג תווית, הסבר ויחידה מהמרשם', () => {
    renderRow({ row: row('אחוז_מעמ', '18'), value: '18' })
    expect(screen.getByText('אחוז מע"מ')).toBeInTheDocument()
    expect(screen.getByText('אחוז המע"מ שמתווסף לכל הצעת מחיר חדשה')).toBeInTheDocument()
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  it('הערך והיחידה יושבים בתוך עטיפת-כיווניות אחת', () => {
    renderRow({ row: row('שכר_מינימום_שעתי', '35'), value: '35' })
    const input = screen.getByTestId('settings-value-שכר_מינימום_שעתי')
    const wrapper = input.parentElement
    expect(wrapper).toHaveAttribute('dir', 'ltr')
    // אותו הורה נושא גם את היחידה — זו בדיוק ההגנה מפני "תווית מעל הערך של מישהו אחר".
    expect(wrapper).toHaveTextContent('₪')
  })

  it('מציג את הערת "משפיע" כשהמרשם נושא אחת', () => {
    renderRow({ row: row('אחוז_מעמ', '18'), value: '18' })
    expect(screen.getByText(/משנה את סכום המע"מ בהצעות מחיר חדשות/)).toBeInTheDocument()
  })

  it('מדווח שינוי עם שם-הפרמטר', () => {
    const onChange = vi.fn()
    renderRow({ row: row('אחוז_מעמ', '18'), value: '18', onChange })
    fireEvent.change(screen.getByTestId('settings-value-אחוז_מעמ'), { target: { value: '17' } })
    expect(onChange).toHaveBeenCalledWith('אחוז_מעמ', '17')
  })

  it('בלי הרשאת עריכה השדה מושבת', () => {
    renderRow({ row: row('אחוז_מעמ', '18'), value: '18', canEdit: false })
    expect(screen.getByTestId('settings-value-אחוז_מעמ')).toBeDisabled()
  })

  it('שגיאה מוצגת, מסומנת ומקושרת לשדה', () => {
    renderRow({ row: row('אחוז_מעמ', ''), value: '', error: 'ערך חוקי: מספר בין 0 ל-100' })
    const input = screen.getByTestId('settings-value-אחוז_מעמ')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toBe('settings-error-אחוז_מעמ')
    expect(screen.getByRole('alert')).toHaveTextContent('ערך חוקי: מספר בין 0 ל-100')
  })

  it('פרמטר בוליאני מרונדר כמתג, ומדווח "true"/"false"', () => {
    const onChange = vi.fn()
    renderRow({
      row: row('מרכיב_אמינות_פעיל', 'false', 'smart_match'),
      value: 'false',
      onChange,
    })
    const toggle = screen.getByTestId('settings-value-מרכיב_אמינות_פעיל')
    expect(toggle).toHaveAttribute('role', 'switch')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith('מרכיב_אמינות_פעיל', 'true')
  })

  it('שורת-תבנית מוצגת לקריאה בלבד (רשת-הביטחון של PaneComponent, גל 2 §3.4)', () => {
    renderRow({
      row: row('תבנית_מייל_הצעת_מחיר', 'שלום [שם_איש_קשר]', 'templates'),
      value: 'שלום [שם_איש_קשר]',
    })
    const body = screen.getByTestId('settings-value-תבנית_מייל_הצעת_מחיר')
    expect(body.tagName).toBe('DIV')
    expect(body).toHaveTextContent('שלום [שם_איש_קשר]')
  })

  it('שורה שאינה במרשם מוצגת בשמה הגולמי ועם הערה גלויה — לעולם לא מוסתרת', () => {
    renderRow({ row: row('פרמטר_חדש_שנזרע', 'x', 'integration_tech'), value: 'x' })
    expect(screen.getByText('פרמטר_חדש_שנזרע')).toBeInTheDocument()
    expect(screen.getByText('הגדרה ללא הגדרת-תצוגה')).toBeInTheDocument()
    expect(screen.getByText('שורה זו אינה מוכרת למרשם התצוגה.')).toBeInTheDocument()
  })
})
