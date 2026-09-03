// "מי מתחת לשכר המינימום" — הרשימה שיושבת לצד `שכר_מינימום_שעתי` (מוקאפ סעיף 4).
// משלמת את החוב `🚧 מ9 ← מ4`: הטריגר `enforce_hostess_min_wage` חוסם **כתיבה** בלבד
// (§7.66), ולכן דיילת שתעריפה נקבע לפני שהרף עלה נשארת מתחתיו בלי שאיש רואה זאת.
//
// 🚦 **`blocked` ⇒ הרכיב לא מרנדר כלום — ולעולם לא `0`.** ‏`list_hostesses_below_min_wage`
// שומרת בעצמה (‏`assert_module_permission` ⇒ `42501`), ו-`api.js` ממפה את זה ל-
// `PARAMS_ERROR_CODE.BLOCKED`. הצגת "0 דיילות" למי שאינה רשאית לקרוא היא בדיוק השקר
// ש-`DENIED_MARK` נולד בשבילו (`src/CLAUDE.md`): אפס-שורות-בגלל-חסימה נקרא כעובדה.
// כאן אין מקום למונה מנוטרל — הפאנל כולו לא שייך למי שחסומה, ולכן הוא נעלם.
//
// 🕓 **הכותרת מציגה את הרף ה*שמור*, לא את מה שהוקלד בשדה — אלא אם `draftThreshold` פעיל.**
// 🆕 **תצוגה-מקדימה (מיגרציה D, הוראת-אורקסטרטור בגל 2):** `draftThreshold` הוא הערך שעל
// המסך *עכשיו* (`form.values[MIN_WAGE_PARAM]`, לפני שמירה). כשהוא שונה מ-`threshold` השמור
// ומתפרסר כמספר סופי — אחרי דמדום (debounce) של כ-400ms כדי לא לירות שאילתה על כל הקשה —
// הרשימה נשלפת מול הערך המוקלד (‏`listBelowMinWage(previewValue)`, מיגרציה D: `p_threshold`),
// והכותרת מוסיפה "תצוגה מקדימה — טרם נשמר". כשהטיוטה שווה לשמור (או אחרי שמירה, ש-
// `refreshKey` מסמנת) — חוזרים ל-`listBelowMinWage()` הרגילה, בלי הערה. `String(...)` משני
// הצדדים של ההשוואה כי `param_value` הוא טקסט (§2.9) — השוואה מספרית-ישירה הייתה מפספסת
// "35" מול "35.0" כשונים-אך-זהים-ערכית, או ההפך.
// כשאין `draftThreshold` כלל (קורא ישן, לפני התוספת) — ההתנהגות זהה-בייט לקודם.

import { useEffect, useState } from 'react'
import Money from '@/components/Money'
import LoadingOrError from '@/components/LoadingOrError'
import { listBelowMinWage, PARAMS_ERROR_CODE } from '@/modules/09_settings/api'

const PREVIEW_DEBOUNCE_MS = 400

export default function BelowMinWageList({ threshold, draftThreshold, refreshKey = 0 }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState(false)
  const [error, setError] = useState('')

  const previewValue = Number(draftThreshold)
  const isPreviewing =
    draftThreshold != null &&
    String(draftThreshold).trim() !== '' &&
    String(draftThreshold) !== String(threshold ?? '') &&
    Number.isFinite(previewValue)

  // `activeThreshold`: `null` = "השתמשי ברף השמור" · מספר = הרף-המוקדם-בדמדום שכבר יציב.
  // הדמדום חל רק בכניסה לתצוגה-מקדימה; היציאה ממנה (חזרה לשווה-לשמור) היא מיידית — אין
  // סיבה לחכות 400ms כדי לחזור למה שכבר ידוע.
  const [activeThreshold, setActiveThreshold] = useState(null)

  useEffect(() => {
    if (!isPreviewing) {
      // יציאה מתצוגה-מקדימה חייבת להיות מיידית (לא מדומדמת) — אין שום דמדום-חוזר-בזמן
      // שהמשתמשת מחכה לו כדי לראות את הרף השמור שהיא כבר ראתה קודם.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- איפוס מיידי, לא דמדום; ר' ההערה למעלה.
      setActiveThreshold(null)
      return
    }
    const timer = setTimeout(() => setActiveThreshold(previewValue), PREVIEW_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [isPreviewing, previewValue])

  useEffect(() => {
    let cancelled = false
    // טעינה בעלייה/בכל שינוי-סף — `loadData` מדליק `setLoading` כחיווי (אותו דפוס כמו
    // `ParamsTab.loadData`).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ר' ההערה למעלה.
    setLoading(true)
    ;(async () => {
      try {
        const data = await listBelowMinWage(activeThreshold ?? undefined)
        if (cancelled) return
        setRows(data)
        setBlocked(false)
        setError('')
      } catch (err) {
        if (cancelled) return
        if (err.code === PARAMS_ERROR_CODE.BLOCKED) setBlocked(true)
        else setError(err.message || 'שגיאה בטעינת רשימת הדיילות מתחת לשכר המינימום.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeThreshold, refreshKey])

  if (blocked) return null

  const headingThreshold = activeThreshold != null ? activeThreshold : threshold

  return (
    <aside
      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
      data-testid="settings-below-min-wage"
    >
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        מי מתחת לשכר המינימום
        {headingThreshold != null && headingThreshold !== '' && (
          <>
            {' ('}
            <Money amount={headingThreshold} exact />
            {')'}
          </>
        )}
      </h3>

      {activeThreshold != null && (
        <p
          className="mb-2 text-[11px] text-amber-800"
          data-testid="settings-below-min-wage-preview"
        >
          תצוגה מקדימה — טרם נשמר
        </p>
      )}

      {loading || error ? (
        <LoadingOrError loading={loading} error={error} />
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500" data-testid="settings-below-min-wage-empty">
          אין דיילות פעילות מתחת לרף הנוכחי
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li
              key={row.hostess_id}
              className="flex items-center justify-between gap-3 text-xs text-slate-700"
              data-testid="settings-below-min-wage-row"
            >
              <span>{row.full_name}</span>
              <Money amount={row.hourly_rate} exact />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
