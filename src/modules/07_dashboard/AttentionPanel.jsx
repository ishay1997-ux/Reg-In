// פאנל "מה דורש טיפול" — שורות מ-attentionSummary בלבד (src/lib/dashboard.js): תיקרה
// קבועה (ATTENTION_CAP) על השורות המוצגות, שורת-קבוצות שסופרת על הרשימה המלאה, וקישור-
// "עוד" כשיש מה שנחתך. הרכיב מצייר נקודה+כותרת+"למה"+קישור ואינו ממיין/מסנן/מחשב דבר
// בעצמו (כלל 14) — כולל יעד קישור-ה"עוד", שנגזר כאן רק כי הוא בחירת-ניווט של ה-UI, לא
// לוגיקת-דירוג.

import { Link } from 'react-router-dom'
import {
  attentionRows,
  attentionSummary,
  attentionOverflowLabel,
  ATTENTION_CAP,
} from '@/lib/dashboard'
import Ltr from '@/components/Ltr'

const DOT_CLASS = { red: 'bg-red-500', yellow: 'bg-amber-500' }

// unbilled/shortage מקורם במסך-הפרויקטים; quote במסך-ההצעות — קישור-ה"עוד" הולך לאן
// שהשורה הראשונה-שנחתכה שייכת, לא ליעד קבוע.
const PROJECT_KINDS = new Set(['unbilled', 'shortage'])

export default function AttentionPanel({ summary }) {
  const today = summary?.today
  const { rows, hidden, groups } = attentionSummary(summary, today)

  // יעד ה"עוד": השורה הראשונה שמעבר לתיקרה קובעת (לא ברירת-מחדל) — כך ש"+2 נוספים" תמיד
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
      <h2 className="mb-3 text-base font-bold text-slate-800">מה דורש טיפול</h2>
      {rows.length === 0 ? (
        // אותה מוסכמת-ניסוח כמו "✓ אין פריטים" (src/lib/projects.js) — וי + "אין X" לעובדה טובה.
        <p className="text-sm text-slate-400">✓ אין פריטים הדורשים טיפול</p>
      ) : (
        <>
          {groups.length > 0 && (
            <p className="mb-2 text-xs text-slate-500" data-testid="dashboard-attention-groups">
              {groups.map((group, i) => (
                <span key={group.kind}>
                  {i > 0 && ' · '}
                  {group.label} (<Ltr>{group.count}</Ltr>)
                </span>
              ))}
            </p>
          )}
          <ul className="flex flex-col divide-y divide-slate-100">
            {rows.map((row, i) => (
              <li
                key={`${row.kind}-${row.title}-${i}`}
                className="flex items-center gap-2.5 py-2.5 text-sm"
                data-testid={`dashboard-attention-row-${i}`}
              >
                <span className={`size-2 shrink-0 rounded-full ${DOT_CLASS[row.tone]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-slate-800">{row.title}</span>
                  <span className="block text-[12px] text-slate-500">{row.why}</span>
                </span>
                <Link
                  to={row.href}
                  className="shrink-0 whitespace-nowrap text-xs font-semibold text-teal-700"
                >
                  פתח ←
                </Link>
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <Link
              to={overflowHref}
              data-testid="dashboard-attention-more"
              className="mt-2 block text-xs font-semibold text-teal-700"
            >
              {attentionOverflowLabel(hidden)}
            </Link>
          )}
        </>
      )}
    </div>
  )
}
