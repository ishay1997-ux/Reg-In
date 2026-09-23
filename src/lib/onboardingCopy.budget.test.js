// 🔁 **השער של שכבת-ההסבר (`npm run check:report-copy`)** — תוכנית-הטיפוגרפיה §3 + שלב 10ב.
//
// 🔑 **למה בדיקה ולא הבטחה:** אורך-הרמזים כבר חרג פעם אחת בשקט — 24 מתוך 37 מפתחות-המערכת
// עברו את 220 התווים, והארוך 633 (נמדד 18/09/2026). כלל שנשען על זיכרון נכשל פעמיים; בדיקה
// נכשלת בעצמה (`~/.claude/CLAUDE.md`, "מה שנכשל פעמיים").
// ➕ **ומפתח חסר נבדק כאן, לא רק האורך:** `<Hint>` מחזיר `null` בשקט על מפתח שאינו קיים
// (`onboarding-layer-contract.md §2`), ולכן רמז שנמחק או שמו הוקלד שגוי **נעלם בלי שגיאה**.
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { ONBOARDING_COPY } from './onboardingCopy'

// ⚠️ ספירת-תווים בלי תווי-הבידוד (LRI…PDI) — הם בלתי-נראים ואינם נקראים.
const visibleLength = (text) => (text ?? '').replace(/[⁦-⁩]/g, '').length
const BUDGET = 220

// ✂️ 24/09/2026 — הפטור של מ3/מ4/מ6 נמחק יחד עם המשטחים הישנים (דוחות-ההחלטה נכתבו בתוך התקציב).

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.jsx?$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : []
  })
}

describe('שכבת-ההסבר — תקציב ומפתחות', () => {
  it(`כל רמז עד ${BUDGET} תווים גלויים`, () => {
    const over = Object.entries(ONBOARDING_COPY)
      .map(([key, entry]) => [key, visibleLength(entry.guided)])
      .filter(([, length]) => length > BUDGET)
    expect(over).toEqual([])
  })

  it('כל מפתח-רמז שהדוחות מצטטים קיים בקובץ-הקופי', () => {
    const root = path.resolve(__dirname, '../modules/11_reports')
    const cited = new Set(
      sourceFiles(root).flatMap((file) =>
        [
          ...fs
            .readFileSync(file, 'utf8')
            .matchAll(/['"](reports\.[A-Za-z0-9]+\.[A-Za-z0-9]+)['"]/g),
        ].map((match) => match[1]),
      ),
    )
    expect(cited.size).toBeGreaterThan(0)
    const missing = [...cited].filter((key) => !Object.hasOwn(ONBOARDING_COPY, key))
    expect(missing).toEqual([])
  })
})
