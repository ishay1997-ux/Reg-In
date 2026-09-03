// S3 — פאנל "התאמת דיילות" (Smart Match), מודול 9 (צעד 3.3, מוקאפ
// docs/mockups/settings-screen/02_params_tab_roles_and_states.html סעיפים 2 (CEO) ו-6 (בעלים).
// מתחבר דרך `ParamsTab`/`MySettingsPage` בעזרת `paneComponents.smart_match` (חוזה-הפרופס
// נקבע ב-`ParamsTab.jsx`): `{ rows, values, onChange, canEdit, errors }` — `canEdit` היא
// **פונקציה** `(row) => boolean` (§4.4, פר-שורה כי בעלות היא פר-שורה). `variant` הוא תוספת
// של הפאנל הזה בלבד (§6 צעד 3.3): 'ceo' (הלשונית המלאה) או 'owner' ("ההגדרות שלי" של מנהלת
// הגיוס) — קובע רק את נוסח-האזהרה (§3.7); שאר הפאנל זהה בשני המצבים (המוקאפ §2/§6 מציירים
// אותה טבלה).
//
// 🔴 **כללי-הרוחב (V-4, §2.8) לא מחושבים כאן מחדש:**
// · פס-הסכום קורא ל-`weightsSumOk` (אותה פונקציה שמפעילה `useParamsForm`, לא שכפול-סבילות).
// · כלל-הסדר (גולפוסט ≤ שער) כבר יושב כ-hint נעול על שורת-הגולפוסט במרשם (§3.7 "rule text
//   under the goalpost row") ומוצג אוטומטית דרך `ParamRow` — לא טקסט נוסף כאן, כדי ששני
//   מקורות לאותו משפט לא יסטו בשקט.
// · הודעות-השגיאה של כללי-הרוחב עצמן (`WEIGHTS_SUM_ERROR`/`DISTANCE_ORDER_ERROR`) כבר
//   מוצגות ע"י `ParamsTab` (`form.crossFieldErrors`, מתחת לפאנל) — הפאנל הזה רק מציג את
//   מצב-הפס (ירוק/ענבר), לא חוזר על ההודעה.
//
// 🧩 **כלל-השורה-החלקית (§6 צעד 3.3):** אם אחת משתי שורות-המרחק חסרה מ-`rows` — כל בלוק
// המרחקים מוסתר, לעולם לא חצי-מרונדר (שורת-מרחק בודדת בלי בת-הזוג שלה חסרת-משמעות: אין
// לדעת אם מרחק-הפסילה גדול או קטן ממרחק-הציון-0).
//
// 🔢 שני מספרים במשפט עברי אחד ("N שורות-נוכחות מתוך M שיבוצים") — כל אחד מבודד לחוד
// ב-`<Ltr>`, בדיוק כמו "שינית N מתוך M" ב-`SaveRow` (src/CLAUDE.md, מופע-הרצף התשיעי:
// שני מספרים *צמודים* נשברים; כאן הם אינם צמודים, כל אחד לחוד הוא הפתרון).

