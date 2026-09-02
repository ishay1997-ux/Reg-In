// S1 — לשונית "פרמטרים" ב-`/system/params` (צעד 3.1, מוקאפ סעיפים 1 · 4 · 8).
// כל 43 שורות ה-`params` נערכות כאן בלי SQL: חיפוש · רשימת-קבוצות עם מונים · פאנל
// גנרי לקבוצה הפעילה · שמירה פר-קבוצה (A-3).
//
// 🔌 **`paneComponents` — נקודת-החיווט לגל 2.** מפה `{ param_type: Component }`: קבוצה
// שיש לה רכיב-פאנל משלה מרונדרת דרכו במקום דרך הטבלה הגנרית. כך `TemplateEditor` (3.2)
// ו-`SmartMatchPane` (3.3) נכנסים בלי לגעת בקובץ הזה. **החוזה שהם מקבלים:**
//   `rows`     — שורות ה-DB של הקבוצה, כבר מסוננות-חיפוש וממוינות לפי סדר-המרשם
//   `values`   — `{ [param_name]: הערך שעל המסך }` (טיוטה אם יש, אחרת הערך השמור)
//   `onChange` — `(param_name, value) => void`
//   `canEdit`  — **פונקציה** `(row) => boolean` (§4.4 — פר-שורה, כי בעלות היא פר-שורה)
//   `errors`   — `{ [param_name]: הודעת-ולידציה }`
// שורת-השמירה **נשארת כאן** ולא בתוך הפאנל — אחרת כל פאנל היה מגדל שורת-שמירה משלו
// והשלוש היו סוטות (בדיוק המחלה של `StatTile` שתועדה ב-`src/CLAUDE.md`).
//
// 🔐 `canEdit` פר-שורה הוא **נוחות בלבד** — הקיר האמיתי הוא ה-policy `params_update_settings_or_owner`,
// ו-`updateParams` זורק כשכתיבה החזירה 0 שורות. הביטוי כאן זהה למדיניות במסד (§4.4).
//
// 🗂️ **הקיבוץ נשען על `param_type` שבשורת-ה-DB ולא על `group` שבמרשם** — כדי ששורה
// חדשה שנזרעה לפני שנכתבה לה תווית עדיין תיפול לקבוצה הנכונה ותוצג (§2.8: "never hidden").

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import LoadingOrError from '@/components/LoadingOrError'
import { useToast } from '@/components/ToastProvider'
import {
  PARAM_GROUPS,
  PARAM_REGISTRY,
  getParamEntry,
  matchesParamSearch,
} from '@/lib/paramsRegistry'
import { listParams } from '@/modules/09_settings/api'
import BelowMinWageList from '@/modules/09_settings/BelowMinWageList'
import TemplateEditor from '@/modules/09_settings/TemplateEditor'
import SmartMatchPane from '@/modules/09_settings/SmartMatchPane'
import GroupList from '@/modules/09_settings/components/GroupList'
import ParamRow from '@/modules/09_settings/components/ParamRow'
import SaveRow from '@/modules/09_settings/components/SaveRow'
import useParamsForm from '@/modules/09_settings/components/useParamsForm'

const MIN_WAGE_PARAM = 'שכר_מינימום_שעתי'

// 🔌 חיווט-גל-2 (§10 · 02/09 22:1X) — ברירת-המחדל האמיתית של `paneComponents` (הפרמטר
// עצמו נשאר ניתן-לדריסה, לטובת בדיקות שרוצות להרכיב פאנל-מדומה). שני הפאנלים מקבלים שורות-DB
// גולמיות (`param_name`/`param_type`/`owner_role_id`) בדיוק כמו הטבלה הגנרית — אין גישור-צורה
// (התאמת `TemplateEditor.jsx` לחוזה הזה נעשתה בקובץ עצמו, לא כאן). `MySettingsPage` מרכיבה
// את שני הפאנלים בעצמה (וריאנט-בעלים) ולכן אינה משתמשת בברירת-המחדל הזאת.
const DEFAULT_PANE_COMPONENTS = { templates: TemplateEditor, smart_match: SmartMatchPane }

