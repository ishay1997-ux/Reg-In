// אריח-מדד משותף — הצורה היחידה של "מספר גדול + תווית + שורת-משנה" בכל המערכת.
//
// למה רכיב ולא מחלקות-CSS מועתקות (הכרעת-ישי 07/08/2026): האריח היה מוגדר פעמיים בנפרד
// (`Highlight` בכרטיס-הלקוח · שני אריחים inline במסך-ההצעות) והשניים **נבדלו בפועל** — סדר
// תווית/ערך הפוך, גודל-ערך שונה, וגוון שונה לשורת-המשנה. אותו עיקרון בדיוק כמו `Money`
// ו-`LtrFieldGroup`: רכיב שפולט את כל החלקים יחד הוא הדבר היחיד שסטייה אינה אפשרית בו.
//
// 🔴 הצורה הקנונית: **תווית מעל הערך.** זו הצורה של מודול 2 (מודול-הייחוס למוסכמות) ושל כל
// שמונת מוקאפי מודול 4 שאושרו 07/08; מסך-ההצעות היה היחיד ההפוך, והוא זה שיושר.
//
// 🔴 והמעטפת הקנונית: **`flex flex-wrap`, לעולם לא `grid` שמותח לרוחב-מלא** — הכרעת-ישי
// 08/08/2026, לכל מודול עתידי. `grid-cols-N` על מספר-קטן-של-אריחים משאיר שטח-ריק בתוך כל
// אריח (נמצא ב-CustomerDetailsPage, שתוקן מ-grid ל-flex); מסך-ההצעות כבר עמד בזה מ-29/07.
// חיצוני: גם Salesforce Highlights Panel — אותה רצועה בדיוק בראש עמוד-רשומה — "עוטף ונשאר
// נראה" ולא נמתח למלא רוחב.
//
// 🎨 לבן + מסגרת אפורה, לעולם לא מילוי-צבע — כלל-המילוי (`PROJECT_MASTER §4`): מדד הוא
// **עובדה**, ומילוי שמור לפעולה-הראשית של המסך או לאזהרה. אריח-מדד צבוע מתחרה ויזואלית
// עם הכפתור הראשי, וזה בדיוק מה שהכלל נועד למנוע.

import Money from '@/components/Money'

// value: מספר ⇒ מוצג דרך `Money` (₪ בצד הנכון, בלי לחשוב) · צומת-React ⇒ מוצג כמות שהוא
//        (אחוזים, טקסט) · null/undefined ⇒ `emptyText`.
// ⚠️ null אינו 0 — מדד שאין לו נתון מציג טקסט ולא מספר, אחרת "0 ₪" נקרא כעובדה שקרית.
// ‏`items-start` (צעד 3.0 β של מודול 6) — יישור למוקאפ המאושר (`02_project_card_approved.html`:
// ‏`.cell, .tile{align-items:flex-start}`): בעמודת-flex בלי זה הילדים עוברים blockification,
// אלמנט `ltr` נמתח לרוחב מלא ומיישר את ערכו שמאלה — הרחק מהתווית שמעליו, שמיושרת ימינה.
// פיצול-RTL שנמדד בדפדפן על המוקאפ (13/08/2026); היישור כאן מצמיד את הרכיב לצורה המאושרת.
export default function StatTile({ label, value, sub, emptyText = 'אין נתונים עדיין', testId }) {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col items-start gap-0.5"
      data-testid={testId}
    >
      <span className="text-xs text-slate-500">{label}</span>
      {value == null ? (
        <span className="text-sm text-slate-400">{emptyText}</span>
      ) : (
        <span className="text-xl font-bold text-slate-800">
          {typeof value === 'number' ? <Money amount={value} /> : value}
        </span>
      )}
      {sub && <span className="text-[11px] text-slate-500">{sub}</span>}
    </div>
  )
}
