// בדיקות אריח-המדד — **ארבע השורות שהאריח מורכב מהן, בסדר שהמוקאפ המאושר קובע.**
//
// 🔑 **מה נבדק כאן ולמה דווקא זה:** שלוש מתוך ארבע השורות (`sub` · `compare` · `window`)
// הן שורות שאף מודול קודם לא צייר, ושתיים מהן נמדדו **שבורות בפועל** ב-16/09/2026:
// ‏`tiles[].sub` לא רונדר כלל (‏`grep tile.sub` = 0 אף שכל 16 ה-RPC ממלאים אותו), וחצי-
// ההשוואה הציג `206002` גולמי כי `compare` אינו נושא `format` משלו. שתיהן **עוברות
// קומפילציה, בדיקות ושער-לינט** — הן נראות רק בעין, ולכן הן כתובות כאן.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ⚠️ מלכודת `.env.local` מול CI — בלי המוק כל בדיקת-רכיב שנוגעת בשרשרת-ה-api קורסת ב-CI.
vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))

import KpiTile from './KpiTile'
import { ReportsShellContext } from './reportsShellContext'
import { MASKED_TEXT } from '@/lib/dashboard'

// 🌱 אריח אמיתי מתוך מטען חי (`report_m07_finance_overview`, 16/09/2026) — לא הומצא.
const TILE = {
  key: 'open_debt',
  label: 'יתרת-חוב פתוחה',
  value: 236382,
  format: 'money',
  sub: 'הכל 35 חשבוניות פתוחות',
  window: 'נכון להיום',
  compare: { value: 206002, label: 'לפני חודש', direction: 'up' },
  target: null,
}

