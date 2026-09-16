// לשונית דיילות — ארבעת המשטחים מ14 · מ15 · מ16 · מ17 (צעד 3.3).
// **המוקאפ:** `approved/04_tab_hostesses_approved.html` · **הכרטיסים:** `stage2-cards/cards-hostesses.md`.
//
// 🔑 **מה הקובץ הזה עושה, ומה הוא במפורש אינו:** ‏`ReportSurface` מצייר את **כל** מטען-C8
// גנרית — אוכלוסייה · ייצוא · אריחים · "אז מה" · גרף · טבלה · `meta.extra_tables` · הגדרות.
// ⇒ הלשונית **אינה מציירת אף אחד מהם מחדש**; היא ממלאת את ארבע נקודות-ההרחבה בלבד:
// ‏`transformPayload` (סינון-לקוח · מיפוי-תוויות · תיקון-יחידה) ו-`renderTop` /
// `renderBeforeChart` / `renderBeforeTable` / `renderExtras` (שכבת-ההטמעה, השבבים, כותרות-הטבלה).
//
// 🔴 **שלוש נקודות שכל קורא של הקובץ צריך מראש:**
// ① **אין דריל בלשונית הזו** (§9 D-14 · C8 מתוקן 16/09): קבוצת-הדריל היא מ3 · מ9 בלבד.
//    ‏`onDrill` כאן משמש לשניים: בחירת יום-בשבוע של מ15 (‏`p_drill` אמיתי בשרת), ו**דלתות**
//    — אריח עם `target` ושורה עם `drill_key` — שנתב-הדלתות של המעטפת מנתב (11f347a9).
// ② **מ17 מחזיר את זמני-התגובה בשעות ומכריז `days`** — ר' `payloadTransforms.js` · הדיווח.
// ③ **הסינון-הצולב של מ16 כבוי מפורשות** (`disableCrossFilter`): הזיהוי-האוטומטי של
//    המעטפת תופס שם `hourly_rate`, וסינון-לפי-תעריף אינו המשמעות של הדף. ר' הנימוק בשם.
// ✏️ **16/09 11:2X — שלוש עקיפות שהיו כאן נמחקו כי השכבה המשותפת סגרה אותן:** ‏`KpiTile`
//    מרנדר עכשיו `tiles[].sub` ו-`compare.note` ומעצב את חצי-ההשוואה דרך
//    `compare.format ?? tile.format` ⇒ `inheritCompareFormat` נמחקה · שורת-תקרת-השורות
//    ו-`so_what` מעל האריחים הן של המעטפת ⇒ מעולם לא נבנו כאן.

import { useCallback, useMemo, useState } from 'react'
import { WEEKDAY_NAMES_HE } from '@/lib/dates'
import { isolateLtr } from '@/lib/reportsFormat'
import ReportSurface from '../components/ReportSurface'
import ChipRow from './hostesses/ChipRow'
import HintBlock from './hostesses/HintBlock'
import {
  disableCrossFilter,
  filterRows,
  fixResponseTimeUnit,
  hasNoRating,
  isActive,
  isFlagged,
  mapChartLabels,
} from './hostesses/payloadTransforms'

