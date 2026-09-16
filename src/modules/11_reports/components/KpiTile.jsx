// אריח-מדד של דוח — `StatTile` הקיים, ועליו שלוש התוספות ש-📐1/📐3/📐4 מחייבים.
//
// 🔑 **למה עטיפה ולא רכיב חדש:** `StatTile` כבר נושא את המראה המוכרע (לבן+מסגרת, תווית מעל
// ערך, `flex flex-wrap` ולעולם לא `grid`). מה שחסר לו הוא **חצי-ההשוואה** (📐1) ו**חלון-הזמן**
// (📐3) — שתי שורות שלא היו קיימות באף מודול קודם, כי אף מסך קודם לא השווה לתקופה קודמת.
//
// 🔴 **מוקש נמדד (`04_hostesses/CLAUDE.md`): `StatTile` הופך מספר לשקלים אוטומטית.** אריח
// שערכו אינו כסף — אחוז, ג'יני, מונה — חייב להימסר כ**צומת** ולא כמספר גולמי. ⇒ הרכיב הזה
// מעצב **תמיד** דרך `formatByType` ומוסר מחרוזת/צומת, ולעולם לא מספר. זה מנטרל את המוקש
// לכל שישה-עשר המשטחים בבת-אחת, במקום להיזכר בו אריח-אריח.
//
// 🚫 **החץ אינו צבוע** (📐1, במפורש) ואין ירוק לעובדה-טובה (כלל-המילוי §④). זה הכלל שהמודול
// הזה מפר הכי בקלות: עשרים דוחות, כולם בהשוואה לתקופה קודמת, והפיתוי לצבוע כל "שיפור".

import StatTile from '@/components/StatTile'
import Ltr from '@/components/Ltr'
import { MASKED_TEXT } from '@/lib/dashboard'
import { NO_VALUE, formatByType, formatDelta } from '@/lib/reportsFormat'

// 🔑 מועתק מ-`KpiStrip.jsx` (מ7) — **התקדים המדויק לאריח-דוח ממוסך**, וההערה שם מסבירה
// למה זה `text-slate-400`: הוא מראה של קוד מוזג, ושינוי-גוון כאן הוא אדווה למודול 7.
const MASKED_NODE = <span className="text-sm font-normal text-slate-400">{MASKED_TEXT}</span>

const ARROW = { up: '▲', down: '▼' }

function CompareLine({ compare }) {
  if (!compare) return null
  const glyph = ARROW[compare.direction]
  const delta = compare.delta === undefined ? null : formatDelta(compare.delta, compare.format)
  return (
    // ⚠️ `display:block` ולא `flex` — 🔴 **זה היה שורש רב-קבצי** (§⑥, תיקון 10/09/2026):
    // פלקס הופך כל ילד ישיר לפריט-פלקס, `.ltr` מאבד את `inline-block`, ו-`gap` נדחף גם
    // לאן שאין רווח — נמדד `(19.9%)` שמרונדר `( 19.9% )` ו-`2024:` כ-`2024 :`.
    // הריווח מוחזר במפורש ב-`margin` על החץ בלבד.
    <span className="block text-[11px] text-slate-500" data-testid="kpi-compare">
      {glyph && (
        // 🚫 `color:inherit` — החץ **אינו צבוע** (📐1). הוא סימן-כיוון, לא שיפוט.
        <span aria-hidden="true" className="ml-1 text-[10px] text-inherit">
          {glyph}
        </span>
      )}
      {compare.label}: <Ltr>{formatByType(compare.value, compare.format)}</Ltr>
      {delta && delta !== NO_VALUE && <> ({delta})</>}
    </span>
  )
}

/**
 * ‏`tile` הוא שורת-אריח של C8:
 * `{ key, label, value, format, window, compare: {value,label,direction,delta?} | null, target }`.
 *
 * ‏`masked` — האריח קיים והערך חסום-הרשאה (§7.97). ⚠️ **שונה מ"אין נתון"**: `MASKED_TEXT`
 * אומר *"לא זמין בתפקידך"*, ו-`—` אומר *"אין לי את הנתון"*. אין להחליף ביניהם.
 *
 * ‏`onOpenTarget` — הכרעה 33: **כל אריח במבט-על הוא דלת לדף**, גם חוצת-לשונית. אריח עם
 * `target` נעטף ב-`<button>` ומקבל מקלדת ומיקוד; אריח בלי `target` נשאר טקסט.
 */
export default function KpiTile({ tile, masked = false, onOpenTarget }) {
  const value = masked ? MASKED_NODE : renderValue(tile)

  const body = (
    <StatTile
      label={tile.label}
      value={value}
      sub={
        <>
          <CompareLine compare={masked ? null : tile.compare} />
          {/* 📐3: חלון-הזמן בכל אריח — ואריח שאינו מגיב למסנן נושא זאת במפורש. */}
          {tile.window && (
            <span className="block text-[10.5px] text-slate-500" data-testid="kpi-window">
              {tile.window}
            </span>
          )}
        </>
      }
      emptyText={NO_VALUE}
      testId={`report-tile-${tile.key}`}
    />
  )

  if (!tile.target || !onOpenTarget || masked) return body

  return (
    <button
      type="button"
      onClick={() => onOpenTarget(tile.target)}
      // 🔑 התווית נאמרת במלואה לקורא-המסך: "פתחי" לבדו אינו אומר לאן.
      aria-label={`${tile.label} — פתחי את הדוח`}
      className="rounded-xl text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      data-testid={`report-tile-link-${tile.key}`}
    >
      {body}
    </button>
  )
}

function renderValue(tile) {
  if (tile.value === null || tile.value === undefined) return null
  const text = formatByType(tile.value, tile.format)
  if (text === NO_VALUE) return null
  // 🔴 **מחרוזת ולא מספר** — ר' הערת-הכותרת: מספר גולמי היה עובר דרך `Money` אוטומטית
  // והופך אחוז ל-"60 ₪". ‏`Ltr` עוטף כי כל ערך שאינו עברית-טהורה מבודד (§3.2).
  return <Ltr>{text}</Ltr>
}
