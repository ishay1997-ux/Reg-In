// בדיקת TemplateEditor (S2, מודול 9) — נועלת את שלושת המצבים מהמוקאפ (§3א/ב/ג): תקין,
// חסום (משתנה-חובה חסר), אזהרה (משתנה-רשות חסר); את הכנסת-הצ'יפ בסמן; את הסינון של שורה
// בלי חוזה ב-TEMPLATE_PLACEHOLDERS; ואת מצב-הקריאה-בלבד.
import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TemplateEditor from './TemplateEditor'

// שורות-פיקסצ'ר בצורת שורת-DB גולמית (`param_name`/`param_type`/`owner_role_id`) — בדיוק
// כמו ש-`ParamsTab`/`MySettingsPage` באמת מעבירות ל-`paneComponents.templates` (§10, חיווט
// גל 2: הרכיב קורא `row.param_name` ושולף תווית מהמרשם החי, לא מ-`row.label`). שני השמות
// האמיתיים כאן קיימים ב-`PARAM_REGISTRY` (paramsRegistry.js) עם התוויות הבאות בדיוק.
const SHIFT_INVITE_ROW = {
  param_name: 'תבנית_זימון_משמרת',
  param_value: '',
  param_type: 'templates',
  owner_role_id: null,
}
const FEEDBACK_ROW = {
  param_name: 'תבנית_מייל_משוב_לקוח',
  param_value: '',
  param_type: 'templates',
  owner_role_id: null,
}
// שם שאינו קיים ב-PARAM_REGISTRY וגם לא ב-TEMPLATE_PLACEHOLDERS — מדמה שורת-templates
// עתידית בלי חוזה (§6 צעד 3.2: "רשת-ביטחון לעתיד" — נופלת בשקט מהרשימה).
const UNKNOWN_ROW = {
  param_name: 'תבנית_בלי_חוזה',
  param_value: '',
  param_type: 'templates',
  owner_role_id: null,
}

const FULL_BODY =
  'היי [שם_דיילת], אירוע [שם_פרויקט] בתאריך [תאריך_אירוע] משעה [שעת_התחלה] עד [שעת_סיום] ' +
  'בעיר [עיר_אירוע] בתעריף [תעריף_שעתי_דיילת]. לאישור: [לינק_אישור_משמרת]'

function renderEditor(props = {}) {
  const onChange = vi.fn()
  const onVerdict = vi.fn()
  const utils = render(
    <TemplateEditor
      rows={[SHIFT_INVITE_ROW, FEEDBACK_ROW]}
      values={{ [SHIFT_INVITE_ROW.param_name]: FULL_BODY }}
      onChange={onChange}
      canEdit={() => true}
      errors={{}}
      onVerdict={onVerdict}
      {...props}
    />,
  )
  return { ...utils, onChange, onVerdict }
}