// 🔤 משפטי-הפתיחה של הקבוצות — **רק לשתי הקבוצות שהמוקאפ המאושר צייר להן משפט.**
// לארבע האחרות לא נכתב משפט בשום מקור, וניסוח-עצמאי כאן היה המצאת-טקסט-מוצר
// (הודגש לאורקסטרטור בדוח-הבנייה). קבוצה בלי משפט פשוט לא מציגה אחד.
const GROUP_LEADS = {
  pricing_timing:
    'הערכים שמנוע התמחור וההצעות קורא. שינוי משפיע על הצעות חדשות בלבד — הצעה שכבר אושרה שומרת את הערכים שהוקפאו בה.',
  smart_match: 'הערכים שקובעים איך המערכת מדרגת מועמדות לשיבוץ.',
}

// סדר-התצוגה בתוך קבוצה = סדר-המרשם (ה-SSOT לתצוגה). ‏`listParams` ממיין לפי
// `param_name` — סדר יציב לבדיקות, אבל שרירותי לעין. שורה שאינה במרשם יורדת לסוף.
const REGISTRY_ORDER = new Map(PARAM_REGISTRY.map((entry, index) => [entry.name, index]))
function registryIndex(name) {
  return REGISTRY_ORDER.has(name) ? REGISTRY_ORDER.get(name) : Number.MAX_SAFE_INTEGER
}

