// משטח 4 · תפריט הפעולות פר-שורה — **לא מסך, אלא משטח צף** על שורה בטור "דיילות באירוע"
// של מסך 2. נבנה לפי `docs/mockups/hostesses-screen/approved/04_rowmenu_approved.html`.
//
// 🔑 **ההחלטה שהמשטח משרת** (`screens-approved.md` מסך 4 §②):
// *"מה קרה עם הזימון הזה — ואיך אני רושמת מידע שהגיע בטלפון ולא דרך הקישור."*
// ⇒ **לדיילת אין אפליקציה**, ולכן לכל מצב שהקישור אמור לייצר חייב להיות מסלול-מנהלת
// מקביל. התפריט הוא **הערוץ השני**, לא קיצור-דרך.
//
// 🔴 **התוכן נגזר מהסטטוס** ולעולם אינו רשימה שטוחה — הכלל עצמו חי ב-`src/lib/assignmentActions.js`
// (שם יש לו בדיקות-יחידה), וכאן רק ההצגה שלו. 🚫 **ואין מחיקה בשום סטטוס.**
//
// ⚠️ **‏Radix ולא פאנל-משלנו:** משטח צף שנסגר ב-`onBlur` דרך `setTimeout` הוא באג ידוע
// בפרויקט הזה — לחיצת-אדם נמשכת יותר מהטיימר והפאנל נעלם באמצע הלחיצה, **ובדיקה
// אוטומטית עוברת עליו בירוק** (`src/CLAUDE.md`). ‏Radix מנהל את המיקוד בעצמו.

import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { rowMenuItems } from '@/lib/assignmentActions'

const TONE_CLASS = {
  good: 'text-green-700',
  bad: 'text-red-600',
  muted: 'text-slate-500',
  default: '',
}

export default function AssignmentRowMenu({ row, context, canEdit, busy, onAction }) {
  // 🔴 **למי שאין עריכה — הכפתור אינו קיים כלל, לא כפתור מכובה** (§⑥). זה הכלל שכבר
  // נקבע במסכים 3 ו-2: פקד מכובה מזמין את המשתמשת לנסות ולגלות שאין לה הרשאה.
  if (!canEdit) return null

  const items = rowMenuItems(row, context)
  // שורת-היסטוריה (`ביטלה אחרי אישור`) — אין לה פעולות, ולכן גם אין לה `⋯`.
  if (items.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="פעולות על השיבוץ"
          aria-label="פעולות על השיבוץ"
          disabled={busy}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex size-[26px] items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          data-testid={`row-menu-${row.hostess_id}`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>

      {/* ⚠️ **`align="end"` ולא `"start"`** — ב-RTL ‏`start` מיישר את **קצה-ימין** של התפריט
          לטריגר, והטריגר יושב בקצה **השמאלי** של השורה ⇒ התפריט נשפך אל מחוץ לכרטיס
          ונחתך בקצה החלון. נתפס בצילום-מסך. ‏`end` מיישר את קצה-שמאל ופותח פנימה.
          🔑 וזו הסיבה ש-`Topbar` דווקא כן משתמש ב-`start`: הטריגר שלו בקצה הימני של המסך. */}
      <DropdownMenuContent dir="rtl" align="end" className="min-w-[230px]">
        {items.map((menuItem, index) => (
          <div key={menuItem.action}>
            {/* המפריד שאחרי הפעולה הראשית, כמצויר: הוא מפריד בין **מה שיוצא לדיילת**
                לבין מה שרק נרשם אצלנו. */}
            {index === 1 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={Boolean(menuItem.disabledReason) || busy}
              onClick={(e) => {
                e.stopPropagation()
                onAction(menuItem)
              }}
              className={`${TONE_CLASS[menuItem.tone] ?? ''} ${menuItem.isPrimary ? 'font-semibold' : ''}`}
              data-testid={`row-action-${menuItem.action}-${row.hostess_id}`}
            >
              <span className="flex flex-1 flex-col items-start">
                <span>
                  {menuItem.label}
                  {/* 🔴 **"— כבוי" צמוד לתווית, בדיוק כמצויר** — הפריט **אינו נעלם**
                      (§⑤/§⑧③). פריט שנעלם מלמד שהמערכת לא-עקבית; פריט מכובה עם סיבה
                      מלמד **למה**, והמנהלת עוברת לטלפון. */}
                  {menuItem.disabledReason && (
                    <span className="text-[10.5px] text-slate-400"> — כבוי</span>
                  )}
                </span>
                {menuItem.disabledReason && (
                  <span className="text-[10.5px] leading-tight text-slate-400">
                    {menuItem.disabledReason}
                  </span>
                )}
              </span>
              {/* ✉ מסמן **מה מגיע לדיילת** — ההבחנה שהמשטח הזה חייב לעשות (§🔴 במקרא
                  המוקאפ): "מבצע ושולח" מול "רושם בלבד". */}
              {menuItem.sendsEmail && <span className="text-[11px] text-slate-400">✉</span>}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
