// מ4 · **הנחות ורווחיות** — *"האם הנחות עמוקות שוחקות את הרווח?"* (`cards-management.md`, שורה 388 · `#p3`).
//
// 🔴 **הכרעה 39 — ארבעת המדרגים `0 · 1–5 · 6–10 · 10%+ (פתוח)` — נאמרת כאן פעמיים:** הגרף
// מצייר אותם, **ושורת-השבבים נותנת לכל אחד `n` צמוד** (📑ב#2: *"מדרג עם 4 הצעות נראה כמו
// מדרג עם 400"*). הגרף עצמו אינו נושא מונה מתחת לעמודה, ולכן בלי השבבים ה-`n` היה נעלם.
//
// 🔴 **ולמה שבבים ולא לחיצה על עמודת-הגרף, כפי שהמוקאפ צייר:** ‏`design-contract §⑤ #7`
// (‏Issues #1946/#4809) קובע ש-`onClick` על `<Bar>`/`<Cell>` **אינו** הופך לניתן-להפעלה
// במקלדת, והכרטיס עצמו מסמן זאת ①: *"בבנייה על Recharts זה `לא-אומת` עד מבחן-דפדפן ידני"*.
// ‏**שבב הוא `<button>` אמיתי** — טאב, Enter/Space ו-`aria-pressed` בלי שורת-קוד אחת של
// שקילות-מקלדת מדומה. הסינון עצמו זהה: הוא נוסע ב-`p_drill` ונחתך **בשרת**.

import { useMemo } from 'react'
import FilterPill from '@/components/FilterPill'
import { isolateLtr } from '@/lib/reportsFormat'
import ReportSurface from '../../components/ReportSurface'
import { ChartLead, SurfaceLead, TableLead } from './surfaceKit'
import {
  useSurfaceDoors,
  withCharts,
  withLabelAxis,
  withRowDoors,
  withTileSubRows,
} from './surfaceDoors'

// 🔤 מילה-במילה מהמוקאפ המאושר (`02_tab_executive_approved.html:896 · 909`).
// ‏`נקי` ולא `נקה` — ‏S-28 · `m11-copy-rules §4.2`, שהופרך ותוקן ב-17 מופעים ב-11/09/2026.
const ROW_ACTION = 'לחיצה על שורה פותחת את הצעת המחיר'
const CLEAR_LABEL = '× נקי בחירה'
const CHIPS_LABEL = 'סינון לפי מדרג-הנחה'

const chartOf = (payload) => (Array.isArray(payload.chart) ? payload.chart[0] : payload.chart)

function transformPayload(payload) {
  return withCharts(withTileSubRows(payload), (chart) => withLabelAxis(chart))
}

/**
 * שורת-השבבים + אזור-ההכרזה.
 * 📐9④ — **אזור ה-`aria-live` קיים בדף מראש וריק**, ואינו נוצר בלחיצה: אזור-חי שנולד
 * אחרי הפעולה אינו מוכרז כלל (אותה מדידה בדיוק שנכתבה ב-`ReportTable`).
 */
function TierChips({ payload, selected, onSelect }) {
  const tiers = chartOf(payload)?.data ?? []
  const current = tiers.find((tier) => tier.tier === selected)
  const shown = payload.meta?.row_total ?? payload.rows?.length ?? 0
  const announcement = current
    ? `מסונן למדרג ${current.label}; ${isolateLtr(shown.toLocaleString('he-IL'))} שורות מוצגות`
    : ''

  return (
    <div className="mb-2" data-testid="discount-tier-chips">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={CHIPS_LABEL}>
        {tiers.map((tier) => (
          <FilterPill
            key={tier.tier}
            on={tier.tier === selected}
            onClick={() => onSelect(tier.tier === selected ? null : tier.tier)}
            title={`${tier.event_count} אירועים במדרג`}
            testId={`discount-tier-${tier.tier}`}
          >
            {`${tier.label} · ${isolateLtr(Number(tier.event_count ?? 0).toLocaleString('he-IL'))}`}
          </FilterPill>
        ))}
        {current && (
          <FilterPill on={false} onClick={() => onSelect(null)} testId="discount-tier-clear">
            {CLEAR_LABEL}
          </FilterPill>
        )}
      </div>
      <p className="sr-only" aria-live="polite" data-testid="discount-tier-announce">
        {announcement}
      </p>
    </div>
  )
}

export default function DiscountsSurface({ surface, filters, drill, onDrill, onWindow }) {
  const openDoor = useSurfaceDoors(onDrill)
  // 🔑 **המדרג הנבחר חי בכתובת** ולא ב-`useState` (📐13④ · §4.2 של `CLAUDE.md`): קישור
  // לדוח מסונן ניתן לשליחה, ו"חזור" מחזיר את הבחירה במקום למחוק אותה.
  const selected = drill?.tier ?? null
  const rowDoorSurface = useMemo(() => withRowDoors(surface), [surface])

  return (
    <ReportSurface
      surface={rowDoorSurface}
      filters={filters}
      drill={drill}
      onDrill={openDoor}
      onWindow={onWindow}
      transformPayload={transformPayload}
      renderTop={(payload) => (
        <SurfaceLead hintId="reports.discounts.purpose">
          <TierChips
            payload={payload}
            selected={selected}
            onSelect={(tier) => onDrill(tier ? { tier } : null)}
          />
        </SurfaceLead>
      )}
      renderBeforeChart={() => (
        <ChartLead hintIds={['reports.discounts.approvalPopulation']} note={null} />
      )}
      renderBeforeTable={(payload) => (
        <TableLead payload={payload} rowAction={ROW_ACTION} hintId="reports.discounts.tierSort" />
      )}
    />
  )
}
