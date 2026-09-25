// לשונית דיילות — שלושת המשטחים מ14 · מ15 · מ17 (צעד 3.3; מ16 הוסר מהממשק 24/09/2026).
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
// ③ ✂️ מ16 (ושבב "בלי דירוג בלבד" + כיבוי-הסינון-הצולב שלו) הוסר מהממשק 24/09/2026.
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
  filterRows,
  fixResponseTimeUnit,
  isActive,
  isFlagged,
  mapChartLabels,
} from './hostesses/payloadTransforms'

// 🔒 **אחד-עשר המפתחות של הלשונית** (✏️ 24/09/2026 — 14 ⇒ 11 עם הסרת מ16; ✏️ 23/09/2026 — היו 38; ששת המונחים בכל דף ירדו,
// ר׳ `onboardingCopy.m11.hostesses.js`). המפתחות עצמם מטבלאות §⑩ של ארבעת הכרטיסים.
// המוקאפים נושאים ארבע קונבנציות-סימון, ואף אחת מהן אינה הצורה שמגיעה לייצור.
// ⚠️ **מפתח שגוי מרנדר `null` בשקט** — ולכן הרשימה הזו היא גם מה שהבדיקה מייבאת ומוודאת
// מול `onboardingCopy.m11.hostesses.js`, מפתח-מפתח.
const HINTS = {
  // ✏️ 23/09/2026 — 3–4 רמזים לדף, כל אחד צמוד לרכיב שעליו השאלה (התוכנית §4ה, 2.1 · 2.3 · 2.10).
  // ‏`extras` = תחתית הדף, אחרי הטבלה — מה שיושב מתחת לטבלה-הנוספת (זמני-התגובה של מ17), ורמז שאין לו מקום
  // מעל בלי לשבור את 2.3 (≤4 רמזים בגובה-מסך). לא מילון-מונחים.
  'hostess-overview': {
    afterSoWhat: ['reports.hostessOverview.purpose'],
    beforeChart: ['reports.hostessOverview.redCount', 'reports.hostessOverview.topQuarter'],
    chartFooter: [],
    beforeTable: ['reports.hostessOverview.redTableSort'],
    // ✏️ 25/09/2026: ‏`gapEvents` — "למה באריח ארבעה ובמסך הדיילות יותר" (הכלל של ישי 02:2X: הסבר = רמז).
    //    ‏✏️ (הכרעת הסגן, ~04:3X): עבר מ-beforeChart לתחתית. 📏 נמדד ב-1536×900, מצב 2: חמשת הרמזים ישבו
    //    ב-431 · 606 · 630 · 1045 · 1069 פיקסלים — כולם בחלון אחד של 900 ⇒ 2.3 נפל. גם "לפני הטבלה" (1045)
    //    נשאר בחלון; רק אחרי הטבלה (שנגמרת ב-1357) הוא יוצא ממנו. התוכן לא השתנה.
    extras: ['reports.hostessOverview.gapEvents'],
  },
  reliability: {
    afterSoWhat: ['reports.reliability.purpose'],
    beforeChart: ['reports.reliability.scoreBasis'],
    chartFooter: [],
    beforeTable: ['reports.reliability.absenceColumns', 'reports.reliability.queuePopulation'],
    extras: [],
  },
  fairness: {
    afterSoWhat: ['reports.fairness.purpose'],
    beforeChart: [],
    chartFooter: ['reports.fairness.quartersBasis'],
    beforeTable: [],
    extras: ['reports.fairness.responseTime'],
  },
}

// מצב-השבבים ההתחלתי פר-משטח.
const DEFAULT_CHIPS = {
  'hostess-overview': {},
  reliability: { onlyFlag: false, onlyActive: false },
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
  fairness: () => 'הדיילות לפי מספר המשמרות בחלון · מהעמוסה',
}

