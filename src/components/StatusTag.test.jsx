// בדיקת StatusTag — נועלת את הדבר שהרכיב קיים בשבילו: **צבע הוא משמעות.**
// ירוק אומר "סגור, אין מה לעשות"; ענבר אומר "פעל עכשיו". אותו סטטוס שייצבע אחרת בשני
// מסכים היה גורם למנהלת לפעול על שורה שלא צריכה אותה — ולכן המיפוי נבדק ולא רק נכתב.
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PROJECT_STATUS_TONES } from '@/lib/projects'
import StatusTag from './StatusTag'

const classOf = (label, props = {}) => {
  render(<StatusTag label={label} testId={`t-${label}`} {...props} />)
  return screen.getByTestId(`t-${label}`).className
}

describe('StatusTag', () => {
  it('🔴 "אושרה סופית" ירוק ו-"פג תוקף" ענבר — שתי פעולות הפוכות, שני צבעים', () => {
    expect(classOf('אושרה סופית')).toContain('bg-green-100')
    expect(classOf('פג תוקף')).toContain('bg-amber-200')
  })

  it('"אישרה זמינות" אינו ירוק — היא ענתה, היא עוד לא מאושרת', () => {
    const cls = classOf('אישרה זמינות')
    expect(cls).toContain('bg-teal-100')
    expect(cls).not.toContain('bg-green-100')
  })

  it('🔴 "סירבה" ו-"שוחררה" נבדלות ויזואלית — אחת החלטה שלה, השנייה של המערכת', () => {
    expect(classOf('סירבה')).toContain('border-slate-200')
    expect(classOf('שוחררה')).toContain('border-dashed')
  })

  it('מצב הדיילת: פעילה ירוק · מושבתת מקווקו', () => {
    expect(classOf('פעילה')).toContain('bg-green-100')
    expect(classOf('מושבתת')).toContain('border-dashed')
  })

  it('🔴 תווית דינמית ("לא זמינה") מקבלת את הטון מהקורא — אין לה מפתח קבוע', () => {
    expect(classOf('לא זמינה 15/08–20/08', { tone: 'warn' })).toContain('bg-amber-200')
  })

  it('תווית לא-מוכרת אינה מפילה את המסך — נופלת ל-muted', () => {
    expect(classOf('משהו שלא קיים')).toContain('bg-slate-100')
  })

  it('🔴 שמונת סטטוסי-הפרויקט (מודול 6) הגיעו ב-spread וכל אחד פותר את הטון שנקבע לו', () => {
    // התוויות מיובאות מ-`src/lib/projects.js` ולא מוקלדות כאן מחדש — בדיוק הכלל
    // שהרכיב עצמו מקיים: תווית שהוקלדה שוב ונבדלת בתו אחד נופלת ל-muted בלי שגיאה.
    // המקרה האדום (תווית לא-ממופה) חי בשומר ① של `projects.guards.test.js` — לא משוכפל.
    const CLASS_BY_TONE = {
      ok: 'bg-green-100',
      teal: 'bg-teal-100',
      muted: 'bg-slate-100',
      warn: 'bg-amber-200',
      dashed: 'border-dashed',
    }
    const entries = Object.entries(PROJECT_STATUS_TONES)
    expect(entries).toHaveLength(8)
    for (const [label, tone] of entries) {
      expect(classOf(label), label).toContain(CLASS_BY_TONE[tone])
    }
  })

  it('בלי תווית — לא מרונדר דבר (שורה בלי סטטוס לא מקבלת גלולה ריקה)', () => {
    const { container } = render(<StatusTag label={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('ששת הסטטוסים + שתי הנגזרות — כולם ממופים, אף אחד לא נופל ל-muted בטעות', () => {
    // 🔴 השמונה של `spec.md §1.1`. `ממתינה למענה` ו-`ביטלה אחרי אישור` הם muted **במכוון**.
    const expected = {
      'ממתינה למענה': 'bg-slate-100',
      'אישרה זמינות': 'bg-teal-100',
      סירבה: 'bg-slate-100',
      'אושרה סופית': 'bg-green-100',
      שוחררה: 'bg-slate-100',
      'ביטלה אחרי אישור': 'bg-slate-100',
      'פג תוקף': 'bg-amber-200',
      הושלם: 'bg-green-100',
    }
    for (const [label, expectedClass] of Object.entries(expected)) {
      expect(classOf(label), label).toContain(expectedClass)
    }
  })

  // 🔴 מודול 8 (‏27/08/2026): הטון `danger` נוסף עבור ציון-משוב מתחת ל-3 (ה16).
  // **הבדיקה הזו קיימת כדי לחסום נסיגה שקטה, לא כדי לתעד תכונה:** לפני ההוספה,
  // ‏`tone="danger"` נפל ל-`?? TONES.muted` והוצג **אפור בלי שגיאה** — כלומר "טעון בירור"
  // נראה בדיוק כמו סטטוס נייטרלי, וזו בדיוק ההאפרה-בשקט שהרכיב הזה נבנה למנוע.
  it('טון danger — אדום ולא אפור (ה16: ציון<3), ולא נופל בשקט ל-muted', () => {
    const { container } = render(<StatusTag label="טעון בירור" tone="danger" />)
    const cls = container.firstChild.className
    expect(cls).toContain('bg-red-100')
    expect(cls).toContain('text-red-700')
    expect(cls).not.toContain('bg-slate-100')
  })
})