describe('KpiTile — 📑ב · שורת-המכנה-הגלוי (tiles[].sub)', () => {
  it('מציג את tiles[].sub מתחת לערך', () => {
    render(<KpiTile tile={TILE} />)
    expect(screen.getByTestId('kpi-sub')).toHaveTextContent('35 חשבוניות פתוחות')
  })

  // 🔴 **סדר-המוקאפ, נמדד על ארבעת הקבצים המאושרים:** `.lb · .vl · .sub · .cmp · .win`.
  it('הסדר הוא ערך ⇐ sub ⇐ השוואה ⇐ חלון, ולא אחר', () => {
    render(<KpiTile tile={TILE} />)
    const ids = ['kpi-sub', 'kpi-compare', 'kpi-window']
    const all = Array.from(document.body.querySelectorAll('[data-testid]'))
    const positions = ids.map((id) => all.indexOf(screen.getByTestId(id)))
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('אריח בלי sub אינו מייצר את השורה', () => {
    render(<KpiTile tile={{ ...TILE, sub: null }} />)
    expect(screen.queryByTestId('kpi-sub')).toBeNull()
  })

  // ⚠️ מכנה בלי מונה הוא עדיין נתון — §7.97 חוסם את שניהם יחד.
  it('אריח ממוסך אינו מציג sub ואינו מציג השוואה', () => {
    render(<KpiTile tile={TILE} masked />)
    expect(screen.getByText(MASKED_TEXT)).toBeInTheDocument()
    expect(screen.queryByTestId('kpi-sub')).toBeNull()
    expect(screen.queryByTestId('kpi-compare')).toBeNull()
    // 📐3 — חלון-הזמן נשאר גם בממוסך: הוא אומר על מה האריח *היה* מדבר.
    expect(screen.getByTestId('kpi-window')).toBeInTheDocument()
  })
})

describe('KpiTile — 📐1/📐4 · חצי-ההשוואה מעוצב בפורמט של האריח', () => {
  // 🔴 הפגם שנמדד: `compare` בלי `format` ⇒ `206002` גולמי ליד `236,382 ₪`.
  it('compare בלי format יורש את tile.format', () => {
    render(<KpiTile tile={TILE} />)
    expect(screen.getByTestId('kpi-compare')).toHaveTextContent('206,002 ₪')
    expect(screen.getByTestId('kpi-compare')).not.toHaveTextContent('206002')
  })

  it('format משלו גובר על זה של האריח', () => {
    const tile = { ...TILE, compare: { ...TILE.compare, value: 58.34, format: 'percent' } }
    render(<KpiTile tile={tile} />)
    expect(screen.getByTestId('kpi-compare')).toHaveTextContent('58.3%')
  })

  // ⚠️ לשונית שכבר עיצבה את הערך בטרנספורם — עיצוב-כפול היה מחזיר `—`.
  it('ערך שהוא כבר מחרוזת עובר כמות-שהוא, בלי עיצוב נוסף', () => {
    const tile = { ...TILE, compare: { ...TILE.compare, value: '206,002 ₪' } }
    render(<KpiTile tile={tile} />)
    const line = screen.getByTestId('kpi-compare')
    expect(line).toHaveTextContent('206,002 ₪')
    expect(line).not.toHaveTextContent('—')
  })

  // 🚫 החץ אינו צבוע (📐1) ואינו נקרא לקורא-מסך — הוא סימן-כיוון, לא שיפוט.
  it('החץ קיים, aria-hidden, ובלי מחלקת-צבע', () => {
    const { container } = render(<KpiTile tile={TILE} />)
    const arrow = container.querySelector('[aria-hidden="true"]')
    expect(arrow.textContent).toBe('▲')
    expect(arrow.className).toContain('text-inherit')
  })
})

describe('KpiTile — הכרעה 33 · אריח עם target הוא דלת', () => {
  it('אריח עם target נעטף בכפתור עם תווית מלאה', () => {
    const onOpenTarget = vi.fn()
    const target = { tab: 'כספים', report: 'report_m09_aging', drill: null }
    render(<KpiTile tile={{ ...TILE, target }} onOpenTarget={onOpenTarget} />)
    const button = screen.getByTestId('report-tile-link-open_debt')
    expect(button).toHaveAttribute('aria-label', 'יתרת-חוב פתוחה — פתחי את הדוח')
    button.click()
    expect(onOpenTarget).toHaveBeenCalledWith(target)
  })

  it('אריח ממוסך אינו דלת, גם כשיש לו target', () => {
    const target = { tab: 'כספים', report: 'report_m09_aging', drill: null }
    render(<KpiTile tile={{ ...TILE, target }} onOpenTarget={vi.fn()} masked />)
    expect(screen.queryByTestId('report-tile-link-open_debt')).toBeNull()
  })

  // 🚪 **כרטיס ⑧19.2, אפשרות א — הערך נשאר, הדלת נעלמת.** נמדד 16/09/2026 על אריח ⁦4⁩ של
  // מ19 עבור מנהלת-פרויקטים: הכפתור היה שם, ה-`aria-label` הבטיח *"פתחי את הדוח"*,
  // והלחיצה לא עשתה **דבר** — ‏`ReportsPage.openDoor` בולם מיסוך, אבל רק אחרי הלחיצה.
  it('יעד בלשונית ממוסכת אינו דלת — והערך עצמו נשאר על המסך', () => {
    const target = { tab: 'כספים', report: 'report_m09_aging', drill: null }
    render(
      <ReportsShellContext.Provider value={{ canOpenTarget: () => false }}>
        <KpiTile tile={{ ...TILE, target }} onOpenTarget={vi.fn()} />
      </ReportsShellContext.Provider>,
    )
    expect(screen.queryByTestId('report-tile-link-open_debt')).toBeNull()
    expect(screen.getByTestId('report-tile-open_debt')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-sub')).toBeInTheDocument()
  })

  it('יעד בלשונית פתוחה נשאר דלת מלאה', () => {
    const target = { tab: 'כספים', report: 'report_m09_aging', drill: null }
    render(
      <ReportsShellContext.Provider value={{ canOpenTarget: () => true }}>
        <KpiTile tile={{ ...TILE, target }} onOpenTarget={vi.fn()} />
      </ReportsShellContext.Provider>,
    )
    expect(screen.getByTestId('report-tile-link-open_debt')).toBeInTheDocument()
  })

  // ⚠️ בלי מעטפת — הרכיב מצייר דלתות בדיוק כפי שצייר. הקונטקסט מצמצם, לעולם לא מוסיף.
  it('מחוץ למעטפת אין שינוי התנהגות', () => {
    const target = { tab: 'כספים', report: 'report_m09_aging', drill: null }
    render(<KpiTile tile={{ ...TILE, target }} onOpenTarget={vi.fn()} />)
    expect(screen.getByTestId('report-tile-link-open_debt')).toBeInTheDocument()
  })
})

// ‏`tiles[].compare.note` — שדה C8 מ-16/09 שלא היה לו אף קורא, אף ש-⁦9⁩ מתוך ⁦16⁩ אריחי-ההנהלה
// נושאים אותו. בלי המכנה הזה, חצי-ההשוואה הוא אחוז בלי אוכלוסייה (📐2).
describe('KpiTile — tiles[].compare.note', () => {
  const withNote = {
    ...TILE,
    compare: { ...TILE.compare, note: '4 מתוך 18 אירועים' },
  }

  it('ההערה מוצגת מתחת לשורת-ההשוואה', () => {
    render(<KpiTile tile={withNote} />)
    expect(screen.getByTestId('kpi-compare-note')).toHaveTextContent('4 מתוך 18 אירועים')
  })

  it('הסדר הוא sub ⇐ השוואה ⇐ הערת-השוואה ⇐ חלון', () => {
    render(<KpiTile tile={withNote} />)
    const ids = ['kpi-sub', 'kpi-compare', 'kpi-compare-note', 'kpi-window']
    const all = Array.from(document.body.querySelectorAll('[data-testid]'))
    const positions = ids.map((id) => all.indexOf(screen.getByTestId(id)))
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('השוואה בלי note אינה מייצרת שורה ריקה', () => {
    render(<KpiTile tile={TILE} />)
    expect(screen.queryByTestId('kpi-compare-note')).toBeNull()
  })

  // §7.97 — מכנה בלי מונה הוא עדיין נתון; ההערה נעלמת יחד עם ההשוואה כולה.
  it('אריח ממוסך אינו מציג את ההערה', () => {
    render(<KpiTile tile={withNote} masked />)
    expect(screen.queryByTestId('kpi-compare-note')).toBeNull()
  })
})

// ── ✏️ סבב-3 ───────────────────────────────────────────────────────────────

describe('KpiTile — חצי-השוואה בלי ערך', () => {
  // 🔴 נמדד: שלושה אריחים במ21/מ22 מוסרים `label` שלם עם `value: null`, והמסך הציג
  // *"… לא סכום שצפוי להיאבד: —"* — מקף שנקרא כ"אין לי את הנתון" על משפט בלי מספר.
  const sentence = { ...TILE, compare: { label: 'זו הערכה, לא סכום שצפוי להיאבד', value: null } }

  it('התווית לבדה, בלי נקודתיים ובלי מקף', () => {
    render(<KpiTile tile={sentence} />)
    const line = screen.getByTestId('kpi-compare')
    expect(line).toHaveTextContent('זו הערכה, לא סכום שצפוי להיאבד')
    expect(line.textContent).not.toContain('—')
    expect(line.textContent.trim().endsWith(':')).toBe(false)
  })

  it('ערך אפס הוא ערך ולא היעדר — והוא מוצג', () => {
    render(<KpiTile tile={{ ...TILE, compare: { label: 'אשתקד', value: 0, format: 'money' } }} />)
    expect(screen.getByTestId('kpi-compare').textContent).toContain('0')
  })
})

describe('KpiTile — הדלת נראית כדלת', () => {
  // 🖱️ Tailwind v4 משאיר `<button>` ב-`cursor:default`; שורה-נלחצת ב-`ReportTable` כן
  // מציגה אצבע, וכך הדלת נראתה כטקסט.
  it('כפתור-הדלת נושא cursor-pointer', () => {
    const target = { tab: 'כספים', report: 'report_m09_aging', drill: null }
    render(<KpiTile tile={{ ...TILE, target }} onOpenTarget={vi.fn()} />)
    expect(screen.getByTestId('report-tile-link-open_debt').className).toContain('cursor-pointer')
  })

  // 📏 משפט-השוואה ארוך ניפח את האריח ושבר את שורת-האריחים — אותו רוחב של `SubLine`.
  it('שורת-ההשוואה חסומה ברוחב, כמו שורת-המכנה', () => {
    render(<KpiTile tile={TILE} />)
    expect(screen.getByTestId('kpi-compare').className).toContain('max-w-[210px]')
  })
})
