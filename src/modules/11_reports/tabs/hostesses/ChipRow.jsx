// שורת מסנני-הדף של לשונית "דיילות" (`.pagefilters` במוקאפ המאושר, שורות 664–674).
//
// 🔑 **שלושה משטחים ושלוש קבוצות-שבבים שונות — ורכיב אחד:** *"אדומות וענבר בלבד"* ו-*"פעילות
// בלבד"* במ15 · בורר יום-בשבוע במ15 · *"בלי דירוג בלבד"* במ16. שלוש רשימות של אותו כפתור
// בדיוק, ו-jscpd (3%) היה תופס את ההעתק השלישי.
//
// ⚠️ **וזה `aria-pressed` ולא `aria-current`** — ההבחנה שכתובה ב-`ReportChips.jsx`: שם זו
// **רשימת-ניווט** (הלחיצה מחליפה דף), וכאן זה **מסנן רב-בחירה** (הלחיצה מדליקה/מכבה).
// קורא-מסך חייב לשמוע "לחצן לחוץ" ולא "קישור נוכחי".
//
// 🔴 **ואזור-ההכרזה הוא חלק מהרכיב ולא תוספת:** ‏📐9④ — אזור `aria-live` חייב להיות בדף
// **מראש** וריק; אזור שנוצר בלחיצה אינו מוכרז כלל.
// ✏️ **תוקן 16/09 (סבב 3, ממצא 6):** ההערה כאן אמרה ש-`ReportSurface` אינו מעביר
// ‏`announcement` ל-`ReportTable` — **זה כבר לא נכון** (‏`ReportSurface.jsx:487` מעביר).
// ⚠️ **אבל הוא ממלא אותו רק תחת בחירת-סינון-צולב**, ובלשונית הזו אין סינון-צולב בהצהרה
// (מ16 מכובה, ובשלושת האחרים אין מפתח) ⇒ **בלי ההכרזה כאן, בחירת-יום מחליפה טבלה שלמה
// בשקט מוחלט לקורא-מסך.** לכן שתי השורות — מסנני-הדף ובורר-היום — מוסרות טקסט.
//
// 🔤 **וקבוצת-השבבים נקובה בשם** (`role="group"` + `aria-labelledby`): בלי זה קורא-מסך
// מכריז שישה כפתורים בשמות "ראשון…שישי" בלי לומר מה הם מסננים.
//
// 🎨 צורת-הגלולה מועתקת מ-`ReportChips`/`FilterPill` — טורקיז בהיר לפעיל, אפור לכבוי.
// 🚫 בלי utilities לוגיות (`ms-`/`pe-`) — פיזיות בלבד (`src/CLAUDE.md` §2.4).

import { cn } from '@/lib/utils'

export default function ChipRow({ label, chips, announcement = '', testId = 'reports-chips' }) {
  // 🔴 **שורה בלי שבבים אינה מרונדרת** — לא "ליתר ביטחון": בורר-היום נבנה מ-`chart.label_source`,
  // וביום שבו ה-RPC יפסיק לשלוח אותו הרשימה תתרוקן. בלי התנאי הזה המסך היה מציג תווית
  // *"יום בשבוע"* מרחפת בלי אף כפתור — פקד שנראה שבור ואינו אומר למה.
  if (!chips?.length) return null
  const labelId = `${testId}-label`
  return (
    <div
      className="mb-3 flex w-full flex-wrap items-center gap-1.5"
      role={label ? 'group' : undefined}
      aria-labelledby={label ? labelId : undefined}
      data-testid={testId}
    >
      {label && (
        <span id={labelId} className="ml-1 text-xs text-slate-500">
          {label}
        </span>
      )}
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onToggle}
          aria-pressed={chip.on}
          data-testid={`${testId}-${chip.key}`}
          className={cn(
            'whitespace-nowrap rounded-full border px-3 py-1 text-sm leading-tight',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700',
            chip.on
              ? 'border-teal-200 bg-teal-50 font-semibold text-teal-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          {chip.text}
        </button>
      ))}
      <p className="sr-only" aria-live="polite" data-testid={`${testId}-announce`}>
        {announcement}
      </p>
    </div>
  )
}