// 🔒 **שלושים ושמונה המפתחות של הלשונית, מועתקים מטבלאות §⑩ של ארבעת הכרטיסים** — ארבעה
// עוגנים במ14/מ15 ושלושה במ16/מ17, ועוד שישה מונחים בכל דף. 🚫 **לא מהמוקאפ**: ארבעת
// המוקאפים נושאים ארבע קונבנציות-סימון, ואף אחת מהן אינה הצורה שמגיעה לייצור.
// ⚠️ **מפתח שגוי מרנדר `null` בשקט** — ולכן הרשימה הזו היא גם מה שהבדיקה מייבאת ומוודאת
// מול `onboardingCopy.m11.hostesses.js`, מפתח-מפתח.
const HINTS = {
  'hostess-overview': {
    top: ['reports.hostessOverview.purpose'],
    beforeChart: ['reports.hostessOverview.redCount', 'reports.hostessOverview.gini'],
    beforeTable: ['reports.hostessOverview.redTableSort'],
    extras: [
      'reports.hostessOverview.term.onTime',
      'reports.hostessOverview.term.redHostess',
      'reports.hostessOverview.term.gini',
      'reports.hostessOverview.term.activeHostess',
      'reports.hostessOverview.term.gapEvent',
      'reports.hostessOverview.term.missingMonth',
    ],
  },
  reliability: {
    top: ['reports.reliability.purpose'],
    beforeChart: [],
    beforeTable: ['reports.reliability.absenceColumns'],
    extras: [
      'reports.reliability.scoreBasis',
      'reports.reliability.queuePopulation',
      'reports.reliability.term.score',
      'reports.reliability.term.noShow',
      'reports.reliability.term.latenessLevels',
      'reports.reliability.term.withdrew',
      'reports.reliability.term.frozenWindow',
      'reports.reliability.term.scoreVisibility',
    ],
  },
  'quality-cost': {
    top: ['reports.qualityCost.purpose'],
    beforeChart: ['reports.qualityCost.scatterBasis'],
    beforeTable: ['reports.qualityCost.tableSort'],
    extras: [
      'reports.qualityCost.term.hourlyRate',
      'reports.qualityCost.term.rating',
      'reports.qualityCost.term.median',
      'reports.qualityCost.term.clientMarks',
      'reports.qualityCost.term.quadrants',
      'reports.qualityCost.term.noRatingBand',
    ],
  },
  fairness: {
    top: ['reports.fairness.purpose'],
    beforeChart: ['reports.fairness.giniBasis'],
    beforeTable: [],
    extras: [
      'reports.fairness.responseTime',
      'reports.fairness.term.gini',
      'reports.fairness.term.lorenz',
      'reports.fairness.term.shift',
      'reports.fairness.term.responseTime',
      'reports.fairness.term.p90',
      'reports.fairness.term.rank1',
    ],
  },
}

// מצב-השבבים ההתחלתי פר-משטח. 🔴 **`onlyNoRating` דלוק כברירת-מחדל** — הכרטיס ①7 והמוקאפ
// (`state.onlyNoRating = true`, שורה 1423), וגם השרת מצהיר זאת ב-`meta.default_filter`.
const DEFAULT_CHIPS = {
  'hostess-overview': {},
  reliability: { onlyFlag: false, onlyActive: false },
  'quality-cost': { onlyNoRating: true },
  fairness: {},
}

// 🔤 כותרות-הטבלה של המוקאפ (`h3` מעל כל `.tbl-card`). ‏`ReportTable` אינו נושא כותרת גלויה
// — רק `<caption class="sr-only">` — ולכן בלי השורה הזו הטבלה מגיעה למסך בלי שם.
// 🔴 **והמספר נגזר מהשורות שנשארו ולא מוקלד** (📐8): טבלת-האדומות היא "כל השש" רק כל עוד
// שש הן, ומחר זה מספר אחר.
const TABLE_TITLES = {
  'hostess-overview': (payload) =>
    payload.rows.length === 0
      ? 'אין דיילות מתחת לסף'
      : `${isolateLtr(payload.rows.length)} הדיילות האדומות · מיון לפי ציון-אמינות, מהנמוך`,
  reliability: () => 'דיילות לפי ציון-אמינות · מהנמוך לגבוה',
  'quality-cost': (payload, chips) =>
    chips.onlyNoRating
      ? 'הדיילות הפעילות שאין להן דירוג · מיון לפי משמרות, מהעמוסה'
      : 'כל הדיילות הפעילות · מיון לפי משמרות, מהעמוסה',
  fairness: () => 'הדיילות לפי מספר המשמרות בחלון · מהעמוסה',
}

