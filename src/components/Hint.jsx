// <Hint id="…" /> — שורת-ההסבר של "מצב הטמעה", רכיב אחד לכל המערכת (הכרעה 28④).
//
// ההשתלה בכל מסך היא שורה אחת: `<Hint id="projects.sort" />`. הרכיב קורא את רמת-ההטמעה של
// המשתמשת מ-AuthContext (`onboardingMode`, 0/1/2 — נטען פעם אחת עם המשתמש, לא שאילתה
// פר-מסך) ואת הטקסט מ-`src/lib/onboardingCopy.js` — ומחזיר `null` כשהרמה נמוכה מ-`level`.
// כך המתג מהפך את כל המסכים חי, בלי רענון: הקונטקסט משתנה ⇒ כל Hint מרונדר מחדש.
//
// 🔴 מפתח חסר ⇒ `null` בשקט בייצור + `console.warn` בפיתוח. לא זורקים ולא מציגים את
// המפתח על המסך — שגיאת-הקלדה במפתח אסור לה להפיל מסך או להדליף מזהה למשתמשת.
//
// אינליין ולא ריחוף (H4 — מקלדת ומגע רואים אותו), רמה אחת בלי "קרא עוד" (H5), ולעולם לא
// מכסה נתונים: השכבה חייבת להיות ניתנת-לעבודה כשהיא דלוקה. ‏`src/components/ui/` אינו מכיל
// tooltip/popover — ואינליין הוא גם אפס-תלות.
//
// הרמות (28⑭): הלילה כל Hint הוא `level={2}` (ברירת-המחדל) ומציג את `guided`. רמה 1
// (`pointer`) אינה נכתבת עכשיו; כשתיכתב — Hint מציג את הטקסט הגבוה ביותר שהרמה מתירה.

import { useAuth } from '@/contexts/AuthContext'
import { ONBOARDING_LEVEL, getOnboardingCopy } from '@/lib/onboardingCopy'
import { cn } from '@/lib/utils'

export default function Hint({ id, level = ONBOARDING_LEVEL.GUIDED, className }) {
  const { onboardingMode } = useAuth()
  const mode = Number.isInteger(onboardingMode) ? onboardingMode : ONBOARDING_LEVEL.CLEAN

  if (mode < level) return null

  const entry = getOnboardingCopy(id)
  if (!entry) {
    if (import.meta.env.DEV) {
      console.warn(`Hint: אין קופי למפתח "${id}" ב-src/lib/onboardingCopy.js`)
    }
    return null
  }

  const text =
    (mode >= ONBOARDING_LEVEL.GUIDED && entry.guided) ||
    (mode >= ONBOARDING_LEVEL.POINTERS && entry.pointer) ||
    null
  if (!text) return null

  // גבול ימני (start ב-RTL — הפרויקט על utilities פיזיות, src/CLAUDE.md) בטורקיז-הפרימרי,
  // טקסט אפור-כהה: אינו פעולה ואינו אזהרה ⇒ בלי מילוי-צבע (כלל-המילוי, PROJECT_MASTER §4).
  return (
    <p
      data-testid={`hint-${id}`}
      className={cn('text-sm text-slate-600 border-r-2 border-teal-500 pr-3 my-1', className)}
    >
      {text}
    </p>
  )
}
