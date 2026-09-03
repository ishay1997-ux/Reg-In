// בדיקות `SmartMatchPane` (S3, צעד 3.3) — נועלות: נוסח-האזהרה לפי `variant` (§3.7) · פס-הסכום
// ירוק/ענבר לפי `weightsSumOk` · כלל-השורה-החלקית (שורת-מרחק בודדת לעולם לא מוצגת לבד) ·
// המונה-החי לצד מתג-האמינות (A-10, מוקן) · דיווח-הבוליאני כטקסט · מצב-צפייה-בלבד.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SmartMatchPane from './SmartMatchPane'
import { SMART_MATCH_PARAM_NAMES as N } from '@/lib/smartMatch'
import { countAttendanceRows } from '@/modules/09_settings/api'

vi.mock('@/modules/09_settings/api', () => ({
  countAttendanceRows: vi.fn(),
}))

function row(name, value) {
  return { param_name: name, param_value: value, param_type: 'smart_match', owner_role_id: null }
}

const ALL_NAMES = [
  N.responsivenessWeight,
  N.reliabilityWeight,
  N.proximityWeight,
  N.gateDistanceKm,
  N.goalpostDistanceKm,
  N.dampingConstant,
  N.windowMonths,
  N.extendedWindowMonths,
  N.minAnswersForScore,
  N.fairnessRatePerWeek,
  N.fairnessWeeksCap,
  N.unansweredStreak,
  N.reliabilityEnabled,
]

const DEFAULT_VALUES = {
  [N.responsivenessWeight]: '0.40',
  [N.reliabilityWeight]: '0.35',
  [N.proximityWeight]: '0.25',
  [N.gateDistanceKm]: '80',
  [N.goalpostDistanceKm]: '40',
  [N.dampingConstant]: '5',
  [N.windowMonths]: '6',
  [N.extendedWindowMonths]: '12',
  [N.minAnswersForScore]: '3',
  [N.fairnessRatePerWeek]: '0.02',
  [N.fairnessWeeksCap]: '4',
  [N.unansweredStreak]: '3',
  [N.reliabilityEnabled]: 'false',
}

function allRows(names = ALL_NAMES) {
  return names.map((name) => row(name, DEFAULT_VALUES[name]))
}

async function renderPane(props = {}) {
  const onChange = vi.fn()
  const utils = render(
    <SmartMatchPane
      rows={allRows()}
      values={DEFAULT_VALUES}
      onChange={onChange}
      canEdit={() => true}
      errors={{}}
      variant="ceo"
      {...props}
    />,
  )
  // ממתינים לאפקט-הטעינה של המונה-החי כדי שעדכון-state אחרי הבדיקה לא ידלוף (act warning).
  await waitFor(() => expect(countAttendanceRows).toHaveBeenCalled())
  // 🔴 **ולא מספיק ש**נקראה** — צריך שה-state שלה כבר נחת** (03/09/2026, נתפס ב-CI).
  // ההמתנה למעלה מסתיימת ברגע שהפונקציה הופעלה, בעוד שהערך מגיע רק ב-microtask הבא —
  // ולכן שלוש הבדיקות שקוראות את שורת-הנוכחות היו **מרוץ**: על רץ עמוס הן מקבלות
  // "טוען נתוני נוכחות…" במקום הנוסח הסופי. **נמדד, לא שוער:** אותו commit בדיוק
  // (`ad35bb0`) עבר בריצת-CI אחת ונפל באחרת. ⚠️ `queryBy` ולא `getBy`, ו-`?? ''` —
  // כדי שבדיקה שמרנדרת בלי שורת-האמינות לא תתלה כאן על אלמנט שלא אמור להתקיים.
  await waitFor(() => {
    const note = screen.queryByTestId('settings-smartmatch-attendance-note')
    expect(note?.textContent ?? '').not.toBe('טוען נתוני נוכחות…')
  })
  return { ...utils, onChange }
}

beforeEach(() => {
  countAttendanceRows.mockReset()
  countAttendanceRows.mockResolvedValue({ total: 27, withAttendance: 1 })
})

