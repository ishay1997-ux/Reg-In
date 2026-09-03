// פאנל-הלוח של מסך-הבית: כותרת-חודש + סרגל-כלים (ניווט/היום/חיפוש/צ'יפי-צבע) + רשת 7×שבועות
// + מקרא. כל נגזרת (צבע/קיבוץ-לפי-תאריך/סינון/ספירה) מגיעה מ-src/lib/dashboard.js (כלל 14) —
// הרכיב מחזיק רק שני מצבים מקומיים ש"איך המסך נראה עכשיו" ולא מזוהי-כתובת (בניגוד לחודש
// המוצג, שכן ב-URL אצל ההורה): החיפוש וצ'יפי-הצבע הפעילים.
//
// 🔴 שתי תקלות-CSS שהמוקאפ המאושר נתפס בהן וישי תיקן (ר' פרומפט-המסירה): `grid-cols-7` של
// Tailwind הוא כבר `repeat(7,minmax(0,1fr))` בייט-לבייט (לא צריך ערך-שרירותי) — אבל
// `auto-rows-*` המוכן לא כולל `minmax(76px,auto)`, ולכן זה כן ערך-שרירותי.

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

      <div className="grid grid-cols-7 auto-rows-[minmax(76px,auto)] gap-[5px]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-[11px] font-semibold text-slate-400">
            {d}
          </div>
        ))}
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

function DayCell({ cell, today, projects }) {
  if (!cell.inMonth) return <div />
  const isToday = cell.date === today
  const shown = projects.slice(0, 2)
  const extra = projects.length - shown.length

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-[2px] rounded-lg border p-[3px] text-[11px] text-slate-500',
        isToday ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-200',
      )}
      data-testid={`dashboard-day-${cell.date}`}
    >
      <Ltr className="px-[2px] text-[11px] font-semibold text-slate-600">{String(cell.day)}</Ltr>
      {shown.map((project) => (
        <DayChip key={project.project_id} project={project} />
      ))}
      {extra > 0 && (
        <Link
          to="/projects"
          className="px-[3px] text-[10px] text-slate-400"
          data-testid={`dashboard-more-${cell.date}`}
        >
          {`+${extra} עוד`}
        </Link>
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
        'flex items-center gap-[3px] overflow-hidden rounded px-[3px] py-[1px] text-[10px] font-semibold',
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
  const soonLabel = warningDays != null ? `חוסר, בתוך ${warningDays} יום` : 'חוסר, קרוב'
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
      <LegendSwatch className={SWATCH_CLASS.red} label={soonLabel} />
      <LegendSwatch className={SWATCH_CLASS.yellow} label="חוסר, רחוק יותר" />
      <LegendSwatch className={SWATCH_CLASS.green} label="אין חוסר" />
      {/* מבוטל: צבע-לוח רביעי (§7.94, אחרי אישור-המוקאפ) — לא מופיע במוקאפ הסטטי, נוסף כאן
          כדי שהמקרא יישאר נאמן לצ'יפי-הסינון שמעליו. */}
      <LegendSwatch className={SWATCH_CLASS.cancelled} label="מבוטל — נשאר בלוח" />
      <span className="flex items-center gap-1">
        <StaffingIcon filled /> איוש
      </span>
      <span className="flex items-center gap-1">
        <LogisticsIcon filled /> לוגיסטיקה — מלא (צבוע) או חסר (מתאר בלבד)
      </span>
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