// 🔍 **הסינון-הצולב של המעטפת, פר-משטח — נמדד ולא הונח** (סקריפט על ארבעת המטענים החיים,
// 16/09 11:2X, שמריץ את `autoFilterKey` של `ReportSurface` מילה-במילה):
// ‏**מ14** `xKey='month'` · **מ15** `xKey='dow'` · **מ17** `xKey='x'` — אף אחד מהם אינו
// מפתח-שורה ⇒ הזיהוי מחזיר `null` וממילא אין סינון-צולב. **מ16** `xKey='hourly_rate'` —
// **כן** מפתח-שורה, והערכים נפגשים ⇒ הזיהוי תופס, ולכן הוא מכובה במפורש.
function transformFor(slug, payload, chips) {
  if (slug === 'reliability') {
    // מיפוי תוויות-הציר קודם לסינון: שתי הפעולות עצמאיות, והסדר נבחר כך שבורר-היום
    // ב-`renderTop` יקרא שמות-ימים ולא ספרות.
    let next = mapChartLabels(payload)
    if (chips.onlyFlag) next = filterRows(next, isFlagged)
    if (chips.onlyActive) next = filterRows(next, isActive)
    return next
  }
  if (slug === 'quality-cost') {
    const next = disableCrossFilter(payload)
    return chips.onlyNoRating ? filterRows(next, hasNoRating) : next
  }
  if (slug === 'fairness') return fixResponseTimeUnit(payload)
  return payload
}

// בורר יום-בשבוע של מ15 — **הימים נגזרים מנתוני-הגרף עצמם** ולא מרשימה קשיחה: במסד אין
// אירועים בשבת, ורשימה קבועה הייתה מציעה יום ריק. ‏`indexOf` מחזיר את ה-`dow` המספרי
// שה-`p_drill` צריך, אחרי שהתווית כבר מופתה לעברית.
function weekdayOptions(payload) {
  const chart = Array.isArray(payload.chart) ? payload.chart[0] : payload.chart
  if (!chart?.data || chart.label_source !== 'WEEKDAY_NAMES_HE') return []
  const xKey = chart.xKey ?? 'x'
  return chart.data
    .map((row) => ({ label: String(row[xKey]), value: WEEKDAY_NAMES_HE.indexOf(row[xKey]) }))
    .filter((option) => option.value >= 0)
}

function reliabilityChips(chips, setChip) {
  return [
    {
      key: 'onlyFlag',
      text: 'אדומות וענבר בלבד',
      on: chips.onlyFlag,
      onToggle: () => setChip('onlyFlag', !chips.onlyFlag),
    },
    {
      key: 'onlyActive',
      text: 'פעילות בלבד',
      on: chips.onlyActive,
      onToggle: () => setChip('onlyActive', !chips.onlyActive),
    },
  ]
}

// ⚠️ **בחירת-היום היא סיבוב-שרת ולא סינון-לקוח, וזה מכוון:** ‏`report_m15_reliability`
// מחליף במצב-יום את ספירות-החלון בספירות אותו יום (⑧15.1) — דבר שהלקוח אינו יכול לגזור.
// ⇒ היא נוסעת ב-`p_drill` דרך הכתובת (`onDrill`), וכך גם "חזור" וגם שיתוף-קישור עובדים.
function weekdayChips(payload, selectedDow, onDrill) {
  const chips = weekdayOptions(payload).map((option) => ({
    key: `dow-${option.value}`,
    text: option.label,
    on: selectedDow === option.value,
    onToggle: () => onDrill(selectedDow === option.value ? null : { dow: option.value }),
  }))
  if (selectedDow === null) return chips
  // 🔤 `נקי בחירה` — צורת-הבית בנקבה, 4/4 אתרי-קריאה חיים (`spec.md §1.5`).
  return [
    ...chips,
    { key: 'clearDow', text: '× נקי בחירה', on: false, onToggle: () => onDrill(null) },
  ]
}

