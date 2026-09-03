// S4 — "ההגדרות שלי" (מודול 9, צעד 3.4, מוקאפ docs/mockups/settings-screen/
// 02_params_tab_roles_and_states.html §5–§7). דלת שנייה ל-`params`: כל תפקיד שאינו מחזיקה
// `edit` על 'הגדרות מערכת' (ר' Topbar) פותחת כאן ורואה **רק** את השורות שבבעלותה
// (`owner_role_id`, R-2/A-9) — לא לשונית עם קבוצות-לניווט כמו `ParamsTab`, אלא כל הקבוצות
// שבבעלותה מוצגות יחד, שמירה אחת משותפת לכולן ("שינית N מתוך M" על **כל** השורות שבבעלותה,
// לא פר-קבוצה — כך מצייר המוקאפ §5/§6: מונה אחד בתחתית הכרטיס, לא אחד לכל טבלת-קבוצה).
//
// 🔐 §4.4 — "the my-settings page queries with owner_role_id = roleId, never all then filter":
// `listMyParams(roleId)` מסנן בצד-השרת; אין `listParams()` ואין סינון-לקוח כאן.
//
// 🔌 מרכיבה בעצמה את שני הפאנלים (`TemplateEditor`/`SmartMatchPane`, `variant="owner"`) —
// לא דרך `paneComponents` prop של `ParamsTab` (זו לא אותה קומפוננטה); §3.7 נוסח-הבעלים
// לאזהרת-Smart-Match שונה מנוסח-המנכ"ל, ולכן ה-variant נדרש כאן תמיד.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoadingOrError from '@/components/LoadingOrError'
import { useToast } from '@/components/ToastProvider'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  PARAM_GROUPS,
  PARAM_REGISTRY,
  getParamEntry,
  matchesParamSearch,
} from '@/lib/paramsRegistry'
import { listMyParams } from '@/modules/09_settings/api'
import BelowMinWageList from '@/modules/09_settings/BelowMinWageList'
import TemplateEditor from '@/modules/09_settings/TemplateEditor'
import SmartMatchPane from '@/modules/09_settings/SmartMatchPane'
import ParamRow, {
  PARAMS_TABLE_CLASS,
  ParamsTableHead,
} from '@/modules/09_settings/components/ParamRow'
import SaveRow from '@/modules/09_settings/components/SaveRow'
import useParamsForm from '@/modules/09_settings/components/useParamsForm'

const MIN_WAGE_PARAM = 'שכר_מינימום_שעתי'

// אותו רעיון בדיוק כמו `ParamsTab.jsx` (הועתק, לא יובא — שני "עמודי-מסך" עצמאיים, לא
// אמורים לצרוך זה מזה): סדר-התצוגה בתוך קבוצה = סדר-המרשם (ה-SSOT לתצוגה), לא סדר-אלפביתי.
const REGISTRY_ORDER = new Map(PARAM_REGISTRY.map((entry, index) => [entry.name, index]))
function registryIndex(name) {
  return REGISTRY_ORDER.has(name) ? REGISTRY_ORDER.get(name) : Number.MAX_SAFE_INTEGER
}

// קבוצה עם פאנל ייעודי (תבניות/Smart Match) מרונדרת דרכו, בדיוק כמו `paneComponents`
// ב-`ParamsTab` — אבל כאן בלי החיווט הכללי, כי הדף הזה תמיד `variant="owner"` על Smart Match.
const PANE_TYPES = new Set(['templates', 'smart_match'])

