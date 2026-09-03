// פאנל "מה דורש טיפול" — שורות מ-attentionRows בלבד (src/lib/dashboard.js), בסדר שהיא כבר
// מחזירה (שלושת הענפים לפי עדיפות-קבועה — ר' ההערה שם). הרכיב מצייר נקודה+כותרת+"למה"+קישור
// ואינו ממיין/מסנן/מחשב דבר בעצמו (כלל 14).

import { Link } from 'react-router-dom'
import { attentionRows } from '@/lib/dashboard'

const DOT_CLASS = { red: 'bg-red-500', yellow: 'bg-amber-500' }

export default function AttentionPanel({ summary }) {
  const rows = attentionRows(summary, summary?.today)

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
      )}
    </div>
  )
}
