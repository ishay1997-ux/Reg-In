// פאנל-הלוח של מסך-הבית: כותרת-חודש + סרגל-כלים (ניווט/היום/חיפוש/צ'יפי-צבע) + רשת 7×שבועות
// + מקרא. כל נגזרת (צבע/קיבוץ-לפי-תאריך/סינון/ספירה) מגיעה מ-src/lib/dashboard.js (כלל 14) —
// הרכיב מחזיק רק שני מצבים מקומיים ש"איך המסך נראה עכשיו" ולא מזוהי-כתובת (בניגוד לחודש
// המוצג, שכן ב-URL אצל ההורה): החיפוש וצ'יפי-הצבע הפעילים.
//
// 🔴 שתי תקלות-CSS שהמוקאפ המאושר נתפס בהן וישי תיקן (ר' פרומפט-המסירה): `grid-cols-7` של
// Tailwind הוא כבר `repeat(7,minmax(0,1fr))` בייט-לבייט (לא צריך ערך-שרירותי) — אבל
// `auto-rows-*` המוכן לא כולל `minmax(92px,auto)`, ולכן זה כן ערך-שרירותי.
//
// 🆕 **04/09/2026 — הלוח עבר למלוא-הרוחב (מוקאפ מאושר, "מאשר את המוקאפ בנה ככה").** הפאנל
// "מה דורש טיפול" ירד מתחתיו, והתא גדל מ-~90px ל-~150px רוחב. **זה מה שהתיקון קנה, וזו
// הסיבה שלו:** ב-2 עמודות שם-האירוע נחתך (`כנס לקוח — רישום וה…`) והמשתמשת נאלצה לרחף
// כדי לדעת מה השבב. ⇒ גם `MAX_CHIPS_PER_DAY` עלה ל-3 וגם המידות גדלו במקצת.

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import FilterPill from '@/components/FilterPill'
import Ltr from '@/components/Ltr'
import { cn } from '@/lib/utils'
import {
  colorProjects,
  colorCounts,
  hebrewMonthTitle,
  monthGridCells,
  projectsByDate,
  filterCalendarProjects,
} from '@/lib/dashboard'
import { StaffingIcon, LogisticsIcon } from './dimIcons'

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const ALL_COLORS = ['red', 'yellow', 'green', 'cancelled']

const SWATCH_CLASS = {
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  green: 'bg-green-500',
  cancelled: 'bg-slate-400',
}

const CHIP_CLASS = {
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-800',
  green: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500 line-through',
}

// שני תנאי-"מלא" של סמלי-הצ'יפ: זהים בייט-לבייט ל-`logisticsComplete` הפרטית (לא מיוצאת)
// ול-תנאי ≥ הישיר של staffingCell ב-src/lib/projects.js — אך שתיהן שם מחזירות מבנה-תא
// (ratio+sub+tone) לטבלת מבט-העל, לא בוליאני גולמי לצ'יפ-לוח. שכפול-שורה-אחת מודע, לא
// לוגיקה-עסקית חדשה.
function isStaffingComplete(project) {
  return Number(project.hostesses_confirmed) >= Number(project.required_hostess_count)
}
function isLogisticsComplete(project) {
  const total = project.logistics_total ?? 0
  return total === 0 || project.logistics_ready === total
}