export default function MySettingsPage() {
  const { user, permissions } = useAuth()
  const canEditAll = permissions?.['הגדרות מערכת'] === 'edit'
  const roleId = user?.roleId ?? null
  const toast = useToast()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [minWageKey, setMinWageKey] = useState(0)
  // 🔍 חיפוש — נוסף 03/09/2026 (ממצא UX-6, אודיט-הסגירה). אותו נימוק בדיוק שהוליד את
  // תיבת-החיפוש בלשונית המלאה (מדריך-הצעדים ①ב②: "רשימה בסדר-גודל כזה כבר לא נסרקת בעין")
  // חל גם כאן — מנהלת-הגיוס מחזיקה 25 מתוך 38 השורות שבבעלות. אותו `matchesParamSearch`,
  // בלי מנוע-חיפוש שני. **מסנן בתוך הקבוצות, ולא מנווט** — כאן אין ניווט-קבוצות שיתנגש
  // בכלל-השורה-החלקית של פאנל-ההתאמה, ולכן ההכרעה של הלשונית לא חלה.
  const [query, setQuery] = useState('')
  // ר' ההערה המקבילה ב-`ParamsTab.jsx` (חיווט-גל-2, §6 צעד 3.2): `validateParamValue`
  // לעולם אינה נכשלת על `templates` — ורדיקט-`TemplateEditor` הוא השער היחיד.
  const [templateVerdicts, setTemplateVerdicts] = useState({})
  const handleTemplateVerdict = useCallback((name, verdict) => {
    setTemplateVerdicts((prev) => ({ ...prev, [name]: verdict }))
  }, [])

  const form = useParamsForm({ rows, roleId, canEditAll })

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setRows(await listMyParams(roleId))
    } catch (err) {
      // 🔤 אותו נוסח נעול כמו `ParamsTab` (§3.7) — "לא ניתן לטעון", בלי לחשוף אם זו רשת או RLS.
      // 🔍 והעקבה נשמרת, מאותו נימוק (ממצא F-9).
      console.error('[09_settings] MySettingsPage load failed', err)
      setLoadError('לא ניתן לטעון את ההגדרות.')
    } finally {
      setLoading(false)
    }
  }, [roleId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינה בעלייה, אותו דפוס כמו ParamsTab.
    loadData()
  }, [loadData])

  // כל קבוצה שיש לה ≥1 שורה בבעלות התפקיד — לפי סדר `PARAM_GROUPS` (מוקאפ §5–§7 מציג
  // רק את הקבוצות שבבעלות, אף פעם לא קבוצה ריקה עם "0").
  const visibleRows = useMemo(
    () => rows.filter((row) => matchesParamSearch(getParamEntry(row.param_name), query)),
    [rows, query],
  )

  const ownedGroups = useMemo(() => {
    const byType = new Map()
    for (const row of visibleRows) {
      const list = byType.get(row.param_type) ?? []
      list.push(row)
      byType.set(row.param_type, list)
    }
    const known = PARAM_GROUPS.filter((group) => byType.has(group.type)).map((group) => ({
      ...group,
      rows: (byType.get(group.type) ?? [])
        .slice()
        .sort((a, b) => registryIndex(a.param_name) - registryIndex(b.param_name)),
    }))
    // סוג שאינו ברשימת-הקבוצות הידועה (שורה חדשה שנזרעה לפני שתויגה) — לא נעלם (§2.8 "never
    // hidden"), מוצג תחת שמו-הגולמי כקבוצה בפני עצמה, כמו ב-`ParamsTab`.
    const extraTypes = [...byType.keys()].filter(
      (type) => !PARAM_GROUPS.some((group) => group.type === type),
    )
    const extra = extraTypes.map((type) => ({
      type,
      label: type,
      rows: byType
        .get(type)
        .slice()
        .sort((a, b) => registryIndex(a.param_name) - registryIndex(b.param_name)),
    }))
    return [...known, ...extra]
  }, [visibleRows])

  // 🔴 R-2 (אודיט-סגירת מ9, 03/09/2026): השער מחושב על **השורות הנראות**, לא על כל השורות
  // המשונות. אחרת החיפוש שהוסף באותו סבב מייצר מבוי-סתום: מקלידים ערך לא-תקין (למשל 3500
  // בשכר-המינימום, שנחסם מאותו סבב), מחפשים משהו אחר, ואז כפתור-השמירה אפור, המונה אומר
  // "שינית 1", וההודעה האדומה **מחוץ למסך בלי שום דבר שמצביע עליה**. ‏`ParamsTab` כבר פתר
  // את זה בכך שהוא מגדיר את השער ואת הכתיבה לפי הקבוצה הפעילה; כאן המקבילה היא החיפוש.
  const visibleNames = useMemo(
    () => new Set(visibleRows.map((row) => row.param_name)),
    [visibleRows],
  )
  const dirtyVisible = form.dirtyNames.filter((name) => visibleNames.has(name))
  const dirtyCount = dirtyVisible.length
  const totalCount = visibleRows.length
  const hasErrors =
    dirtyVisible.some((name) => form.errors[name]) ||
    form.crossFieldErrors.length > 0 ||
    // R-3 (ר' ParamsTab.jsx): ורדיקט-חסימה של תבנית חוסם שמירה בדיוק כמו שגיאת-שדה רגילה.
    dirtyVisible.some((name) => templateVerdicts[name]?.status === 'blocked')

  const minWageRow = rows.find((row) => row.param_name === MIN_WAGE_PARAM)
  const showMinWage = Boolean(minWageRow)

  async function handleSave() {
    // שמירה-אחת-לדף (המוקאפ מצייר מונה-שינויים אחד לכל הכרטיס — §5/§6/§7), **אבל מוגבלת
    // לשורות הנראות** מאותו נימוק של R-2 שמעל: מה שהמסך סופר ומה שהוא כותב חייבים להיות
    // אותה קבוצה, אחרת חיפוש פעיל שומר בשקט שורה שהמשתמשת אינה רואה.
    const { ok, written } = await form.submit(dirtyVisible)
    if (written.length > 0) {
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
        retryTestId="settings-my-retry"
        skeleton={{ variant: 'table', rows: 4, cols: 3 }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4" dir="rtl" data-testid="settings-my-page">
      <div>
        <h1 className="text-xl font-bold text-slate-800">ההגדרות שלי</h1>
        {/* תת-כותרת ממוקאפ §5/§6/§7 (תיאור-ויזואלי, לא נעול — §3.7 נועל רק את הכותרת עצמה
            ואת מחרוזת-הריק) — "הנחתי": מונה-קבוצות/שורות, מותאם לכל תפקיד. */}
        {rows.length > 0 && (
          <p className="mt-1 text-sm text-slate-500">
            {rows.length === 1 ? 'הגדרה אחת בבעלותך' : `${rows.length} הגדרות בבעלותך`}
            {ownedGroups.length === 1 ? ', בקבוצה אחת.' : `, ב-${ownedGroups.length} קבוצות.`}
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם ההגדרה או שם הפרמטר במערכת"
            className="h-auto rounded-lg border-slate-300 py-2.5 pr-10 pl-3 text-right"
            data-testid="settings-my-search"
          />
        </div>
      )}

      {rows.length > 0 && ownedGroups.length === 0 && (
        <p
          className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500"
          data-testid="settings-my-no-results"
        >
          אין הגדרות שתואמות לחיפוש
        </p>
      )}

      {rows.length === 0 ? (
        <p
          className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500"
          data-testid="settings-my-empty"
        >
          אין הגדרות בבעלות התפקיד שלך
        </p>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-5">
            {ownedGroups.map((group) => {
              const PaneComponent = PANE_TYPES.has(group.type)
                ? group.type === 'templates'
                  ? TemplateEditor
                  : SmartMatchPane
                : null
              const extraPaneProps =
                group.type === 'templates'
                  ? { onVerdict: handleTemplateVerdict }
                  : group.type === 'smart_match'
                    ? { variant: 'owner' }
                    : {}

              return (
                <div key={group.type}>
                  <h2
                    className="mb-2 text-sm font-semibold text-slate-700"
                    data-testid={`settings-my-group-${group.type}`}
                  >
                    {group.label} ({group.rows.length})
                  </h2>
                  <div className="overflow-x-auto">
                    {PaneComponent ? (
                      <PaneComponent
                        rows={group.rows}
                        values={form.values}
                        onChange={form.setValue}
                        canEdit={form.canEditRow}
                        errors={form.errors}
                        {...extraPaneProps}
                      />
                    ) : (
                      <table
                        className={PARAMS_TABLE_CLASS}
                        data-testid={`settings-my-table-${group.type}`}
                      >
                        <ParamsTableHead />
                        <tbody>
                          {group.rows.map((row) => (
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

                  {/* 📍 **הרשימה יושבת בתוך הקבוצה שבה השדה שלה** (סקירת-UX 03/09/2026):
                      עד לתיקון היא רונדרה אחרי **כל** הקבוצות, ~900px מתחת ל"שכר מינימום
                      שעתי" — כלומר מי שמעלה את הרף אינה רואה את התוצאה שלו. `max-w-sm`
                      זהה ללשונית (`ParamsTab`), כדי ששני המשטחים יציגו אותה ברוחב אחד.
                      🎨 והכותרת החיצונית נשארת מוסרת: הכרטיס עצמו נושא כותרת + הרף. */}
                  {showMinWage && group.rows.some((row) => row.param_name === MIN_WAGE_PARAM) && (
                    <div className="mt-3 max-w-sm">
                      <BelowMinWageList
                        threshold={minWageRow?.param_value}
                        draftThreshold={form.values[MIN_WAGE_PARAM]}
                        refreshKey={minWageKey}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

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

          <SaveRow
            dirtyCount={dirtyCount}
            total={totalCount}
            saving={form.saving}
            disabled={hasErrors}
            failedMessage={form.saveError}
            onCancel={() => form.reset()}
            onSave={handleSave}
          />
        </section>
      )}
    </div>
  )
}
