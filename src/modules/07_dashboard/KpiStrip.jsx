// רצועת ארבעת אריחי-הבית — ממפה כל מודל מ-`kpiCards` (src/lib/dashboard.js) לפרופים של
// `StatTile` בלבד. אפס חישוב כאן (כלל 14): כל מספר/מיסוך/תווית כבר מגיע מוכן מהמודל.
//
// שתי המגבלות של StatTile (ר' הכותרת שם) שהמסך הזה חייב לעקוף בעצמו:
// ① `value` מספרי עובר אוטומטית דרך Money — לא מתאים ל"4.3/5" ולא לספירת-הצעות, ולכן שתיהן
//   מוזרמות כ-node מפורש (Ltr, לא מספר גולמי).
// ② `masked` ו"אין נתון" הן שתי אמירות שונות (§7.97) — כרטיס ממוסך מציג MASKED_TEXT דווקא,
//   לא את emptyText הכללי של StatTile.

import StatTile from '@/components/StatTile'
import Ltr from '@/components/Ltr'
import { MASKED_TEXT } from '@/lib/dashboard'

const MASKED_NODE = <span className="text-sm font-normal text-slate-400">{MASKED_TEXT}</span>

function quotesValue(card) {
  if (card.masked) return MASKED_NODE
  if (card.value == null) return null
  return <Ltr>{String(card.value)}</Ltr>
}

function tilePropsFor(card) {
  switch (card.key) {
    case 'satisfaction':
      return {
        label: card.label,
        // 🐞 נתפס בצילום-האימות (03/09/2026): הערך והסיומת כשני צמתים נפרדים הוצגו "5/4.7" —
        // ה-bidi סידר את "/5" משמאל ל-"4.7". שניהם חייבים לשבת בתוך *אותו* בידוד-LTR אחד
        // (ערך יחיד עם סיומת, לא "רצף בן שני ערכים"), כדי שהקורא יראה 4.7/5.
        value:
          card.value == null ? null : (
            <Ltr>
              {card.value}
              <span className="text-sm font-normal text-slate-400">{card.suffix}</span>
            </Ltr>
          ),
        sub: card.sub,
        emptyText: '—',
      }
    case 'profit':
      return {
        label: card.label,
        value: card.masked ? MASKED_NODE : card.amount,
        emptyText: '—',
      }
    case 'quotes':
      return { label: card.label, value: quotesValue(card), emptyText: '—' }
    default:
      // 'active' — מונה שלם. 🔴 **תוקן 03/09/2026 (אודיט-הסגירה, T-1):** כאן ישב
      // `String(card.value)` בלי שמירה, בהסתמך על `?? 0` שהיה ב-kpiCards. ה-`?? 0` הוסר שם
      // (שקר שקט: "לא ידוע" הוצג כ-0), ובלי השורה הזו המסך היה מדפיס את המחרוזת **"null"**.
      // אותה שמירה בדיוק כמו בכרטיס-ההצעות מעליי, ואותו `emptyText`.
      return {
        label: card.label,
        value: card.value == null ? null : <Ltr>{String(card.value)}</Ltr>,
        emptyText: '—',
      }
  }
}

export default function KpiStrip({ cards }) {
  return (
    // flex flex-wrap ולא grid (הכרעת-ישי 08/08 — StatTile.jsx) — עוטפים ואינם נמתחים.
    <div className="mb-4 flex flex-wrap gap-3">
      {cards.map((card) => (
        <StatTile key={card.key} {...tilePropsFor(card)} testId={`kpi-${card.key}`} />
      ))}
    </div>
  )
}
