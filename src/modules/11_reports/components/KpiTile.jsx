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
import { useContext } from 'react'
import { ReportsShellContext } from './reportsShellContext'

// 🔑 מועתק מ-`KpiStrip.jsx` (מ7) — **התקדים המדויק לאריח-דוח ממוסך**, וההערה שם מסבירה
// למה זה `text-slate-400`: הוא מראה של קוד מוזג, ושינוי-גוון כאן הוא אדווה למודול 7.
const MASKED_NODE = <span className="text-sm font-normal text-slate-400">{MASKED_TEXT}</span>

const ARROW = { up: '▲', down: '▼' }

/**
 * ‏📑ב · שורת-המכנה-הגלוי (`tiles[].sub`, תוספת C8 16/09/2026) — *"⁦144⁩ מתוך ⁦163⁩ משובים"*.
 *
 * 🔴 **למה היא מתחת לערך ומעל שורת-ההשוואה, ולא היכן שנוח:** נמדד על **כל ארבעת המוקאפים
 * המאושרים** — `.tile > .lb · .vl · .sub · .cmp · .win` בסדר הזה בדיוק, בכל אריח.
 * ⚠️ **וכשהאריח ממוסך היא נעלמת יחד עם הערך** — מכנה בלי מונה מספר למי שאין לו הרשאה
 * בדיוק את מה ש-§7.97 חוסם *(*"מתוך 163 משובים"* לבדו הוא עדיין נתון)*.
 */
function SubLine({ sub }) {
  if (!sub) return null
  return (
    // 🔴 **`max-w-[210px]` — רוחב מדוד ולא טעם.** ‏`StatTile` הוא `flex` שאינו נמתח, ולכן
    // שורת-מכנה ארוכה **מרחיבה את האריח**: נמדד בדפדפן (1280px, 16/09) שרצועת-האריחים של
    // מ2 תפחה לשלוש שורות ולאריחים ברוחב ⁦248⁩–⁦535⁩px, בעוד ⑩ של הכרטיס מודד *"ארבעת
    // האריחים על שורה אחת"*. הערך מועתק מהעותק המקומי של לשונית-ההנהלה, שם הוא נמדד.
    <span
      className="mt-1 block max-w-[210px] text-sm leading-[1.4] text-slate-600"
      data-testid="kpi-sub"
    >
      {sub}
    </span>
  )
}

/**
 * ‏`fallbackFormat` — ‏`tile.format` של האריח עצמו.
 * 🔴 **נמדד 16/09/2026, וזה היה פגם ולא ליטוש:** ‏`compare` של C8 אינו נושא `format` משלו
 * (נמדד: **0 מתוך 99** חצאי-השוואה בכל המטענים החיים) ⇒ `formatByType(206002, undefined)`
 * נפל ל-`text` והמסך הציג **`206002`** ליד ערך שמעליו כתוב `236,382 ₪`. ‏📐4 דורש *"אותו
 * מדד = אותו עיגול בכל דף"*, וכאן זה נשבר **בתוך אריח אחד**.
 * ⚠️ **וערך שכבר מחרוזת עובר כמות-שהוא** — לשונית שתיקנה את זה אצלה בטרנספורם מוסרת
 * מחרוזת מעוצבת, ועיצוב-כפול היה מחזיר `—` (‏`Number("⁦206,002 ₪⁩")` אינו מספר).
 */
function CompareLine({ compare, fallbackFormat }) {
  if (!compare) return null
  const format = compare.format ?? fallbackFormat
  const glyph = ARROW[compare.direction]
  const delta = compare.delta === undefined ? null : formatDelta(compare.delta, format)
  const hasValue = compare.value !== null && compare.value !== undefined
  const valueText =
    typeof compare.value === 'string' ? compare.value : formatByType(compare.value, format)
  return (
    <>
      {/* ⚠️ `display:block` ולא `flex` — 🔴 **זה היה שורש רב-קבצי** (§⑥, תיקון 10/09/2026):
          פלקס הופך כל ילד ישיר לפריט-פלקס, `.ltr` מאבד את `inline-block`, ו-`gap` נדחף גם
          לאן שאין רווח — נמדד `(19.9%)` שמרונדר `( 19.9% )` ו-`2024:` כ-`2024 :`.
          הריווח מוחזר במפורש ב-`margin` על החץ בלבד. */}
      {/* 📏 `max-w-[210px]` — אותו רוחב של `SubLine`, ומאותו נימוק: משפט-השוואה ארוך מרחיב
          את האריח (פלקס שאינו נמתח) ומפרק את שורת-האריחים. נמדד במ19 שארבעת האריחים
          נשברו ל-2+2 ב-1280px בעוד המוקאפ מצייר שורה אחת. */}
      <span
        className="block max-w-[210px] text-xs leading-[1.4] text-slate-500"
        data-testid="kpi-compare"
      >
        {glyph && (
          // 🚫 `color:inherit` — החץ **אינו צבוע** (📐1). הוא סימן-כיוון, לא שיפוט.
          <span aria-hidden="true" className="ml-1 text-xs text-inherit">
            {glyph}
          </span>
        )}
        {compare.label}
        {/* ✏️ **חצי-השוואה בלי ערך הוא משפט, לא מדד חסר** (נמדד 16/09/2026): שלושה אריחים
            במ21/מ22 מוסרים `label` שלם עם `value: null`, והמסך הציג *"… לא סכום שצפוי
            להיאבד: —"* — מקף שנקרא כ"אין לי את הנתון" על משפט שמלכתחילה אינו נושא מספר.
            ⇒ התווית לבדה, בלי נקודתיים ובלי `—`. */}
        {hasValue && (
          <>
            : <Ltr>{valueText}</Ltr>
            {delta && delta !== NO_VALUE && <> ({delta})</>}
          </>
        )}
      </span>
      {/* ‏`compare.note` — שדה C8 מ-16/09/2026 שלא היה לו **אף קורא** (נמדד: `grep
          compare.note src/` = 0), בעוד ⁦9⁩ מתוך ⁦16⁩ אריחי-ההנהלה נושאים אותו
          *("⁦4⁩ מתוך ⁦18⁩ אירועים")*. 🔴 **וזה לא קישוט:** ההערה היא **המכנה של ההשוואה** —
          "עלה ב-⁦12%⁩" בלי "⁦4⁩ מתוך ⁦18⁩" הוא בדיוק הסוג של מספר ש-📐2 קיים כדי לא להשאיר
          בלי אוכלוסייה. ⚠️ **ונעלמת עם האריח הממוסך**, כמו `sub`: `compare` כולו הוא `null`
          שם, ולכן אין כאן ענף נוסף לשכוח. */}
      {compare.note && (
        <span className="block text-xs text-slate-500" data-testid="kpi-compare-note">
          {compare.note}
        </span>
      )}
    </>
  )
}

