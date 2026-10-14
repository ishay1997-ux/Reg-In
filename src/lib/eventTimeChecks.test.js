import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EVENT_DURATION_WARNING_HOURS,
  LONG_DURATION_NOTICE,
  SAME_TIME_NOTICE,
  eventDurationThreshold,
  eventTimeNotices,
} from './eventTimeChecks'
import { CROSS_MIDNIGHT_NOTICE } from './projectCard'

const texts = (start, end, threshold) => eventTimeNotices(start, end, threshold).map((n) => n.text)

describe('eventTimeNotices — מודיעות, לא חוסמות', () => {
  it('בדיוק בסף (10 שעות) ⇒ אין הודעה; דקה מעליו ⇒ "משך ארוך מהרגיל"', () => {
    expect(texts('08:00', '18:00', 10)).toEqual([])
    expect(texts('08:00', '18:01', 10)).toEqual([LONG_DURATION_NOTICE])
  })

  it('0 שעות (סיום = התחלה) ⇒ רק "שעת הסיום זהה לשעת ההתחלה"', () => {
    expect(texts('18:00', '18:00', 10)).toEqual([SAME_TIME_NOTICE])
    expect(SAME_TIME_NOTICE).toBe('שעת הסיום זהה לשעת ההתחלה')
  })

  it('חוצה חצות 22:00→02:00 (4 שעות) ⇒ רק "האירוע חוצה חצות"', () => {
    expect(texts('22:00', '02:00', 10)).toEqual([CROSS_MIDNIGHT_NOTICE])
  })

  it('חוצה חצות וארוך (18:00→06:00, 12 שעות) ⇒ שתי השורות', () => {
    expect(texts('18:00', '06:00', 10)).toEqual([CROSS_MIDNIGHT_NOTICE, LONG_DURATION_NOTICE])
  })

  it('הפרמטר חסר ⇒ הסף הוא 10', () => {
    for (const missing of [undefined, null, '', '   ', 'abc', '0', '-3']) {
      expect(eventDurationThreshold(missing)).toBe(DEFAULT_EVENT_DURATION_WARNING_HOURS)
      expect(texts('08:00', '18:00', missing)).toEqual([])
      expect(texts('08:00', '18:01', missing)).toEqual([LONG_DURATION_NOTICE])
    }
    expect(DEFAULT_EVENT_DURATION_WARNING_HOURS).toBe(10)
  })

  it('הסף מההגדרות כטקסט ("12") נכבד', () => {
    expect(eventDurationThreshold('12')).toBe(12)
    expect(texts('08:00', '19:00', '12')).toEqual([])
    expect(texts('08:00', '20:30', '12')).toEqual([LONG_DURATION_NOTICE])
  })

  it('שעה חסרה או לא תקינה ⇒ אין הודעה רכה (הוולידציה של הטופס מטפלת בזה)', () => {
    expect(texts('', '18:00', 10)).toEqual([])
    expect(texts('25:99', '18:00', 10)).toEqual([])
    expect(texts('930', '18:00', 10)).toEqual([])
  })
})
