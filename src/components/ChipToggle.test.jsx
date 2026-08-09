// בדיקת ChipToggle — נועלת את ההבדל בין "עריכה" ל"תצוגה", שהוא ההבדל היחיד שמשנה כאן:
// בעריכה מוצגות **כל** האפשרויות (אחרת אי-אפשר לבחור חדשה); בתצוגה מוצגות **רק הנבחרות**
// (צ'יפ אפור של שפה שהיא לא דוברת אינו מידע — הוא רעש, ומוקאפ 08 אכן מצייר שתיים ולא חמש).
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChipToggle from './ChipToggle'

const LANGUAGES = ['עברית', 'אנגלית', 'רוסית', 'ערבית', 'אמהרית']

describe('ChipToggle', () => {
  it('עריכה: כל חמש האפשרויות מוצגות, גם מה שלא נבחר', () => {
    render(<ChipToggle options={LANGUAGES} selected={['עברית']} onToggle={() => {}} testId="c" />)
    expect(screen.queryAllByRole('button')).toHaveLength(5)
  })

  it('🔴 תצוגה: רק הנבחרות — לא חמש גלולות אפורות', () => {
    render(<ChipToggle options={LANGUAGES} selected={['עברית', 'אנגלית']} testId="c" />)
    expect(screen.getByTestId('c').textContent).toBe('עבריתאנגלית')
    expect(screen.queryByText('רוסית')).not.toBeInTheDocument()
  })

  it('רב-בחירה ולא בלעדי — בחירה שנייה אינה מבטלת את הראשונה', () => {
    const onToggle = vi.fn()
    render(<ChipToggle options={LANGUAGES} selected={['עברית']} onToggle={onToggle} testId="c" />)
    fireEvent.click(screen.getByRole('button', { name: 'אנגלית' }))
    expect(onToggle).toHaveBeenCalledWith('אנגלית')
    // הרכיב מדווח על ההיפוך; ההרכבה של המערך היא של הקורא — ולכן `עברית` לא נגעה.
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('לחיצה על נבחרת מדווחת עליה — כדי שהקורא יסיר אותה', () => {
    const onToggle = vi.fn()
    render(<ChipToggle options={LANGUAGES} selected={['עברית']} onToggle={onToggle} testId="c" />)
    fireEvent.click(screen.getByRole('button', { name: 'עברית' }))
    expect(onToggle).toHaveBeenCalledWith('עברית')
  })

  it('נבחרת מסומנת ויזואלית ובנגישות (aria-pressed)', () => {
    render(<ChipToggle options={LANGUAGES} selected={['עברית']} onToggle={() => {}} testId="c" />)
    expect(screen.getByRole('button', { name: 'עברית' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'רוסית' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('🔴 תצוגה בלי שפות כלל מציגה — ולא אזור ריק שנראה כמו באג', () => {
    render(<ChipToggle options={LANGUAGES} selected={[]} testId="c" />)
    expect(screen.getByTestId('c').textContent).toBe('—')
  })

  it('selected חסר לגמרי אינו מפיל את הרכיב', () => {
    render(<ChipToggle options={LANGUAGES} testId="c" />)
    expect(screen.getByTestId('c').textContent).toBe('—')
  })
})