// 🔍 **הסינון-הצולב של המעטפת, פר-משטח — נמדד ולא הונח** (סקריפט על המטענים החיים,
// 16/09 11:2X, שמריץ את `autoFilterKey` של `ReportSurface` מילה-במילה):
// ‏**מ14** `xKey='month'` · **מ15** `xKey='dow'` · **מ17** `xKey='x'` — אף אחד מהם אינו
// מפתח-שורה ⇒ הזיהוי מחזיר `null` וממילא אין סינון-צולב.
function transformFor(slug, payload, chips) {
  if (slug === 'reliability') {
    // מיפוי תוויות-הציר קודם לסינון: שתי הפעולות עצמאיות, והסדר נבחר כך שבורר-היום
    // ב-`renderTop` יקרא שמות-ימים ולא ספרות.
    let next = mapChartLabels(payload)
    if (chips.onlyFlag) next = filterRows(next, isFlagged)
    if (chips.onlyActive) next = filterRows(next, isActive)
    return next
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

// 🔤 נוסח-ההכרזה של בורר-היום. **הצורה מועתקת מ-📐9** (*"מסונן ל…; N שורות"*) ומ-
// `ReportSurface.announceSelection`, כדי ששתי ההכרזות במודול יישמעו אותו דבר.
// 🚫 **בלי תווי-בידוד, ובכוונה** — אותו נימוק שכתוב שם: הבידוד הוא תיקון **חזותי**, ויש
// קוראי-מסך שמכריזים את התו עצמו באזור שאיש אינו רואה.
function weekdayAnnouncement(payload, selectedDow) {
  const count = payload.rows.length
  const rows = count === 0 ? 'אין שורות' : count === 1 ? 'שורה אחת' : `${count} שורות`
  if (selectedDow === null) return `בחירת היום בוטלה; ${rows}`
  return `מסונן ליום ${WEEKDAY_NAMES_HE[selectedDow] ?? selectedDow}; ${rows}`
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
  const hints = HINTS[surface.slug] ?? {
    afterSoWhat: [],
    beforeChart: [],
    chartFooter: [],
    beforeTable: [],
    extras: [],
  }
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
          {/* 🔴 בורר-היום **חייב** הכרזה משלו (סבב 3, ממצא 6): הבחירה היא סיבוב-שרת
              שמחליף את כל ספירות-הטבלה, וללא הטקסט הזה קורא-מסך אינו שומע דבר —
              המעטפת ממלאת את אזור-הטבלה רק תחת סינון-צולב, שאינו קיים בלשונית הזו. */}
          <ChipRow
            label="יום בשבוע"
            chips={weekdayChips(payload, selectedDow, onDrill)}
            announcement={weekdayAnnouncement(payload, selectedDow)}
            testId="reports-chips-dow"
          />
        </>
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
      renderTop={(payload) => renderChips(payload)}
      // ✏️ ⑩א — **בין "אז מה" לאריחים**, החריץ שנולד בדיוק לזה (`fb7bcd26`). ארבעת רמזי-
      // ה-`purpose` ישבו ב-`renderTop`, כלומר **מעל שורת-האוכלוסייה שהם מסבירים** — היפוך
      // של `onboarding-layer-contract §4ב` ("שורה עצמאית **מתחת** לבלוק שהוא מסביר").
      renderAfterSoWhat={() => (
        <HintBlock ids={hints.afterSoWhat} testId="report-hints-after-so-what" />
      )}
      // רמזי-אריח (מ14 ב · ג) — מתחת לרצועת-האריחים ולפני הגרף, כפי שהיו.
      renderBeforeChart={() => <HintBlock ids={hints.beforeChart} testId="report-hints-chart" />}
      // ✏️ רמזי-**קריאת-גרף** יורדים אל תוך כרטיס-הגרף, מתחת לדמות (מ17 ב).
      // ‏`index === 0` כי לשני המשטחים האלה יש גרף אחד; משטח עם שניים היה חייב לבחור.
      renderChartFooter={(payload, index) =>
        index === 0 ? (
          <HintBlock ids={hints.chartFooter} testId="report-hints-chart-footer" />
        ) : null
      }
      renderBeforeTable={(payload) => (
        <>
          <h3
            className="mb-1.5 text-sm font-semibold text-slate-700"
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