describe('SmartMatchPane', () => {
  it('variant="ceo" מציגה את אזהרת-המנכ"ל הנעולה', async () => {
    await renderPane({ variant: 'ceo' })
    const banner = screen.getByTestId('settings-smartmatch-warning')
    expect(banner.textContent).toContain(
      'שינוי כאן משנה שיבוצים אמיתיים. הדירוג שמנהלת השיבוץ תראה מחר ייראה אחרת',
    )
    expect(screen.queryByTestId('settings-smartmatch-warning-owner')).not.toBeInTheDocument()
  })

  it('variant="owner" מציגה את אזהרת-הבעלים הנעולה, לא את אזהרת-המנכ"ל', async () => {
    await renderPane({ variant: 'owner' })
    const banner = screen.getByTestId('settings-smartmatch-warning-owner')
    expect(banner.textContent).toBe('שינוי כאן משנה את הדירוג שתראי מחר במסך השיבוץ.')
    expect(screen.queryByTestId('settings-smartmatch-warning')).not.toBeInTheDocument()
  })

  it('פס-הסכום ירוק ("תקין") כשהמשקולות 0.40/0.35/0.25 מסתכמות ל-1.00', async () => {
    await renderPane()
    expect(screen.getByTestId('settings-smartmatch-weights-sum-tag').textContent).toBe('תקין')
  })

  it('פס-הסכום ענבר כשהמשקולות 0.40/0.35/0.30 לא מסתכמות ל-1.00', async () => {
    await renderPane({ values: { ...DEFAULT_VALUES, [N.proximityWeight]: '0.30' } })
    const tag = screen.getByTestId('settings-smartmatch-weights-sum-tag')
    expect(tag.textContent).not.toBe('תקין')
  })

  it('שורת-הגולפוסט חסרה מ-rows ⇒ כל בלוק-המרחקים (כולל שורת-השער) מוסתר, לא חצי-מרונדר', async () => {
    await renderPane({
      rows: allRows(ALL_NAMES.filter((name) => name !== N.goalpostDistanceKm)),
    })
    expect(screen.queryByTestId(`settings-value-${N.goalpostDistanceKm}`)).not.toBeInTheDocument()
    expect(screen.queryByTestId(`settings-value-${N.gateDistanceKm}`)).not.toBeInTheDocument()
  })

  it('שתי שורות-המרחק קיימות ⇒ שתיהן מוצגות', async () => {
    await renderPane()
    expect(screen.getByTestId(`settings-value-${N.gateDistanceKm}`)).toBeInTheDocument()
    expect(screen.getByTestId(`settings-value-${N.goalpostDistanceKm}`)).toBeInTheDocument()
  })

  it('מונה חי = 1 ⇒ הנוסח היחידאי, עם המספר החי ועם הסיבה שזה משנה', async () => {
    await renderPane()
    const note = screen.getByTestId('settings-smartmatch-attendance-note')
    // 🔤 שורה בודדת אינה "1 שורות-נוכחות" — היא המקרה שגם אומר *למה* זה משנה (03/09/2026).
    expect(note.textContent).toBe(
      'שורת-נוכחות אחת בלבד מתוך 27 שיבוצים — עדיין אין מספיק נתונים כדי שהמרכיב הזה ישנה משהו',
    )
  })

  it('מונה חי > 1 ⇒ צורת-הרבים, ושני המספרים חיים (לא מקודדים)', async () => {
    countAttendanceRows.mockResolvedValue({ total: 40, withAttendance: 12 })
    await renderPane()
    expect(screen.getByTestId('settings-smartmatch-attendance-note').textContent).toBe(
      '12 שורות-נוכחות מתוך 40 שיבוצים',
    )
  })

  it('הנוסח זהה בשני הווריאנטים — זו עובדה על הדאטה, לא על מי שמסתכלת', async () => {
    const { unmount } = await renderPane({ variant: 'ceo' })
    const ceoNote = screen.getByTestId('settings-smartmatch-attendance-note').textContent
    unmount()
    await renderPane({ variant: 'owner' })
    expect(screen.getByTestId('settings-smartmatch-attendance-note').textContent).toBe(ceoNote)
  })

  it('מתג-האמינות מדווח onChange עם ערך טקסטואלי "true"/"false"', async () => {
    const { onChange } = await renderPane()
    fireEvent.click(screen.getByTestId('settings-smartmatch-reliability-toggle'))
    expect(onChange).toHaveBeenCalledWith(N.reliabilityEnabled, 'true')
  })

  it('בלי הרשאת-עריכה (canEdit מחזירה false) — שדה-משקולת ומתג-האמינות מושבתים', async () => {
    await renderPane({ canEdit: () => false })
    expect(screen.getByTestId(`settings-value-${N.responsivenessWeight}`)).toBeDisabled()
    expect(screen.getByTestId('settings-smartmatch-reliability-toggle')).toBeDisabled()
  })

  it('שאר שורות ה-smart_match (לא משקולת/מרחק/מתג) מוצגות כ-ParamRow רגיל', async () => {
    await renderPane()
    expect(screen.getByTestId(`settings-value-${N.dampingConstant}`)).toBeInTheDocument()
    expect(screen.getByTestId(`settings-value-${N.unansweredStreak}`)).toBeInTheDocument()
  })
  // 🔴 **שורת "בפועל" — נועלת את שני הכיוונים** (הערת-ישי 03/09/2026 מצילום-מסך).
  // הכיוון השני הוא העיקר: כשאין פער, שורה נוספת היא רעש — ובדיקה שרואה רק את ההופעה
  // הייתה מאשרת גם מימוש שמדפיס אותה תמיד.
  it('מרכיב כבוי ⇒ מוצגות המשקולות שפועלות בפועל, מנורמלות', async () => {
    await renderPane({
      values: { ...DEFAULT_VALUES, [N.reliabilityEnabled]: 'false' },
    })
    const line = screen.getByTestId('settings-smartmatch-effective-weights')
    // 0.40/(0.40+0.25) = 61.5% ⇒ 62% · 0.25/0.65 = 38.5% ⇒ 38%
    expect(line).toHaveTextContent('62%')
    expect(line).toHaveTextContent('38%')
  })

  it('מרכיב דלוק ⇒ אין שורת "בפועל" כלל', async () => {
    await renderPane({
      values: { ...DEFAULT_VALUES, [N.reliabilityEnabled]: 'true' },
    })
    expect(screen.queryByTestId('settings-smartmatch-effective-weights')).not.toBeInTheDocument()
  })

  it('ערך-ביניים לא-חוקי (סכום 0) אינו מפיל את הפאנל', async () => {
    await renderPane({
      values: {
        ...DEFAULT_VALUES,
        [N.responsivenessWeight]: '0',
        [N.reliabilityWeight]: '0',
        [N.proximityWeight]: '0',
      },
    })
    expect(screen.queryByTestId('settings-smartmatch-effective-weights')).not.toBeInTheDocument()
    expect(screen.getByTestId('settings-smartmatch-table')).toBeInTheDocument()
  })
})
