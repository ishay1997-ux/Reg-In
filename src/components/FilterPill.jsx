// גלולת-מסנן — הצורה היחידה של "כפתור עגול שנדלק ומכבה" בסרגלי-הסינון.
//
// למה משותף ולא מקומי: הוא מופיע ב-**שלושה** משטחים של מודול 4 — מאגר הדיילות (שני
// מסננים) · מבט-העל (שלושה) · ו-Smart Match (ארבע זוויות-המיון) — וזה בדיוק הסף שצעד 3.0
// קבע ל"משותף". 🔴 **וכאן הסטייה מסוכנת במיוחד כי הצבע הוא משמעות:** טורקיז **בהיר**
// למצב-נבחר, בעוד הטורקיז **המלא** שמור לפעולה הראשית של המסך — מעבר-האחידות
// שב-`src/CLAUDE.md`. עותק שני היה מייצר מסנן שנראה כמו כפתור-הפעולה.
// *(חולץ 09/08/2026 מ-`RepositoryTab.jsx`, שבו נולד בצעד 3.1. אין שינוי-מראה.)*

import { Button } from '@/components/ui/button'

// on: נבחר · tone='warn': משפחת אזהרת-ההיגיינה (ענבר) · disabled: ר' למטה.
//
// 🔴 **`disabled` אינו "להעלים" — הוא "להשאיר ולהסביר"** (`spec.md §11.4`, וכרטיסי מסכים
// ‏2 ו-4): זווית-מיון שאין לה עדיין דאטה, או פעולה שחסומה ברגע הזה, **נשארת על המסך
// מכובה ומנומקת.** כפתור שנעלם משאיר את המשתמשת בלי הסבר למה היכולת נעדרת, וכפתור
// שנשאר פעיל וממיין שגוי גרוע פי כמה.
export default function FilterPill({ on, tone, onClick, disabled, title, children, testId }) {
  const off = 'border-slate-200 bg-white text-slate-600'
  const active =
    tone === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-700 font-semibold'
      : 'border-teal-200 bg-teal-50 text-teal-700 font-semibold'

  const pill = (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      title={title}
      className={`h-auto rounded-full border px-3 py-1 text-[12.5px] ${on ? active : off} ${
        disabled ? 'opacity-50' : ''
      }`}
      data-testid={testId}
    >
      {children}
    </Button>
  )

  // 🔴 **גלולה מושבתת: ה-`title` על הכפתור לבדו לעולם לא יופיע בהינף-עכבר.**
  // ‏`Button` המשותף נושא `disabled:pointer-events-none` במחלקות-הבסיס שלו
  // (`src/components/ui/button.jsx`), ואלמנט שאינו ניתן-לפגיעה אינו מקבל hit-test —
  // ולכן הדפדפן אינו מרנדר לו tooltip **בכלל**. ⇒ ㉚ *("מושבת ומנומק, לא מוסתר")*
  // הייתה מסופקת חצי בכל המערכת: הפקד נשאר על המסך, והנימוק לא היה נגיש לאיש.
  //
  // התיקון בשכבה המשותפת ולא באתר-קריאה: **עטיפת-`span` שנושאת את אותו `title`**
  // ומקבלת את ההינף במקום הכפתור. למה דווקא זה ולא `aria-disabled` + שומר-לחיצה:
  // ‏`aria-disabled` היה מוציא את הכפתור מ-`disabled` אמיתי, מחזיר אותו לסדר-הטאבים
  // ומשנה את מה שקורא-מסך מכריז — שינוי-סמנטיקה חוצה-מערכת בשביל tooltip.
  // ה-`span` אינו מוקד, אינו נושא role, ואינו נושא סגנון ⇒ **המראה, סדר-הטאבים
  // והסמנטיקה נשארים בדיוק כפי שהיו**; ה-`title` נשאר גם על הכפתור עצמו.
  if (disabled && title) {
    return (
      <span className="inline-flex" title={title}>
        {pill}
      </span>
    )
  }
  return pill
}
