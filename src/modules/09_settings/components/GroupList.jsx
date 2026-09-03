// רשימת קבוצות-ההגדרות (העמודה הימנית במוקאפ, סעיף 1) — תווית + מונה, והקבוצה הפעילה
// מסומנת. תצוגתי בלבד: אפס שליפות, אפס Supabase.
//
// 🎨 **מצב-נבחר מקבל גוון בהיר ולא טורקיז-מלא** — מעבר-האחידות ב-`src/CLAUDE.md`:
// "טורקיז מלא שמור לפעולה הראשית האחת של המסך", והפעולה הראשית כאן היא "שמור שינויים".
//
// 🔢 המונה עטוף ב-`<Ltr>`: ספרה שצמודה לטקסט עברי בתוך אותו אלמנט מתמקמת לפי ההקשר
// שסביבה, וקבוצה עם מונה דו-ספרתי הייתה נראית אחרת מקבוצה עם מונה חד-ספרתי.

import Ltr from '@/components/Ltr'
import { cn } from '@/lib/utils'

export default function GroupList({ groups, activeType, onSelect }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="קבוצות ההגדרות" data-testid="settings-groups">
      {groups.map((group) => {
        const isActive = group.type === activeType
        return (
          <button
            key={group.type}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(group.type)}
            className={cn(
              'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-right text-sm transition-colors',
              isActive
                ? 'border-teal-200 bg-teal-50 font-semibold text-teal-800'
                : 'border-transparent text-slate-600 hover:bg-slate-50',
            )}
            data-testid={`settings-group-${group.type}`}
          >
            <span>{group.label}</span>
            <Ltr className="rounded-full bg-slate-100 px-2 text-xs text-slate-600">
              {group.count}
            </Ltr>
          </button>
        )
      })}
    </nav>
  )
}