export default function CalendarGrid({ summary, monthStartIso, onPrev, onNext, onToday }) {
  const [activeColors, setActiveColors] = useState(() => new Set(ALL_COLORS))
  const [query, setQuery] = useState('')

  const warningDays = summary?.params?.event_warning_days
  const colored = useMemo(
    () => colorProjects(summary?.projects, summary?.today, warningDays),
    [summary, warningDays],
  )
  // ספירת-הצ'יפים (③ ליד סרגל-הלוח) משקפת את החודש המוצג בלבד — לא את כל הפרויקטים.
  const monthProjects = useMemo(
    () => Object.values(projectsByDate(colored, monthStartIso)).flat(),
    [colored, monthStartIso],
  )
  const counts = useMemo(() => colorCounts(monthProjects), [monthProjects])
  const filtered = useMemo(
    () => filterCalendarProjects(monthProjects, { colors: activeColors, query }),
    [monthProjects, activeColors, query],
  )
  const byDate = useMemo(() => projectsByDate(filtered, monthStartIso), [filtered, monthStartIso])
  const cells = useMemo(() => monthGridCells(monthStartIso), [monthStartIso])

  function toggleColor(color) {
    setActiveColors((prev) => {
      const next = new Set(prev)
      if (next.has(color)) next.delete(color)
      else next.add(color)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-base font-bold text-slate-800">{hebrewMonthTitle(monthStartIso)}</h2>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          aria-label="חודש קודם"
          className="h-auto w-7 rounded-lg border-slate-300 py-1 px-0 text-slate-600"
          data-testid="dashboard-cal-prev"
        >
          ‹
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onNext}
          aria-label="חודש הבא"
          className="h-auto w-7 rounded-lg border-slate-300 py-1 px-0 text-slate-600"
          data-testid="dashboard-cal-next"
        >
          ›
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onToday}
          className="h-auto rounded-lg border-slate-300 py-1 px-3 text-xs font-semibold text-slate-700"
          data-testid="dashboard-cal-today"
        >
          היום
        </Button>
        <div className="relative min-w-[10rem] flex-1">
          {/* זכוכית-מגדלת בצד ימין של תיבת-חיפוש — מעבר-האחידות (CustomersPage.jsx). */}
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש פרויקט…"
            className="h-auto rounded-lg border-slate-300 py-1.5 pr-9 pl-3 text-right text-xs"
            data-testid="dashboard-cal-search"
          />
        </div>
        {ALL_COLORS.map((color) => (
          <FilterPill
            key={color}
            on={activeColors.has(color)}
            onClick={() => toggleColor(color)}
            testId={`dashboard-filter-${color}`}
          >
            <span className={cn('inline-block size-2 rounded-full', SWATCH_CLASS[color])} />
            <Ltr className="mr-1">{String(counts[color])}</Ltr>
          </FilterPill>
        ))}
      </div>

      {/* 🐞 שורת-ימי-השבוע יצאה מרשת-הימים (04/09/2026, נתפס בצילום-האימות): היא ישבה
          באותו grid, ולכן `auto-rows-[minmax(92px,auto)]` החיל עליה גם את גובה-המינימום של
          תא-יום — פס ריק בן ~90px בין הכותרות לשבוע הראשון. הפגם היה קיים גם ב-76px, ורק
          התרחב איתו. רשת נפרדת באותן 7 עמודות פותרת בלי לגעת בתאים. */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-[11px] font-semibold text-slate-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[minmax(92px,auto)] gap-1.5">
        {cells.map((cell, i) => (
          <DayCell
            key={cell.date ?? `empty-${i}`}
            cell={cell}
            today={summary?.today}
            projects={cell.date ? (byDate[cell.date] ?? []) : []}
          />
        ))}
      </div>

      <Legend warningDays={warningDays} />
    </div>
  )
}

// 🔢 **שלושה שבבים ליום, ולא שניים — נמדד ולא הורגש** (04/09/2026, הכרעת-ישי על המוקאפ).
// התפלגות האירועים-ליום בכל המסד: 355 ימים עם אחד (62%) · 178 עם שניים (31%) · 36 עם
// שלושה (6%) · **2 ימים בלבד עם ארבעה, ואפס עם חמישה.** ⇒ שלושה מכסים 99.6% מהימים,
// ו"+N עוד" נותר מנגנון-קצה שנדלק פעמיים בכל הדאטה — לא מסלול יומיומי.
const MAX_CHIPS_PER_DAY = 3

function DayCell({ cell, today, projects }) {
  // ⚠️ ה-hook לפני היציאה-המוקדמת — כללי-ה-hooks אוסרים קריאה מותנית.
  const [expanded, setExpanded] = useState(false)
  if (!cell.inMonth) return <div />
  const isToday = cell.date === today
  const shown = expanded ? projects : projects.slice(0, MAX_CHIPS_PER_DAY)
  const extra = projects.length - shown.length

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-[3px] rounded-lg border p-[4px] text-[11px] text-slate-500',
        isToday ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-200',
      )}
      data-testid={`dashboard-day-${cell.date}`}
    >
      <Ltr className="px-[2px] text-[11px] font-semibold text-slate-600">{String(cell.day)}</Ltr>
      {shown.map((project) => (
        <DayChip key={project.project_id} project={project} />
      ))}
      {/* 🔴 **מרחיב את התא, לא מנווט למסך אחר** (הכרעת-ישי 04/09/2026, במילותיו: *"העוד מוביל
          לפרויקטים ואז מזה עוזר לי לחפש את הפרויקט השלישי?"*). קודם זה היה `<Link to="/projects">`
          — כלומר קפיצה לרשימה בת מאות שורות כדי למצוא פרויקט שכבר ידעת באיזה יום הוא. עכשיו
          השאר נפתח במקום, וזו גם מוסכמת Google Calendar / Monday. */}
      {extra > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="px-[3px] text-right text-[10.5px] font-semibold text-slate-400 hover:text-teal-700"
          data-testid={`dashboard-more-${cell.date}`}
        >
          {`+${extra} עוד`}
        </button>
      )}
      {expanded && projects.length > MAX_CHIPS_PER_DAY && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-[3px] text-right text-[10.5px] font-semibold text-slate-400 hover:text-teal-700"
          data-testid={`dashboard-less-${cell.date}`}
        >
          הצג פחות
        </button>
      )}
    </div>
  )
}