export default function HostessesTab({ surface, filters, drill, onDrill, onWindow }) {
  // 🔑 **מצב-השבבים נגזר-ומאופס-בזמן-רינדור ולא ב-effect** — אותו דפוס בדיוק כמו `pageState`
  // ב-`ReportSurface`, ומאותו נימוק: שבב של דף אחד אינו קיים בדף אחר, ואיפוס ב-effect היה
  // מצייר סבב אחד עם המצב הישן.
  const [chipState, setChipState] = useState({
    slug: surface.slug,
    value: DEFAULT_CHIPS[surface.slug] ?? {},
  })
  // 🔴 **`useMemo` ולא ביטוי-תנאי חשוף, וזה לא ניקיון:** ‏`chips` נכנס למערך-התלויות של
  // ה-`transformPayload` שלמטה, וביטוי-תנאי מייצר אובייקט **חדש בכל רינדור** כשהמשטח
  // התחלף ⇒ הזהות משתנה, המימואיזציה של `ReportSurface` מתבטלת בשקט, והטרנספורמציה רצה
  // מחדש על כל רינדור. ‏`react-hooks/exhaustive-deps` סימן בדיוק את זה.
  const chips = useMemo(
    () => (chipState.slug === surface.slug ? chipState.value : (DEFAULT_CHIPS[surface.slug] ?? {})),
    [chipState, surface.slug],
  )
  const setChip = (key, value) =>
    setChipState({ slug: surface.slug, value: { ...chips, [key]: value } })

  const selectedDow = Number.isInteger(drill?.dow) ? drill.dow : null
  const hints = HINTS[surface.slug] ?? { top: [], beforeChart: [], beforeTable: [], extras: [] }
  const transformPayload = useCallback(
    (payload) => transformFor(surface.slug, payload, chips),
    [surface.slug, chips],
  )

  const renderChips = (payload) => {
    if (surface.slug === 'reliability') {
      return (
        <>
          <ChipRow
            label="מסנני-דף"
            chips={reliabilityChips(chips, setChip)}
            announcement={`מוצגות ${isolateLtr(payload.rows.length)} שורות`}
            testId="reports-chips-reliability"
          />
          <ChipRow
            label="יום בשבוע"
            chips={weekdayChips(payload, selectedDow, onDrill)}
            testId="reports-chips-dow"
          />
        </>
      )
    }
    if (surface.slug === 'quality-cost') {
      return (
        <ChipRow
          label="מסנני-דף"
          chips={[
            {
              key: 'onlyNoRating',
              text: 'בלי דירוג בלבד',
              on: chips.onlyNoRating,
              onToggle: () => setChip('onlyNoRating', !chips.onlyNoRating),
            },
          ]}
          announcement={`מוצגות ${isolateLtr(payload.rows.length)} שורות`}
          testId="reports-chips-quality-cost"
        />
      )
    }
    return null
  }

  return (
    <ReportSurface
      surface={surface}
      filters={filters}
      drill={drill}
      onDrill={onDrill}
      onWindow={onWindow}
      // 🔴 **זהות יציבה, ולא חץ-אינליין** — ‏`ReportSurface` ממואיז את התוצאה על
      // ‏`[rawPayload, transformPayload]` (‏11f347a9), ופונקציה חדשה בכל רינדור מבטלת את
      // המימואיזציה בשקט: הסינון היה רץ מחדש בכל הקלדה בכל פקד עתידי בדף.
      transformPayload={transformPayload}
      renderTop={(payload) => (
        <>
          <HintBlock ids={hints.top} testId="report-hints-top" />
          {renderChips(payload)}
        </>
      )}
      renderBeforeChart={() => <HintBlock ids={hints.beforeChart} testId="report-hints-chart" />}
      renderBeforeTable={(payload) => (
        <>
          <h3
            className="mb-1.5 text-[13px] font-semibold text-slate-700"
            data-testid="report-table-title"
          >
            {TABLE_TITLES[surface.slug]?.(payload, chips)}
          </h3>
          <HintBlock ids={hints.beforeTable} testId="report-hints-table" />
        </>
      )}
      renderExtras={() => <HintBlock ids={hints.extras} testId="report-hints-extras" />}
    />
  )
}
