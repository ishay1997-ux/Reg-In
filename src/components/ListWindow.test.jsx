// בדיקות שני רכיבי-הרשימה המשותפים (חלון-זמן + דפדוף) — 04/09/2026.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pager, WindowChips } from './ListWindow'
import { paginate } from '@/lib/listWindow'

describe('WindowChips', () => {
  it('ארבע גלולות, הנבחרת מסומנת aria-pressed, לחיצה מחזירה את המפתח', () => {
    const onChange = vi.fn()
    render(<WindowChips value="90d" onChange={onChange} hiddenCount={1055} />)
    expect(screen.getByTestId('list-window-90d')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('list-window-all')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByTestId('list-window-all'))
    expect(onChange).toHaveBeenCalledWith('all')
    // המנהלת יודעת שיש עוד — "הכול" אינו מוסתר בשקט מאחורי חלון.
    expect(screen.getByTestId('list-window-hidden')).toHaveTextContent('1055')
  })

  it('ב"הכול" אין הערת-"עוד" — אין מה להסתיר', () => {
    render(<WindowChips value="all" onChange={() => {}} hiddenCount={0} />)
    expect(screen.queryByTestId('list-window-hidden')).toBeNull()
  })
})

describe('Pager', () => {
  it('עמוד אחד: המונה נשאר, הכפתורים מוסתרים (לא מושבתים) — כפתור-דפדוף על עמוד יחיד הוא רעש', () => {
    render(<Pager {...paginate(Array.from({ length: 23 }), 1)} onPage={() => {}} />)
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('1–23 מתוך 23')
    expect(screen.queryByTestId('list-pager-next')).toBeNull()
  })

  it('כמה עמודים: הקודם מושבת בראשון, הבא מושבת באחרון, והלחיצה מזיזה עמוד', () => {
    const onPage = vi.fn()
    const { rerender } = render(
      <Pager {...paginate(Array.from({ length: 123 }), 1)} onPage={onPage} />,
    )
    expect(screen.getByTestId('list-pager-prev')).toBeDisabled()
    fireEvent.click(screen.getByTestId('list-pager-next'))
    expect(onPage).toHaveBeenCalledWith(2)
    rerender(<Pager {...paginate(Array.from({ length: 123 }), 3)} onPage={onPage} />)
    expect(screen.getByTestId('list-pager-next')).toBeDisabled()
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('101–123 מתוך 123')
    expect(screen.getByTestId('list-pager-page')).toHaveTextContent('3/3')
  })

  it('רשימה ריקה: אין כותרת-תחתונה כלל — מצב-הריק של המסך הוא שאומר זאת', () => {
    render(<Pager {...paginate([], 1)} onPage={() => {}} />)
    expect(screen.queryByTestId('list-pager')).toBeNull()
  })
})
