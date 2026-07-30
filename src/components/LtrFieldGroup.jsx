// קבוצת-שדות בכיוון שמאל-לימין בתוך ממשק עברי (טווח-שעות, נוסחה, טווח-סכומים).
//
// ⚠️ למה הרכיב הזה קיים בכלל — זו לא נוחות, זו מניעת-באג חוזר:
// כשמציגים תווית עברית מעל ערך לטיני/מספרי, הפיתוי הוא לכתוב שתי שורות נפרדות —
// שורת-תוויות ושורת-ערכים — ולתת לכל אחת כיוון. **שתי השורות אז מתפצלות בשקט**:
// התוויות מסתדרות מימין-לשמאל והערכים משמאל-לימין, וכל תווית נוחתת מעל הערך של מישהו
// אחר. אין שגיאה, אין בדיקה שנכשלת, וזה נראה תקין למי שלא בודק תו-אחר-תו. זה קרה כאן
// שלוש פעמים (ר' src/CLAUDE.md, "מעבר-כיווניות").
//
// הפתרון: **מכל אחד** עם `dir="ltr"`, גריד אחד, ושתי השורות נגזרות מ**אותה רשימת פריטים**
// באותו סדר. אי-אפשר שתווית תשב מעל הערך הלא-נכון, כי אף אחד לא כותב אותן בנפרד.
// מקבילה למסך של הרכיב `<Ltr>` שפותר את אותה בעיה ב-PDF (quotePdf.jsx).
//
// items: מערך של פריטים לפי סדר-הקריאה **משמאל לימין**:
//   { id, label, value, readOnly }              — תא-ערך (readOnly ⇒ מחושב, לא נערך)
//   { id, label, inputProps }                   — תא-קלט (הרכיב מרנדר את ה-<input> בעצמו,
//                                                 וכך התווית והשדה קשורים ב-htmlFor/id תמיד)
//   { op: '÷' }                                 — סימן מפריד (מוסתר מקוראי-מסך)
//
// `invalid` על פריט ⇒ התא נצבע אדום ומוכרז `aria-invalid`. נוסף בסקירת 3.7: בלעדיו
// שדות-הקבוצה היו השדות היחידים במסך שקיבלו רק טקסט אדום מתחת, בזמן שכל השאר סומנו —
// בדיוק חוסר-האחידות שהסקירה פתחה. `errorId` מקשר את ההודעה שמתחת לקבוצה לשדה עצמו.

import { cn } from '@/lib/utils'

export default function LtrFieldGroup({ items, className, errorId, 'data-testid': testId }) {
  // רוחב-העמודות נגזר מאותה רשימה: תא-ערך גמיש, סימן ברוחב-התוכן שלו.
  const columns = items.map((item) => (item.op ? 'auto' : '1fr')).join(' ')

  return (
    <div
      dir="ltr"
      className={cn('grid items-end', className)}
      style={{ gridTemplateColumns: columns }}
      data-testid={testId}
    >
      {/* שורה 1 — התוויות */}
      {items.map((item, index) =>
        item.op ? (
          <span key={`lbl-${item.op}-${index}`} aria-hidden="true" />
        ) : (
          <label
            key={`lbl-${item.id}`}
            htmlFor={item.id}
            className="truncate pb-1 text-center text-xs text-slate-500"
          >
            {item.label}
          </label>
        ),
      )}

      {/* שורה 2 — הערכים. אותו מערך, אותו סדר ⇒ אותן עמודות בדיוק. */}
      {items.map((item, index) => {
        if (item.op) {
          return (
            <span
              key={`val-${item.op}-${index}`}
              aria-hidden="true"
              className="flex h-9 items-center justify-center border-y border-slate-300 bg-slate-100 px-2 text-xs text-slate-400"
            >
              {item.op}
            </span>
          )
        }
        // הקצוות מקבלים את המסגרת והפינות. הקבוצה כולה ב-dir=ltr, ולכן "ראשון"=שמאל
        // ו"אחרון"=ימין — utilities פיזיות, בעקביות עם שאר הפרויקט (בלי ms-/me-).
        const isFirst = index === 0
        const isLast = index === items.length - 1
        const shell = cn(
          'flex h-9 items-center justify-center border-y border-slate-300 bg-white text-sm',
          isFirst && 'rounded-l-lg border-l',
          isLast && 'rounded-r-lg border-r',
          item.readOnly && 'bg-slate-100 text-slate-600',
          // התא כולו נצבע, ולא רק ה-input שבתוכו: המסגרת כאן שייכת למעטפת, וצביעת
          // ה-input לבדו הייתה מציירת מסגרת שנייה בתוך הראשונה.
          item.invalid && 'border-destructive z-10',
        )

        if (item.readOnly) {
          return (
            <output key={`val-${item.id}`} id={item.id} className={shell}>
              {item.value}
            </output>
          )
        }

        return (
          <span key={`val-${item.id}`} className={shell}>
            {/* חצי-ההגדלה של Chrome ב-input[type=number] גוזלים ~16px ברוחב וחותכים ערך
                תלת-ספרתי בתא צר ("300" הוצג כ-"30"). הם מוסתרים — המקלדת עדיין עובדת. */}
            <input
              id={item.id}
              // בחירת-הערך בכניסה לשדה: שדות מספריים כאן נטענים עם ערך התחלתי (1 / 0 /
              // המלצה מחושבת), ובלי זה כל הקלדה מחייבת קודם למחוק אותו ידנית. זו המוסכמה
              // המקובלת לשדות-מספר עם ברירת-מחדל — מקלידים ומחליפים.
              onFocus={(event) => event.target.select()}
              aria-invalid={item.invalid ? true : undefined}
              aria-describedby={item.invalid ? errorId : undefined}
              className="h-full w-full bg-transparent text-center outline-none focus-visible:ring-2 focus-visible:ring-teal-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              {...item.inputProps}
            />
          </span>
        )
      })}
    </div>
  )
}