/**
 * ‏`tile` הוא שורת-אריח של C8:
 * `{ key, label, value, format, sub, window, compare: {value,label,direction,delta?} | null, target }`.
 * ‏`sub` — 📑ב, המכנה-הגלוי (*"⁦144⁩ מתוך ⁦163⁩ משובים"*); מגיע **מעוצב מהשרת** כמחרוזת.
 *
 * ‏`masked` — האריח קיים והערך חסום-הרשאה (§7.97). ⚠️ **שונה מ"אין נתון"**: `MASKED_TEXT`
 * אומר *"לא זמין בתפקידך"*, ו-`—` אומר *"אין לי את הנתון"*. אין להחליף ביניהם.
 *
 * ‏`onOpenTarget` — הכרעה 33: **כל אריח במבט-על הוא דלת לדף**, גם חוצת-לשונית. אריח עם
 * `target` נעטף ב-`<button>` ומקבל מקלדת ומיקוד; אריח בלי `target` נשאר טקסט.
 *
 * 🚪 **ואריח שהיעד שלו יושב בלשונית ממוסכת אינו דלת** (כרטיס ⑧19.2, אפשרות א —
 * *הערך נשאר, הדלת נעלמת*): ההרשאה נשאלת מהמעטפת דרך `ReportsShellContext`, כי המשטח
 * אינו יודע מהן ההרשאות. ר' `reportsShellContext.js` למדידה שהולידה את זה.
 */
export default function KpiTile({ tile, masked = false, onOpenTarget }) {
  // ‏בלי מעטפת (בדיקת-לשונית, רינדור בודד) אין מי שיודע — וכל יעד נחשב פתיח.
  const canOpenTarget = useContext(ReportsShellContext)?.canOpenTarget
  const value = masked ? MASKED_NODE : renderValue(tile)

  const body = (
    <StatTile
      label={tile.label}
      value={value}
      sub={
        <>
          {/* 📑ב — שורת-המכנה-הגלוי, מתחת לערך ומעל ההשוואה (סדר-המוקאפ). */}
          <SubLine sub={masked ? null : tile.sub} />
          <CompareLine compare={masked ? null : tile.compare} fallbackFormat={tile.format} />
          {/* 📐3: חלון-הזמן בכל אריח — ואריח שאינו מגיב למסנן נושא זאת במפורש. */}
          {tile.window && (
            <span className="block text-xs text-slate-500" data-testid="kpi-window">
              {tile.window}
            </span>
          )}
        </>
      }
      emptyText={NO_VALUE}
      testId={`report-tile-${tile.key}`}
    />
  )

  // 🚫 **לא `<button>` שאינו עושה דבר** — ר' הערת-הרכיב: דלת שאינה נפתחת גרועה מהיעדר דלת,
  // כי `aria-label` כבר הבטיח *"פתחי את הדוח"* וקוראת-מסך שמעה קישור.
  if (!tile.target || !onOpenTarget || masked) return body
  if (canOpenTarget && !canOpenTarget(tile.target)) return body

  return (
    <button
      type="button"
      onClick={() => onOpenTarget(tile.target)}
      // 🔑 התווית נאמרת במלואה לקורא-המסך: "פתחי" לבדו אינו אומר לאן.
      aria-label={`${tile.label} — פתחי את הדוח`}
      // 🖱️ `cursor-pointer` מפורש — Tailwind v4 משאיר `<button>` בברירת-המחדל של הדפדפן
      // (`cursor:default`), בעוד שורה-נלחצת ב-`ReportTable` כן מציגה אצבע. הדלת נראתה כטקסט.
      className="w-full cursor-pointer rounded-xl text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
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
