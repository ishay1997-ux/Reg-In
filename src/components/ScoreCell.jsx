// תא ציון-המשוב של פרויקט — כוכבים + תגית-תווית, **אותה צורה בכל מקום שמציג את מה שהלקוח נתן**.
//
// חולץ 04/09/2026 מ-`FinancePage.jsx` (S1) כשישי ביקש לראות את הדירוג גם בשורת-הפרויקט
// בכרטיס-הלקוח: שני משטחים שמציגים את אותה עובדה חייבים רכיב אחד (מעבר-האחידות,
// `src/CLAUDE.md`), אחרת הם סוטים בשקט — בדיוק מה שקרה ל-`StatTile` לפני שאוחד.
// הקלט הוא התוצר של `scoreTag(feedback_score)` (‏`src/lib/projectFinance.js`): `null` = טרם ענו.
// 🔴 התג נושא **תווית בלבד, בלי מספר** (החלטה חוצת-משטחים #4 של מ8) — המספר יושב בכוכבים.

import RatingStars from '@/components/RatingStars'
import StatusTag from '@/components/StatusTag'

const DASH = '—'

export default function ScoreCell({ score, testId }) {
  if (score === null || score === undefined) {
    return (
      <span className="text-slate-400" data-testid={testId}>
        {DASH}
      </span>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid={testId}>
      <RatingStars value={score.score} />
      <StatusTag label={score.label} tone={score.tone} />
    </div>
  )
}
