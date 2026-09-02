// בדיקות `GroupList` (צעד 3.1) — רשימת קבוצות-ההגדרות עם המונים.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GroupList from './GroupList'

const GROUPS = [
  { type: 'pricing_timing', label: 'תמחור ותזמון', count: 7 },
  { type: 'templates', label: 'תבניות מייל', count: 11 },
]

describe('GroupList', () => {
  it('מציג תווית ומונה לכל קבוצה', () => {
    render(<GroupList groups={GROUPS} activeType="pricing_timing" onSelect={() => {}} />)
    expect(screen.getByTestId('settings-group-pricing_timing')).toHaveTextContent('תמחור ותזמון')
    expect(screen.getByTestId('settings-group-pricing_timing')).toHaveTextContent('7')
    expect(screen.getByTestId('settings-group-templates')).toHaveTextContent('11')
  })

  it('מסמן את הקבוצה הפעילה בלבד', () => {
    render(<GroupList groups={GROUPS} activeType="templates" onSelect={() => {}} />)
    expect(screen.getByTestId('settings-group-templates')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTestId('settings-group-pricing_timing')).not.toHaveAttribute('aria-current')
  })

  it('בחירה מדווחת את סוג-הקבוצה', () => {
    const onSelect = vi.fn()
    render(<GroupList groups={GROUPS} activeType="pricing_timing" onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('settings-group-templates'))
    expect(onSelect).toHaveBeenCalledWith('templates')
  })
})
