// טיוטת-הערכים של מסך-ההגדרות — ה-hook המשותף לשלושת המשטחים של מודול 9 (הלשונית
// `ParamsTab`, "ההגדרות שלי", ופאנל ה-Smart Match). הוא יושב תחת `09_settings/components/`
// ולא ב-`src/components/` כי שלושת הצרכנים שלו חיים כולם במודול הזה (מדריך-המיקרו §10,
// רשומת 02/09 — "3 משטחים ⇒ משותף, אבל כולם במ9").
//
// 🔴 **למה טיוטה ולא כתיבה-ישירה-לשדה:** §2.8 מחייב ששגיאה בשדה אחד **לא תמחק את מה
// שהוקלד בשדות האחרים** (C5 §5.6.17.4). לכן הערך שנראה על המסך הוא תמיד
// `draft ?? saved ?? param_value` — שכבה שנמחקת רק בשמירה מוצלחת של אותה שורה, ולעולם
// לא בכשל של שורה אחרת.
//
// 🔒 **שתי שכבות-הרשאה בכוונה, ולא כפילות (V-9):** כאן מסננים לשורות שהמשתמשת רשאית
// לערוך **לפני** הכתיבה הראשונה, ו-`updateParams` (‏`api.js`) מסרבת בעצמה לכל שורה
// חורגת. הביטוי זהה בשלושת המקומות (§4.4: `canEditAll || owner_role_id === roleId`) —
// כלל אחד, לא שלושה ניסוחים שיכולים להתפצל בשקט.
//
// ⚠️ **כתיבה שורה-שורה ולא אצווה-אחת, וזו סטייה מודעת מ-§2.8** (מתועדת בדוח-הבנייה):
// המחרוזת הנעולה של הכשל היא `השמירה נכשלה ב"<label>" — <reason>`, כלומר **המסך חייב
// לנקוב בשם השורה שנכשלה**. קריאה אחת עם כל האצווה זורקת שגיאה אחת ואינה מדווחת כמה
// שורות כבר נכתבו — ולכן אי-אפשר לדעת ממנה על מי לדווח. הלולאה כאן היא בדיוק אותה
// "כתיבה סדרתית שנעצרת בכשל הראשון" ש-§2.8 מתאר, רק שהיא מונה את השורות בעצמה.

import { useCallback, useMemo, useState } from 'react'
import { RLS_DENIED_CODE } from '@/lib/apiError'
import {
  getParamEntry,
  validateParamValue,
  weightsSumOk,
  distanceOrderOk,
} from '@/lib/paramsRegistry'
import { SMART_MATCH_PARAM_NAMES } from '@/lib/smartMatch'
import { updateParams } from '@/modules/09_settings/api'

// שמות שלושת המשקולות ושני המרחקים מיובאים מ-`smartMatch.js` ולא נכתבים כאן מחדש:
// שם שגוי בתו אחד היה מכבה את בדיקת-הרוחב **בשקט** (הכלל היה פשוט לא נבדק לעולם).
const WEIGHT_NAMES = [
  SMART_MATCH_PARAM_NAMES.responsivenessWeight,
  SMART_MATCH_PARAM_NAMES.reliabilityWeight,
  SMART_MATCH_PARAM_NAMES.proximityWeight,
]
const GOALPOST_NAME = SMART_MATCH_PARAM_NAMES.goalpostDistanceKm
const GATE_NAME = SMART_MATCH_PARAM_NAMES.gateDistanceKm

// נוסחי כללי-הרוחב — נגזרו מהטקסט הנעול/הרשום ולא הומצאו: משפט-הסכום נגזר משורת-הסיכום
// הנעולה `שלוש המשקולות מסתכמות ל-1.00` (§3.7), ומשפט-המרחק הוא ה-hint שכבר יושב על
// `גולפוסט_מרחק_קמ` במרשם (`חייב להיות קטן או שווה למרחק-הפסילה`).
export const WEIGHTS_SUM_ERROR = 'שלוש המשקולות חייבות להסתכם ל-1.00'
export const DISTANCE_ORDER_ERROR =
  'מרחק שבו ציון-הקרבה מגיע ל-0 חייב להיות קטן או שווה למרחק-הפסילה'

// המחרוזת הנעולה (§3.7). מיוצאת כדי שהבדיקות ינעלו את התבנית ולא ישכפלו אותה.
export function saveFailedMessage(label, reason) {
  return `השמירה נכשלה ב"${label}" — ${reason}`
}

// ⚠️ 0 שורות ב-`updateParams` הוא דו-משמעי במכוון (RLS או שם-פרמטר שגוי) — הניסוח כאן
// שומר על אותה דו-משמעיות ואינו מכריז "אין לך הרשאה" כעובדה.
function failureReason(err) {
  if (err?.code === RLS_DENIED_CODE) return 'ייתכן שאין לך הרשאה לשנות אותה'
  return err?.message || 'תקלה לא צפויה בשמירה'
}