export default function ParamsTab({ paneComponents = DEFAULT_PANE_COMPONENTS }) {
  const { user, permissions } = useAuth()
  const canEditAll = permissions?.['הגדרות מערכת'] === 'edit'
  const roleId = user?.roleId ?? null
  const toast = useToast()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState(PARAM_GROUPS[0].type)
  const [minWageKey, setMinWageKey] = useState(0)
  // דיווח-הורדת ה-verdict מ-`TemplateEditor` (§6 צעד 3.2: "onVerdict reports the blocked state
  // upward — the parent's SaveRow disables on it, wired in wave 2"). `validateParamValue` לעולם
  // אינה נכשלת על קלט `templates` (2.1 "הנחתי") — כלומר בלי המפה הזאת שום דבר לא היה חוסם
  // שמירה של תבנית עם משתנה-חובה חסר (R-3).
  const [templateVerdicts, setTemplateVerdicts] = useState({})
  const handleTemplateVerdict = useCallback((name, verdict) => {
    setTemplateVerdicts((prev) => ({ ...prev, [name]: verdict }))
  }, [])

  const form = useParamsForm({ rows, roleId, canEditAll })

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setRows(await listParams())
    } catch {
      // 🔤 הנוסח נעול (§3.7) ואינו מגיע מהודעת-השגיאה של השכבה שמתחת: המשתמשת אינה
      // צריכה לדעת אם זו רשת או RLS — שתיהן "לא ניתן לטעון", והכפתור זהה.
      setLoadError('לא ניתן לטעון את ההגדרות.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינה בעלייה; loadData מדליק setLoading כחיווי (אותו דפוס כמו PricesManagementPage).
    loadData()
  }, [loadData])

  const visibleRows = useMemo(
    () => rows.filter((row) => matchesParamSearch(getParamEntry(row.param_name), query)),
    [rows, query],
  )

  // ששת הסוגים תמיד מוצגים (המוקאפ מצייר את כולם), ובנוסף כל סוג שנמצא בדאטה ואינו
  // ברשימה — כדי ששורה עם `param_type` חדש לא תיעלם בשקט בין שני מסכים.
  const groups = useMemo(() => {
    const counts = new Map()
    for (const row of visibleRows) counts.set(row.param_type, (counts.get(row.param_type) ?? 0) + 1)
    const known = PARAM_GROUPS.map((group) => ({ ...group, count: counts.get(group.type) ?? 0 }))
    const extra = [...counts.keys()]
      .filter((type) => !PARAM_GROUPS.some((group) => group.type === type))
      .map((type) => ({ type, label: type, count: counts.get(type) }))
    return [...known, ...extra]
  }, [visibleRows])

  // חיפוש שמרוקן את הקבוצה הפעילה מקפיץ לקבוצה הראשונה שיש בה תוצאה — אחרת המשתמשת
  // מקלידה "מרחק", רואה פאנל ריק, ומסיקה שאין תוצאות בעוד שהן בקבוצה השכנה.
  const activeType = useMemo(() => {
    const current = groups.find((group) => group.type === selectedType)
    if (current && current.count > 0) return selectedType
    return groups.find((group) => group.count > 0)?.type ?? selectedType
  }, [groups, selectedType])

  const activeGroup = groups.find((group) => group.type === activeType)

  // 🔴 חיווט-גל-2 (הנחתי): לקבוצה עם `PaneComponent` (תבניות/Smart Match) — הפאנל מקבל את
  // **כל** שורות-הסוג, לא רק את מה שהחיפוש התאים. הסיבה: `SmartMatchPane` מיישמת את
  // כלל-השורה-החלקית (§6 צעד 3.3) — אם שורה אחת מזוג-המרחק חסרה מ-`rows`, כל הבלוק מוסתר.
  // חיפוש שמצא שורה אחת מהזוג בשמה המדויק (`שער_מרחק_קמ`) היה **מסתיר גם אותה עצמה**
  // אילו קיבל הפאנל רק את השורה שהתאימה — סתירה ישירה ל-2.1 ("חיפוש מוצא לפי שני השמות").
  // תג-המונה בסרגל-הצד (`groups`, למעלה) נשאר מבוסס-חיפוש בכוונה — הוא ניווט, לא תוכן.
  // קבוצה גנרית (ללא פאנל) ממשיכה להיות מסוננת-חיפוש כרגיל, ללא שינוי-התנהגות.
  const groupRows = useMemo(() => {
    const source = paneComponents[activeType] ? rows : visibleRows
    return source
      .filter((row) => row.param_type === activeType)
      .sort((a, b) => registryIndex(a.param_name) - registryIndex(b.param_name))
  }, [rows, visibleRows, activeType, paneComponents])

  const groupNames = useMemo(() => groupRows.map((row) => row.param_name), [groupRows])
  const dirtyInGroup = form.dirtyNames.filter((name) => groupNames.includes(name))
  const hasErrorsInGroup =
    dirtyInGroup.some((name) => form.errors[name]) ||
    form.crossFieldErrors.length > 0 ||
    // R-3: ורדיקט-חסימה של תבנית (משתנה-חובה חסר / טוקן לא-מוכר) חוסם שמירה בדיוק כמו
    // שגיאת-שדה רגילה — רק ששורש-האמת שלו הוא `TemplateEditor`, לא `validateParamValue`.
    dirtyInGroup.some((name) => templateVerdicts[name]?.status === 'blocked')
  // A-11: מי שאין לה עריכה על 'הגדרות מערכת' ואינה בעלת אף שורה בקבוצה רואה מסך-קריאה —
  // בלי שורת-שמירה ועם ההערה "צפייה בלבד". הביטוי הוא פר-שורה (§4.4) ולא פר-מסך, כי
  // בעלות היא פר-שורה: בעלת פרמטר אחד בקבוצה כן תראה שורת-שמירה.
  const paneReadOnly = groupRows.length > 0 && !groupRows.some((row) => form.canEditRow(row))
  const minWageRow = rows.find((row) => row.param_name === MIN_WAGE_PARAM)
  const showMinWage = groupRows.some((row) => row.param_name === MIN_WAGE_PARAM)

  async function handleSave() {
    const { ok, written } = await form.submit(groupNames)
    if (written.length > 0) {
      // הערכים שנכתבו בפועל נכנסים ל-state המקומי במקום שליפה חוזרת — שליפה הייתה
      // מחזירה את המסך לשלד-טעינה אחרי כל שמירה, והמשתמשת מאבדת את מקומה בטבלה.
      setRows((prev) =>
        prev.map((row) =>
          written.includes(row.param_name)
            ? { ...row, param_value: form.values[row.param_name] }
            : row,
        ),
      )
      if (written.includes(MIN_WAGE_PARAM)) setMinWageKey((key) => key + 1)
    }
    if (ok) toast.success('ההגדרות נשמרו')
  }

  if (loading || loadError) {
    return (
      <LoadingOrError
        loading={loading}
        error={loadError}
        onRetry={loadError ? loadData : undefined}
        retryLabel="נסי שוב"
        retryTestId="settings-retry"
        skeleton={{ variant: 'table', rows: 6, cols: 3 }}
      />
    )
  }

  const PaneComponent = paneComponents[activeType]
  // §3.7 — "CEO view" הוא נוסח-האזהרה שהמוקאפ מצייר בלשונית "פרמטרים"; `MySettingsPage`
  // מרכיבה את אותו רכיב עם `variant="owner"`. `onVerdict` נחוץ לתבניות בלבד — `SmartMatchPane`
  // אינה מקבלת/משתמשת בו.
  const extraPaneProps =
    activeType === 'templates'
      ? { onVerdict: handleTemplateVerdict }
      : activeType === 'smart_match'
        ? { variant: 'ceo' }
        : {}

  return (
    <div className="flex flex-col gap-4" dir="rtl" data-testid="settings-params-tab">
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי שם ההגדרה או שם השדה במסד"
          className="h-auto rounded-lg border-slate-300 py-2.5 pr-10 pl-3 text-right"
          data-testid="settings-search"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <GroupList groups={groups} activeType={activeType} onSelect={setSelectedType} />

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-800">{activeGroup?.label}</h2>
          {GROUP_LEADS[activeType] && (
            <p className="mt-1 mb-3 text-xs text-slate-500">{GROUP_LEADS[activeType]}</p>
          )}

          {paneReadOnly && (
            <p
              className="mb-3 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
              data-testid="settings-view-only-note"
            >
              צפייה בלבד
            </p>
          )}

          {groupRows.length === 0 ? (
            <p className="py-6 text-sm text-slate-500" data-testid="settings-no-results">
              אין הגדרות שתואמות לחיפוש
            </p>
          ) : (
            // 🎨 תיקון-פריסה (03/09/2026, נמצא בשער-🎨 מהצילום `01-ceo-params-pricing.png`):
            // האסייד היה יושב **לצד** הטבלה (`lg:grid-cols-[1fr_280px]`) — וברוחב-המסך
            // שבו הבנייה בפועל נמדדת (1280px, viewport ברירת-המחדל של Playwright), זה בדיוק
            // הרוחב שבו `lg:` (1024px+) כבר פעיל, כך שהעמודה "הערה" נדחקת ל-~190px ושורה
            // עוברת ל-5-6 שורות (90px גובה) במקום שורה אחת (~44px, כמו במוקאפ סעיף 1).
            // 🔴 **הוחלט לרנדר את האסייד *מתחת* לטבלה, ברוחב-מלא של הפאנל** — לא
            // `xl:grid-cols-[1fr_280px]` (האפשרות השנייה שהוצעה): `xl:` הוא 1280px גם הוא,
            // כלומר היה נדלק **באותו viewport בדיוק** שבו הבאג נמדד, ולא היה פותר כלום.
            // מוקאפ סעיף 4 מצייר צד-לצד, אבל הדגמת-הסעיף שם עומדת לבד בלי סרגל-הקבוצות
            // (220px+גאפ) שהמסך האמיתי תמיד נושא — כלומר יש לה ~350px רוחב נוסף שלא קיים
            // כאן. "מכבדים" את כוונת-המוקאפ (הרשימה צמודה לשדה, באותה קבוצה) בלי לשכפל
            // את הפריסה המדויקת שמניחה רוחב שאין.
            <div className="flex flex-col gap-3">
              <div className="overflow-x-auto">
                {PaneComponent ? (
                  <PaneComponent
                    rows={groupRows}
                    values={form.values}
                    onChange={form.setValue}
                    canEdit={form.canEditRow}
                    errors={form.errors}
                    {...extraPaneProps}
                  />
                ) : (
                  <table className="w-full border-collapse text-right" data-testid="settings-table">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="w-2/5 py-2 font-medium">הגדרה</th>
                        <th className="w-1/5 py-2 text-center font-medium">ערך</th>
                        <th className="py-2 font-medium">הערה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupRows.map((row) => (
                        <ParamRow
                          key={row.param_name}
                          row={row}
                          value={form.values[row.param_name]}
                          onChange={form.setValue}
                          canEdit={form.canEditRow(row)}
                          error={form.errors[row.param_name]}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {showMinWage && (
                <div className="max-w-sm">
                  <BelowMinWageList
                    threshold={minWageRow?.param_value}
                    draftThreshold={form.values[MIN_WAGE_PARAM]}
                    refreshKey={minWageKey}
                  />
                </div>
              )}
            </div>
          )}

          {form.crossFieldErrors.map((message) => (
            <p
              key={message}
              role="alert"
              className="mt-3 text-sm font-medium text-red-600"
              data-testid="settings-cross-field-error"
            >
              {message}
            </p>
          ))}

          {!paneReadOnly && groupRows.length > 0 && (
            <SaveRow
              dirtyCount={dirtyInGroup.length}
              total={groupRows.length}
              saving={form.saving}
              disabled={hasErrorsInGroup}
              failedMessage={form.saveError}
              onCancel={() => form.reset(groupNames)}
              onSave={handleSave}
            />
          )}
        </section>
      </div>
    </div>
  )
}
