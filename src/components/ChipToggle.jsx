// צ'יפ רב-בחירה — גלולה שנבחרת ומתבטלת. משמשת היום את שדה-השפות בשלושת משטחי-הדיילת
// (הוספה · עריכה · צפייה), ולכן היא משותפת ולא מקומית.
//
// 🚫 **ואינה אותה משפחה כמו צ'יפי-הנימוק של Smart Match** — `spec.md §1.5` דורש במפורש
// **שתי משפחות נפרדות** (`chip.score` מול `chip.ctx`, ותגית-הנעיצה בשורה משלה). איחוד
// שלהן לרכיב אחד היה מוחק בשקט הפרדה שהוכרעה — ולכן צ'יפי-הנימוק נשארים מקומיים למסך 2.
//
// 🔤 **השפות אינן שער ואינן מסננות דבר** — שדה-מידע בלבד. במילותיו של ישי: *"אולי סבבה
// מישהי שתהיה עם המדפסת ולא צריכה את השפה"* ⇒ לאירוע אחד יש תפקידים שונים, ושער ברמת
// האירוע מניח שכל העמדות זהות. **האלגוריתם מדרג, המנהלת בוחרת פר-עמדה.**
//
// ⚠️ אין `enum` בסכמה — העמודה היא `text[]` חופשי, וחמש השפות במוקאפ הן הצעה ולא רשימה
// סגורה. הרכיב לא אוכף רשימה; הוא מקבל את הערכים מהקורא.

// selected: מערך הערכים הנבחרים · onToggle: קיים ⇒ עריך; חסר ⇒ תצוגה בלבד (כרטיס 3ד).
// 🔴 בתצוגה בלבד מוצגים **רק הנבחרים** — צ'יפ אפור של שפה שהיא לא דוברת אינו מידע,
// הוא רעש; במוקאפ 08 אכן מצוירות שתיים בלבד ולא חמש.
export default function ChipToggle({ options, selected, onToggle, emptyText = '—', testId }) {
  const chosen = selected ?? []
  const shown = onToggle ? (options ?? []) : chosen

  if (shown.length === 0) {
    return (
      <span className="text-slate-400" data-testid={testId}>
        {emptyText}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5" data-testid={testId}>
      {shown.map((option) => {
        const isSelected = chosen.includes(option)
        const tone = isSelected
          ? 'bg-teal-50 border-teal-200 text-teal-700 font-semibold'
          : 'bg-white border-slate-300 text-slate-600'

        if (!onToggle) {
          return (
            <span
              key={option}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600"
            >
              {option}
            </span>
          )
        }

        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            aria-pressed={isSelected}
            className={`h-auto rounded-full border px-3 py-1 text-[12.5px] ${tone}`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