describe('TemplateEditor', () => {
  it('גוף מלא (כל המשתנים במקום) — בלי הערת-חסימה ובלי הערת-אזהרה', () => {
    renderEditor()
    expect(screen.queryByTestId('settings-template-blocked')).not.toBeInTheDocument()
    expect(screen.queryByTestId('settings-template-warning')).not.toBeInTheDocument()
  })

  it('הסרת משתנה-חובה [לינק_אישור_משמרת] ⇒ נחסם, עם המשפט מ-templateSaveVerdict, ומדווח onVerdict', () => {
    const bodyMissingLink = FULL_BODY.replace('[לינק_אישור_משמרת]', '')
    const { onVerdict } = renderEditor({
      values: { [SHIFT_INVITE_ROW.param_name]: bodyMissingLink },
    })

    const blocked = screen.getByTestId('settings-template-blocked')
    expect(blocked.textContent).toContain('בלי [לינק_אישור_משמרת]')
    expect(screen.queryByTestId('settings-template-warning')).not.toBeInTheDocument()

    expect(onVerdict).toHaveBeenCalledWith(
      SHIFT_INVITE_ROW.param_name,
      expect.objectContaining({ status: 'blocked' }),
    )
  })

  it('הסרת משתנה-רשות [עיר_אירוע] ⇒ אזהרה בלבד, verdict = warning, לא חוסם', () => {
    const bodyMissingCity = FULL_BODY.replace('[עיר_אירוע]', '')
    const { onVerdict } = renderEditor({
      values: { [SHIFT_INVITE_ROW.param_name]: bodyMissingCity },
    })

    expect(screen.queryByTestId('settings-template-blocked')).not.toBeInTheDocument()
    const warning = screen.getByTestId('settings-template-warning')
    expect(warning.textContent).toContain('[עיר_אירוע]')

    expect(onVerdict).toHaveBeenCalledWith(
      SHIFT_INVITE_ROW.param_name,
      expect.objectContaining({ status: 'warning' }),
    )
  })

  // 🔬 A1 — הבאג שנמדד 03/09/2026: הצ'יפ **הוסיף בסוף** במקום להכניס בסמן, כי `selectionStart`
  // של טקסטה ש-React כתב לה `value` מדווח את **סוף** הטקסט גם כשאיש לא נגע בה. שלוש הבדיקות
  // הבאות נועלות את שלושת המצבים: סמן אמיתי · בחירה פעילה · טקסטה שמעולם לא מוקדה.
  function placeCaret(textarea, start, end = start) {
    fireEvent.focus(textarea)
    textarea.setSelectionRange(start, end)
    fireEvent.select(textarea)
  }

  it('A1 — לחיצה על צ׳יפ מכניסה את הטוקן בדיוק במיקום הסמן', () => {
    const onChange = vi.fn()
    render(
      <TemplateEditor
        rows={[SHIFT_INVITE_ROW]}
        values={{ [SHIFT_INVITE_ROW.param_name]: 'שלום' }}
        onChange={onChange}
        canEdit={() => true}
        errors={{}}
      />,
    )

    placeCaret(screen.getByTestId('settings-template-body'), 2)
    fireEvent.click(screen.getByTestId('settings-template-chip-שם_דיילת'))

    expect(onChange).toHaveBeenCalledWith(SHIFT_INVITE_ROW.param_name, 'של[שם_דיילת]ום')
  })

  it('A1 — בחירה פעילה מוחלפת בטוקן, לא נדחפת הצידה', () => {
    const onChange = vi.fn()
    render(
      <TemplateEditor
        rows={[SHIFT_INVITE_ROW]}
        values={{ [SHIFT_INVITE_ROW.param_name]: 'היי חנה, המשמרת' }}
        onChange={onChange}
        canEdit={() => true}
        errors={{}}
      />,
    )

    // "חנה" (תווים 4–7) מסומן — הצ'יפ מחליף אותו.
    placeCaret(screen.getByTestId('settings-template-body'), 4, 7)
    fireEvent.click(screen.getByTestId('settings-template-chip-שם_דיילת'))

    expect(onChange).toHaveBeenCalledWith(SHIFT_INVITE_ROW.param_name, 'היי [שם_דיילת], המשמרת')
  })

  it('A1 — טקסטה שמעולם לא מוקדה: הטוקן נוסף בשורה חדשה, לעולם לא מודבק למילה האחרונה', () => {
    const onChange = vi.fn()
    render(
      <TemplateEditor
        rows={[SHIFT_INVITE_ROW]}
        values={{ [SHIFT_INVITE_ROW.param_name]: 'היי, נשמח לראותך.' }}
        onChange={onChange}
        canEdit={() => true}
        errors={{}}
      />,
    )

    fireEvent.click(screen.getByTestId('settings-template-chip-שם_דיילת'))

    expect(onChange).toHaveBeenCalledWith(
      SHIFT_INVITE_ROW.param_name,
      ['היי, נשמח לראותך.', '[שם_דיילת]'].join('\n'),
    )
  })

  it('A1 — הוורדיקט מחושב מחדש מהגוף החדש: החזרת המשתנה מהצ׳יפ משחררת את החסימה', () => {
    // 🔴 הרכיב מבוקר (`values` מגיע מבחוץ), ולכן "הוורדיקט מתעדכן" נבדק רק עם מחזיק-מצב
    // אמיתי — בדיוק כמו ש-`ParamsTab` מחזיקה אותו. בלי זה הבדיקה מאמתת רק את הקריאה.
    function Harness() {
      const [body, setBody] = useState(FULL_BODY.replace('[שם_דיילת]', ''))
      return (
        <TemplateEditor
          rows={[SHIFT_INVITE_ROW]}
          values={{ [SHIFT_INVITE_ROW.param_name]: body }}
          onChange={(_name, next) => setBody(next)}
          canEdit={() => true}
          errors={{}}
        />
      )
    }
    render(<Harness />)

    expect(screen.getByTestId('settings-template-blocked').textContent).toContain('בלי [שם_דיילת]')

    placeCaret(screen.getByTestId('settings-template-body'), 4)
    fireEvent.click(screen.getByTestId('settings-template-chip-שם_דיילת'))

    expect(screen.queryByTestId('settings-template-blocked')).not.toBeInTheDocument()
    expect(screen.getByTestId('settings-template-body').value).toContain('[שם_דיילת]')
  })

  it('B2 — טוקן לא-מוכר: החסימה אומרת "למחוק מהטקסט", לא "להחזיר מהרשימה"', () => {
    renderEditor({
      values: { [SHIFT_INVITE_ROW.param_name]: `${FULL_BODY} [משתנה_שלא_קיים]` },
    })
    const blocked = screen.getByTestId('settings-template-blocked')
    expect(blocked.textContent).toContain('משתנה לא מוכר בתבנית')
    expect(blocked.textContent).toContain(
      'השמירה חסומה. צריך למחוק את המשתנה מהטקסט — הוא לא קיים במערכת.',
    )
    expect(blocked.textContent).not.toContain('אפשר להחזיר את המשתנה מהרשימה שלמטה')
  })

  it('B2 — משתנה-חובה חסר: ההוראה נשארת "אפשר להחזיר מהרשימה שלמטה"', () => {
    renderEditor({
      values: { [SHIFT_INVITE_ROW.param_name]: FULL_BODY.replace('[לינק_אישור_משמרת]', '') },
    })
    expect(screen.getByTestId('settings-template-blocked').textContent).toContain(
      'השמירה חסומה. אפשר להחזיר את המשתנה מהרשימה שלמטה.',
    )
  })

  it('שורה מסוג templates בלי חוזה ב-TEMPLATE_PLACEHOLDERS לא נכנסת לרשימה ולא נפתחת', () => {
    renderEditor({ rows: [SHIFT_INVITE_ROW, FEEDBACK_ROW, UNKNOWN_ROW] })
    const list = screen.getByTestId('settings-template-list')
    // שתי השורות בעלות-חוזה בלבד — לא השלישית.
    expect(list.textContent).not.toContain('בלי חוזה')
    expect(list.textContent).toContain('זימון משמרת')
    expect(list.textContent).toContain('משוב לקוח')
  })

  it('שורה יחידה חסרת-חוזה בלבד ⇒ הרכיב לא מרנדר כלום (מגן-הקצה)', () => {
    const { container } = render(
      <TemplateEditor
        rows={[UNKNOWN_ROW]}
        values={{}}
        onChange={() => {}}
        canEdit={() => true}
        errors={{}}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('מצב צפייה-בלבד: הטקסטה קריאה-בלבד, הצ׳יפים מנוטרלים, ואין קריאה ל-onChange בלחיצה', () => {
    const { onChange } = renderEditor({ canEdit: () => false })

    const textarea = screen.getByTestId('settings-template-body')
    expect(textarea).toHaveAttribute('readonly')
    expect(textarea).toBeDisabled()
    expect(screen.getByTestId('settings-template-view-only')).toBeInTheDocument()

    const chip = screen.getByTestId('settings-template-chip-שם_דיילת')
    expect(chip).toBeDisabled()
    fireEvent.click(chip)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('errors[name] מוצג כשורת-שגיאה נוספת', () => {
    renderEditor({ errors: { [SHIFT_INVITE_ROW.param_name]: 'השמירה נכשלה — בדקי חיבור' } })
    expect(screen.getByTestId('settings-template-form-error').textContent).toBe(
      'השמירה נכשלה — בדקי חיבור',
    )
  })
})