function DayChip({ project }) {
  const cancelled = project.color === 'cancelled'
  return (
    <Link
      to={`/projects/${project.project_id}`}
      className={cn(
        'flex items-center gap-[4px] overflow-hidden rounded px-[5px] py-[2px] text-[11px] font-semibold',
        CHIP_CLASS[project.color],
      )}
      data-testid={`dashboard-chip-${project.project_id}`}
    >
      <span className="min-w-0 flex-1 truncate">{project.event_name}</span>
      {cancelled ? (
        <span className="shrink-0 text-[9px] font-normal">מבוטל</span>
      ) : (
        <span className="flex shrink-0 items-center gap-[2px]">
          <StaffingIcon filled={isStaffingComplete(project)} />
          <LogisticsIcon filled={isLogisticsComplete(project)} />
        </span>
      )}
    </Link>
  )
}

function Legend({ warningDays }) {
  // המספר במקרא דינמי מ-params, לא מועתק-קשיח מהמוקאפ (ששם "14" קבוע) — אחרת שינוי-פרמטר
  // עתידי (event_warning_days) היה משאיר מקרא שקרי. סף לא-נטען ⇒ נוסח כללי בלי מספר.
  // ניסוח (הערת-ישי בשער 3.4, 03/09/2026): תוויות-מקרא הן צירופי-שם קצרים, לא משפטים —
  // מעבר-הניסוח של src/CLAUDE.md. ההסבר הקצר לאייקונים נשאר, כפריט אחד ולא כמשפט על כל אייקון.
  const soonLabel = warningDays != null ? `חוסר בתוך ${warningDays} יום` : 'חוסר קרוב'
  const laterLabel = warningDays != null ? `חוסר מעבר ל-${warningDays} יום` : 'חוסר רחוק'
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
      <LegendSwatch className={SWATCH_CLASS.red} label={soonLabel} />
      <LegendSwatch className={SWATCH_CLASS.yellow} label={laterLabel} />
      <LegendSwatch className={SWATCH_CLASS.green} label="ללא חוסר" />
      {/* מבוטל: צבע-לוח רביעי (הכרעת-ישי 03/09, אחרי אישור-המוקאפ) — לא מופיע במוקאפ הסטטי,
          נוסף כאן כדי שהמקרא יישאר נאמן לצ'יפי-הסינון שמעליו. */}
      <LegendSwatch className={SWATCH_CLASS.cancelled} label="מבוטל" />
      {/* 🐞 **תוקן 04/09/2026 — ישי תפס את זה במקרא, והלוח עצמו היה תקין כל הזמן.**
          קודם עמדו כאן שלושה פריטים שהשתמשו ב-`StaffingIcon` **שלוש פעמים**: "איוש",
          "לוגיסטיקה" (עם אייקון-קופסה) ואז "הושלם · חסר" — שוב עם אייקון-דיילת. התוצאה:
          המסך הראה שלושה אייקוני-דיילת, **ולסימול-החסר של הלוגיסטיקה לא היה ייצוג כלל**,
          כך שקורא לא יכול היה לדעת איך נראית לוגיסטיקה חסרה. שני צמדים סימטריים — מלא
          וקו לצד כל אחד מהם — אומרים את שני הממדים בבת-אחת ובלי לתאר אחד מהם בעזרת השני. */}
      <span className="flex items-center gap-1">
        <StaffingIcon filled />
        <StaffingIcon filled={false} /> איוש
      </span>
      <span className="flex items-center gap-1">
        <LogisticsIcon filled />
        <LogisticsIcon filled={false} /> לוגיסטיקה
      </span>
      <span>מלא = הושלם · קו = חסר</span>
    </div>
  )
}

function LegendSwatch({ className, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn('inline-block size-2.5 rounded-full', className)} />
      {label}
    </span>
  )
}