export default function useParamsForm({ rows, roleId, canEditAll } = {}) {
  // `drafts` = מה שהוקלד ועוד לא נשמר · `saved` = מה שנשמר בהצלחה בסשן הזה (כדי שהמסך
  // לא יצטרך שליפה חוזרת רק כדי להפסיק לסמן שורה כ"שונתה").
  const [drafts, setDrafts] = useState({})
  const [saved, setSaved] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const list = useMemo(() => rows ?? [], [rows])

  const baseline = useMemo(() => {
    const map = {}
    for (const row of list) map[row.param_name] = saved[row.param_name] ?? row.param_value ?? ''
    return map
  }, [list, saved])

  const values = useMemo(() => {
    const map = {}
    for (const row of list) {
      const name = row.param_name
      map[name] = drafts[name] ?? baseline[name]
    }
    return map
  }, [list, drafts, baseline])

  // §4.4, מילה-במילה כמו המדיניות במסד: עריכה על 'הגדרות מערכת' **או** בעלות על השורה.
  // ⚠️ `!= null` נחוץ: בלעדיו שורה ללא בעלים (`owner_role_id = null`) הייתה נראית
  // "בבעלות" כל משתמשת שאין לה `roleId` — כלומר אורחת.
  const canEditRow = useCallback(
    (row) =>
      Boolean(canEditAll) ||
      (row?.owner_role_id != null && roleId != null && row.owner_role_id === roleId),
    [canEditAll, roleId],
  )

  const dirtyNames = useMemo(
    () => list.map((row) => row.param_name).filter((name) => values[name] !== baseline[name]),
    [list, values, baseline],
  )

  // 🔴 שגיאות-שדה מחושבות **רק לשורות ששונו** — שורה שלא נגעו בה לא מקבלת הודעה אדומה
  // בגלל ערך היסטורי שאינו עומד בכלל, כי המשתמשת לא עשתה כלום והמסך היה נראה שבור בעלייה.
  const errors = useMemo(() => {
    const map = {}
    for (const name of dirtyNames) {
      const verdict = validateParamValue(getParamEntry(name), values[name])
      if (!verdict.ok) map[name] = verdict.message
    }
    return map
  }, [dirtyNames, values])

  // כללי-רוחב (§2.8) — נבדקים רק כששורה מהצמד/השלישייה **שונתה**, מאותו נימוק בדיוק:
  // סכום-משקולות היסטורי של 0.99 לא אמור לחסום שמירה של פרמטר אחר לגמרי באותה קבוצה.
  const crossFieldErrors = useMemo(() => {
    const found = []
    const dirty = new Set(dirtyNames)
    const haveAllWeights = WEIGHT_NAMES.every((name) => name in values)
    if (
      haveAllWeights &&
      WEIGHT_NAMES.some((name) => dirty.has(name)) &&
      !weightsSumOk(WEIGHT_NAMES.map((name) => values[name]))
    ) {
      found.push(WEIGHTS_SUM_ERROR)
    }
    const haveDistances = GOALPOST_NAME in values && GATE_NAME in values
    if (
      haveDistances &&
      (dirty.has(GOALPOST_NAME) || dirty.has(GATE_NAME)) &&
      !distanceOrderOk(values[GOALPOST_NAME], values[GATE_NAME])
    ) {
      found.push(DISTANCE_ORDER_ERROR)
    }
    return found
  }, [values, dirtyNames])

  const setValue = useCallback((name, value) => {
    setDrafts((prev) => ({ ...prev, [name]: value }))
  }, [])

  // ביטול — מוחק את הטיוטות של השמות שנמסרו (או של כולן). שורות שכבר נשמרו נשארות.
  const reset = useCallback((names) => {
    setSaveError('')
    setDrafts((prev) => {
      if (!names) return {}
      const next = { ...prev }
      for (const name of names) delete next[name]
      return next
    })
  }, [])

  // מקבל את רשימת השמות ששייכים למשטח הפעיל (שמירה היא פר-קבוצה — A-3), ולא את כל
  // הטבלה: המשתמשת רואה "שינית N מתוך M" של הקבוצה שלפניה, ושומרת בדיוק אותה.
  const submit = useCallback(
    async (names) => {
      setSaveError('')
      const scope = names ? new Set(names) : null
      const scopedDirty = dirtyNames.filter((name) => !scope || scope.has(name))
      if (scopedDirty.length === 0) return { ok: false, written: [] }
      // ולידציה מלאה לפני כל כתיבה — לא "לנסות ולראות מה המסד אומר".
      if (scopedDirty.some((name) => errors[name]) || crossFieldErrors.length > 0) {
        return { ok: false, written: [] }
      }

      const changes = list
        .filter((row) => scopedDirty.includes(row.param_name) && canEditRow(row))
        .map((row) => ({
          name: row.param_name,
          value: values[row.param_name],
          ownerRoleId: row.owner_role_id,
        }))
      if (changes.length === 0) return { ok: false, written: [] }

      setSaving(true)
      const written = []
      try {
        for (const change of changes) {
          try {
            await updateParams([change], { roleId, canEditAll })
          } catch (err) {
            setSaveError(saveFailedMessage(getParamEntry(change.name).label, failureReason(err)))
            return { ok: false, written }
          }
          written.push(change.name)
        }
        return { ok: true, written }
      } finally {
        // מה שנכתב בפועל עובר לבסיס ומפסיק להיספר כ"שונה"; מה שלא נכתב — הטיוטה שלו
        // **נשארת בשדה**, וזה בדיוק המצב שהמוקאפ מצייר בסעיף 8ד.
        if (written.length > 0) {
          const savedNow = Object.fromEntries(written.map((name) => [name, values[name]]))
          setSaved((prev) => ({ ...prev, ...savedNow }))
          setDrafts((prev) => {
            const next = { ...prev }
            for (const name of written) delete next[name]
            return next
          })
        }
        setSaving(false)
      }
    },
    [dirtyNames, errors, crossFieldErrors, list, values, canEditRow, roleId, canEditAll],
  )

  return {
    values,
    errors,
    crossFieldErrors,
    dirtyNames,
    saving,
    saveError,
    canEditRow,
    setValue,
    reset,
    submit,
  }
}