import { useEffect, useMemo, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import Ltr from '@/components/Ltr'
import { cn } from '@/lib/utils'
import { getParamEntry, parseForDisplay, weightsSumOk } from '@/lib/paramsRegistry'
import { activeWeights } from '@/lib/smartMatch'
import { SMART_MATCH_PARAM_NAMES } from '@/lib/smartMatch'
import { countAttendanceRows } from '@/modules/09_settings/api'
import ParamRow, {
  PARAMS_TABLE_CLASS,
  ParamsTableHead,
} from '@/modules/09_settings/components/ParamRow'

const WEIGHT_NAMES = [
  SMART_MATCH_PARAM_NAMES.responsivenessWeight,
  SMART_MATCH_PARAM_NAMES.reliabilityWeight,
  SMART_MATCH_PARAM_NAMES.proximityWeight,
]
const GATE_NAME = SMART_MATCH_PARAM_NAMES.gateDistanceKm
const GOALPOST_NAME = SMART_MATCH_PARAM_NAMES.goalpostDistanceKm
const RELIABILITY_NAME = SMART_MATCH_PARAM_NAMES.reliabilityEnabled

// משפטי-האזהרה נעולים (§3.7) — מילה-במילה, לא מנוסחים כאן. המשפט הראשון של נוסח-המנכ"ל
// מודגש במוקאפ (§2, .danger-note b) — שאר הנוסח נגזר מהמחרוזת המלאה כדי שלא יהיו שני
// מקורות לאותו טקסט.
const CEO_WARNING_LEAD = 'שינוי כאן משנה שיבוצים אמיתיים.'
const CEO_WARNING =
  CEO_WARNING_LEAD +
  ' הדירוג שמנהלת השיבוץ תראה מחר ייראה אחרת, והיא לא תדע שמשהו השתנה. שינוי כדאי לתאם איתה מראש.'
const OWNER_WARNING = 'שינוי כאן משנה את הדירוג שתראי מחר במסך השיבוץ.'

// 🔤 הערת-הנוכחות (סקירת-UX 03/09/2026, מעבר-הניסוח): המספרים חיים תמיד, אבל **המקרה של
// שורה בודדת אינו "1 שורות-נוכחות"** — הוא המקרה שבו ההודעה צריכה גם לומר *למה זה משנה*,
// כי מנהלת שרואה מספר בלי פרשנות אינה יודעת אם 1 מתוך 27 זה הרבה או מעט. הנוסח זהה בשני
// הווריאנטים (מנכ"ל/בעלים) — זו עובדה על הדאטה, לא על מי שמסתכלת.
function renderAttendanceNote({ withAttendance, total }) {
  if (withAttendance === 1) {
    return (
      <>
        שורת-נוכחות אחת בלבד מתוך <Ltr>{total}</Ltr> שיבוצים — עדיין אין מספיק נתונים כדי שהמרכיב
        הזה ישנה משהו
      </>
    )
  }
  return (
    <>
      <Ltr>{withAttendance}</Ltr> שורות-נוכחות מתוך <Ltr>{total}</Ltr> שיבוצים
    </>
  )
}

export default function SmartMatchPane({
  rows,
  values,
  onChange,
  canEdit,
  errors,
  variant = 'ceo',
}) {
  const list = rows ?? []
  const rowsByName = new Map(list.map((row) => [row.param_name, row]))

  const weightRows = WEIGHT_NAMES.map((name) => rowsByName.get(name)).filter(Boolean)
  const gateRow = rowsByName.get(GATE_NAME)
  const goalpostRow = rowsByName.get(GOALPOST_NAME)
  const showDistanceBlock = Boolean(gateRow && goalpostRow)
  const reliabilityRow = rowsByName.get(RELIABILITY_NAME)

  const excludedNames = new Set([...WEIGHT_NAMES, GATE_NAME, GOALPOST_NAME, RELIABILITY_NAME])
  const otherRows = list.filter((row) => !excludedNames.has(row.param_name))

  const weightSum = WEIGHT_NAMES.reduce((total, name) => {
    const n = Number(values?.[name])
    return total + (Number.isFinite(n) ? n : 0)
  }, 0)
  const sumOk = weightsSumOk(WEIGHT_NAMES.map((name) => values?.[name]))

  // 🔴 **המשקל שמוצג אינו המשקל שפועל — וזה מה שהשורה הזו אומרת** (הערת-ישי 03/09/2026,
  // מצילום-מסך). מרכיב כבוי יוצא מהסכום ו-`activeWeights` מנרמלת את הנותרים ל-1.00, כך
  // שעם אמינות כבויה ‏0.40/0.30/0.30 פועלים בתור **57%/43%**. המסך הראה שלושה מספרים
  // סטטיים שאף אחד מהם אינו המשקל בפועל.
  // 🔑 **ולמה זה נגזר מהפער ולא מהמתג** *(הכרעה משותפת של שני הסשנים)*: קישור למתג-האמינות
  // מקבע הנחה שההערה ב-`smartMatch.js:122-127` מזהירה מפניה במפורש — היא אומרת ש-`0.62/0.38`
  // הוא "המחשה, לא קבוע", ושמימוש שיקודד אותו **"נשבר ביום שמ6 ידליק את מרכיב-האמינות"**.
  // ⇒ השורה נגזרת מהשוואת `activeWeights` למשקולות הגולמיות, ולכן היא נכונה מאליה גם ביום
  // שמרכיב שני ייעשה ניתן-לכיבוי. **ומוצגת רק כשיש פער** — כשאין, המספרים שבטבלה *הם*
  // הפועלים, ושורה נוספת היא רעש.
  // 🛡️ `activeWeights` זורקת על סכום לא-חיובי (מצב-עריכה לגיטימי, למשל אפסים באמצע הקלדה)
  // ולכן היא עטופה — פאנל-הגדרות לעולם לא יקרוס בגלל ערך-ביניים.
  const effectiveWeights = useMemo(() => {
    const raw = {
      responsivenessWeight: Number(values?.[SMART_MATCH_PARAM_NAMES.responsivenessWeight]),
      reliabilityWeight: Number(values?.[SMART_MATCH_PARAM_NAMES.reliabilityWeight]),
      proximityWeight: Number(values?.[SMART_MATCH_PARAM_NAMES.proximityWeight]),
      reliabilityEnabled: String(values?.[RELIABILITY_NAME]) === 'true',
    }
    if (!Object.values(raw).slice(0, 3).every(Number.isFinite)) return null
    let active
    try {
      active = activeWeights(raw)
    } catch {
      return null
    }
    // פער אמיתי בלבד — השוואה בסובלנות של אחוז שלם, כי זה מה שמוצג.
    const differs = [
      [active.responsiveness, raw.responsivenessWeight],
      [active.reliability, raw.reliabilityWeight],
      [active.proximity, raw.proximityWeight],
    ].some(([a, b]) => Math.round(a * 100) !== Math.round(b * 100))
    if (!differs) return null
    return active
  }, [values])

  // מונה-הנוכחות החי (A-10) — נטען פעם אחת בעלייה; אין רף מינימלי מקודד (§6 צעד 3.3:
  // "no hard-coded minimum, none was ruled") — רק המספרים כפי שהם.
  const [attendance, setAttendance] = useState(null)
  const [attendanceError, setAttendanceError] = useState('')

  useEffect(() => {
    let cancelled = false
    countAttendanceRows()
      .then((counts) => {
        if (!cancelled) setAttendance(counts)
      })
      .catch(() => {
        if (!cancelled) setAttendanceError('לא ניתן לטעון את נתוני הנוכחות.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const reliabilityEntry = getParamEntry(RELIABILITY_NAME)

  function renderRow(row) {
    return (
      <ParamRow
        key={row.param_name}
        row={row}
        value={values?.[row.param_name]}
        onChange={onChange}
        canEdit={canEdit(row)}
        error={errors?.[row.param_name]}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4" data-testid="settings-smartmatch-pane">
      <div
        className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] leading-relaxed text-amber-800"
        data-testid={
          variant === 'owner' ? 'settings-smartmatch-warning-owner' : 'settings-smartmatch-warning'
        }
      >
        {variant === 'owner' ? (
          <b>{OWNER_WARNING}</b>
        ) : (
          <>
            <b>{CEO_WARNING_LEAD}</b>
            {CEO_WARNING.slice(CEO_WARNING_LEAD.length)}
          </>
        )}
      </div>

      <div
        className={cn(
          'flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm font-semibold',
          sumOk
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-amber-200 bg-amber-50 text-amber-800',
        )}
        data-testid="settings-smartmatch-weights-sum"
      >
        {/* 🔴 **ניסוח-כלל ולא ניסוח-הצהרה** (ממצא UX-4, אודיט-סגירת מ9 03/09/2026): הנוסח
            הקודם — "מסתכמות ל-1.00" — נרנדר **ללא תנאי**, כלומר גם כשהתג שלידו הראה 1.50.
            המסך הצהיר דבר שהמספר שצמוד אליו הפריך. ⚠️ **וזו עריכה של מחרוזת נעולה ב-§3.7,
            במכוון:** הנעילה קיימת כדי למנוע דריפט, לא כדי לשמר טעות. ‏§3.7 עודכן באותו שינוי. */}
        <span>
          שלוש המשקולות חייבות להסתכם ל-<Ltr>1.00</Ltr>
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            sumOk ? 'bg-green-100 text-green-700' : 'bg-amber-200 text-amber-800',
          )}
          data-testid="settings-smartmatch-weights-sum-tag"
        >
          {sumOk ? 'תקין' : <Ltr>{weightSum.toFixed(2)}</Ltr>}
        </span>
      </div>

      {effectiveWeights && (
        <p
          className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-600"
          data-testid="settings-smartmatch-effective-weights"
        >
          <span className="font-semibold text-slate-700">בפועל כרגע:</span> היענות{' '}
          <Ltr>{Math.round(effectiveWeights.responsiveness * 100)}%</Ltr> · קרבה{' '}
          <Ltr>{Math.round(effectiveWeights.proximity * 100)}%</Ltr> — מרכיב שכבוי יוצא מהחישוב,
          והנותרים מתחלקים ביניהם.
        </p>
      )}

      <table className={PARAMS_TABLE_CLASS} data-testid="settings-smartmatch-table">
        <ParamsTableHead />
        <tbody>
          {weightRows.map(renderRow)}
          {/* סדר-המוקאפ (§2/§6): שער (פסילה) לפני גולפוסט (ציון⇒0) — כלל-הסדר עצמו יושב
              כ-hint על שורת-הגולפוסט (§3.7). */}
          {showDistanceBlock && [gateRow, goalpostRow].map(renderRow)}
          {otherRows.map(renderRow)}
        </tbody>
      </table>

      {reliabilityRow && (
        <div
          className="flex items-center justify-between gap-3.5 rounded-lg border border-slate-200 bg-white p-3"
          data-testid="settings-smartmatch-reliability-row"
        >
          <div>
            <div className="text-[13.5px] font-semibold text-slate-800">
              {reliabilityEntry.label}
            </div>
            <div
              className="mt-0.5 text-xs text-amber-800"
              data-testid="settings-smartmatch-attendance-note"
            >
              {attendanceError
                ? attendanceError
                : attendance
                  ? renderAttendanceNote(attendance)
                  : 'טוען נתוני נוכחות…'}
            </div>
          </div>
          <Switch
            checked={parseForDisplay(reliabilityEntry, values?.[RELIABILITY_NAME]) === true}
            disabled={!canEdit(reliabilityRow)}
            onCheckedChange={(next) => onChange(RELIABILITY_NAME, next ? 'true' : 'false')}
            aria-label={reliabilityEntry.label}
            data-testid="settings-smartmatch-reliability-toggle"
          />
        </div>
      )}
    </div>
  )
}
