// רצועת "מה דורש טיפול" — שורות מ-attentionSummary בלבד (src/lib/dashboard.js): תיקרה
// קבועה (ATTENTION_CAP) על הכרטיסים המוצגים, שורת-קבוצות שסופרת על הרשימה המלאה, וקישור
// "כל N הפריטים" כשיש מה שנחתך. הרכיב מצייר נקודה+כותרת+"למה" ואינו ממיין/מסנן/מחשב דבר
// בעצמו (כלל 14) — כולל יעד קישור-ה"הכול", שנגזר כאן רק כי הוא בחירת-ניווט של ה-UI.
//
// 🔴 **04/09/2026 — מעמודה-בצד לפס-אופקי מתחת ללוח (מוקאפ מאושר: "מאשר את המוקאפ בנה ככה").**
// הפאנל תפס שליש מרוחב המסך בשביל רשימה, והלוח — הגיבור של המסך — נשאר עם תאים בני ~90px
// שחתכו את שם-האירוע. **מה שהתזוזה קנתה:** הלוח במלוא-הרוחב (תא ~150px, השם נכנס שלם),
// ‏3 שבבים ליום במקום 2, והרצועה הפכה למה שהיא באמת — "יש N, הנה הדחופים" ולא דוח.
// **עוגן:** Monday · Google Calendar · Notion Calendar — כולם לוח מלא-רוחב, ובצד רק מסננים.

import { Link } from 'react-router-dom'
import { attentionRows, attentionSummary, attentionAllLabel, ATTENTION_CAP } from '@/lib/dashboard'
import Ltr from '@/components/Ltr'

const DOT_CLASS = { red: 'bg-red-500', yellow: 'bg-amber-500' }

// unbilled/shortage מקורם במסך-הפרויקטים; quote במסך-ההצעות — קישור-ה"הכול" הולך לאן
// שהשורה הראשונה-שנחתכה שייכת, לא ליעד קבוע.
const PROJECT_KINDS = new Set(['unbilled', 'shortage'])

export default function AttentionPanel({ summary }) {
  const today = summary?.today
  const { rows, hidden, groups, total } = attentionSummary(summary, today)

  // יעד ה"הכול": השורה הראשונה שמעבר לתיקרה קובעת (לא ברירת-מחדל) — כך שהקישור תמיד
  // פותח את המסך שבו יושב הבא-בתור לטיפול, לא מסך אקראי.
  let overflowHref = null
  if (hidden > 0) {
    const firstHidden = attentionRows(summary, today)[ATTENTION_CAP]
    overflowHref = firstHidden && PROJECT_KINDS.has(firstHidden.kind) ? '/projects' : '/quotes'
  }

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4"
      data-testid="dashboard-attention"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-base font-bold text-slate-800">מה דורש טיפול</h2>
        {groups.length > 0 && (
          <p className="text-xs text-slate-500" data-testid="dashboard-attention-groups">
            {groups.map((group, i) => (
              <span key={group.kind}>
                {i > 0 && ' · '}
                {group.label} (<Ltr>{group.count}</Ltr>)
              </span>
            ))}
          </p>
        )}
        {hidden > 0 && (
          <Link
            to={overflowHref}
            data-testid="dashboard-attention-more"
            className="text-xs font-semibold text-teal-700"
          >
            {attentionAllLabel(total)}
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        // אותה מוסכמת-ניסוח כמו "✓ אין פריטים" (src/lib/projects.js) — וי + "אין X" לעובדה טובה.
        <p className="text-sm text-slate-400">✓ אין פריטים הדורשים טיפול</p>
      ) : (
        // ‏auto-fit + minmax: ארבעה כרטיסים בשורה על מסך רחב, ומתקפלים לשניים/אחד בצר —
        // בלי media-query ובלי מספר-עמודות קשיח שיישבר בפריסה אחרת.
        <div className="grid grid-cols-[repeat(auto-fit,minmax(215px,1fr))] gap-2">
          {rows.map((row, i) => (
            // הכרטיס כולו הוא הקישור — קודם היה "פתח ←" נפרד בסוף שורה, וכאן שטח-הלחיצה
            // הגדול הוא גם נוח יותר וגם חוסך פקד שאינו נושא מידע.
            <Link
              key={`${row.kind}-${row.title}-${i}`}
              to={row.href}
              className="flex min-w-0 items-start gap-2 rounded-lg border border-slate-200 p-2.5 hover:border-teal-300 hover:bg-teal-50/40"
              data-testid={`dashboard-attention-row-${i}`}
            >
              <span
                className={`mt-[5px] size-[7px] shrink-0 rounded-full ${DOT_CLASS[row.tone]}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-slate-800">
                  {row.title}
                </span>
                <span className="block text-[11.5px] text-slate-500">{row.why}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
