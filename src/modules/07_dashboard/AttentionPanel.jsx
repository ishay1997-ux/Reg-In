// רצועת "מה דורש טיפול" — R6 09/09/2026 (הכרעת-ישי): ארבעה כרטיסי-מחלקה קבועים
// מ-attentionCategories (src/lib/dashboard.js), לא רשימת-שורות עם תיקרה. כל כרטיס
// שייך בדיוק לתפקיד אחד שמטפל בו (כספים/דיילות/לוגיסטיקה/הצעות), ולחיצה עליו פותחת
// את מסך המודול של אותה מנהלת — זו התשובה בפועל ל"עם איזה מנהל לדבר", לא רק מונה.
// הרכיב מצייר נקודה+כותרת+תפקיד+מונה+שורת-הפריט-הדחוף, ואינו ממיין/מסנן/מחשב דבר
// בעצמו (כלל 14).
//
// 🔴 **04/09/2026 — מעמודה-בצד לפס-אופקי מתחת ללוח (מוקאפ מאושר: "מאשר את המוקאפ בנה ככה").**
// הפאנל תפס שליש מרוחב המסך בשביל רשימה, והלוח — הגיבור של המסך — נשאר עם תאים בני ~90px
// שחתכו את שם-האירוע. **מה שהתזוזה קנתה:** הלוח במלוא-הרוחב (תא ~150px, השם נכנס שלם),
// ‏3 שבבים ליום במקום 2, והרצועה הפכה למה שהיא באמת — "יש N, הנה הדחופים" ולא דוח.
// **עוגן:** Monday · Google Calendar · Notion Calendar — כולם לוח מלא-רוחב, ובצד רק מסננים.

import { Link } from 'react-router-dom'
import Hint from '@/components/Hint'
import { attentionCategories, MASKED_TEXT } from '@/lib/dashboard'
import Ltr from '@/components/Ltr'

const DOT_CLASS = { red: 'bg-red-500', yellow: 'bg-amber-500' }

export default function AttentionPanel({ summary }) {
  const categories = attentionCategories(summary, summary?.today)

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4"
      data-testid="dashboard-attention"
    >
      <h2 className="mb-3 text-base font-bold text-slate-800">מה דורש טיפול</h2>
      <Hint id="dashboard.attention" />

      {/* ארבעה כרטיסים קבועים, לא רשימה שמתכווצת/מתרחבת — קטגוריה ריקה נשארת על המסך
          עם "✓ אין" (הכרעת-ישי, פריסה יציבה), במקום להיעלם ולזוז לכל השאר. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.kind}
            to={cat.href}
            className="flex min-w-0 flex-col gap-1 rounded-lg border border-slate-200 p-2.5 hover:border-teal-300 hover:bg-teal-50/40"
            data-testid={`dashboard-attention-card-${cat.kind}`}
          >
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className={`size-[7px] shrink-0 rounded-full ${DOT_CLASS[cat.tone]}`} />
              {cat.label} · {cat.role}
            </span>
            {cat.masked ? (
              <span className="text-sm font-semibold text-slate-400">{MASKED_TEXT}</span>
            ) : (
              <>
                <span className="text-xl font-bold text-slate-800">
                  {cat.count === 0 ? (
                    <span className="text-sm font-semibold text-slate-400">✓ אין</span>
                  ) : (
                    <Ltr>{cat.count}</Ltr>
                  )}
                </span>
                {cat.topLine && (
                  <span className="block truncate text-[11.5px] text-slate-500">{cat.topLine}</span>
                )}
              </>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
