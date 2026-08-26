// לשונית "לוגיסטיקה ומוצרים" (מודול 6 · משטח 3, צעד 3.3) — מסך-קריאה טהור: אפס שדות-קלט,
// הכתיבה היחידה שמתחילה כאן היא הכפתור "שינוי תכולה" שפותח את דיאלוג משטח 6 (onScopeChange).
//
// שלוש הכרעות שמעצבות את הקובץ:
// · **שלושה מצבי-ריק שחייבים להיקרא שונה (S-26):** "ריק כדין" מוכרע רק אחרי קריאת פריטי-
//   ההצעה — quote_services מגודרת על 'הצעות מחיר', ולמי שחסומה שם המבחין עצמו חוזר null
//   בלי שגיאה ⇒ מצב noPermission, והמדד מציג '—' ולעולם לא '0/0' ("אפס שורות ⇒ הושלם"
//   על טבלה לא-קריאה הוא השקר המסוכן של המודול). המבחין נקרא דרך getQuote+getPricingCatalog
//   של מודול 3 — התקדים של ScopeChangeDialog (סשן ב'), לא קריאת-Supabase חדשה.
// · **ההיסטוריה נקראת מ-RPC, לעולם לא מהטבלה** (as-built 3.3②): ל-project_changes אפס
//   policies עם RLS-on ⇒ ‎.from() מחזיר [] בלי שגיאה לכל תפקיד. getProjectChanges כבר עוטף
//   את list_project_changes, ו-money_visible הוא המבחין לכסף — לעולם לא price === null.
// · **revenue_delta הוא טרום-הנחה וטרום-מע"מ** (as-built 2.2③) ⇒ האריח "השפעת השינויים
//   על ההכנסה" מחיל את הנחת-ההצעה בצד-הלקוח (computeScopeChangeMoney דרך changesMoneySummary),
//   והשורה "אחרי הנחת הלקוח" מוצגת רק כשההנחה הוחלה בפועל.
//
// עמודות-המקור (quote_service_line_id / project_change_id) — מקור-השורה אינו מוצג כאן.
// 🔶 עודכן 26/08/2026 (מודול 5, צעד 4.3): הנימוק "NULL בכל השורות" **כבר אינו נכון לשתיהן**.
// · quote_service_line_id — M5-3 נתן לה כותב (approve_quote_and_create_project נכתבה מחדש)
//   ומילא למפרע את הישנות. **נמדד חי: 16/16 שורות מלאות** (היה 0/6 כשההערה נכתבה).
// · project_change_id — עדיין NULL בכל השורות, **ובכוונה**: הכרעה ㉗ קובעת ששורה שנולדה
//   משינוי-תכולה אינה נושאת מצביע, וזה חוב-דיווח מוצהר (`🚧 מ11 ← מ5`).
// ⇒ ההחלטה התצוגתית לא השתנתה — מקור-השורה עדיין אינו מוצג ואין אזהרה — אבל **הסיבה כן**:
//   זו בחירה מוצרית (מ6 אינו מציג מקור), ולא "אין מה להציג".

import { Fragment, useCallback, useEffect, useState } from 'react'
import StatTile from '@/components/StatTile'
import StatusTag from '@/components/StatusTag'
import PermissionAwareEmpty from '@/components/PermissionAwareEmpty'
import LoadingOrError from '@/components/LoadingOrError'
import Ltr from '@/components/Ltr'
import { cn } from '@/lib/utils'
import { formatTimestampFull } from '@/lib/dates'
import {
  LOGISTICS_STATUS_LABELS,
  resolveLogisticsTone,
  sortLogisticsRows,
  readinessTileSub,
  readinessMetricBlocked,
  readyItemsCount,
  changesTileSub,
  signedShekelCents,
  signedDelta,
  moneyHidden,
  lastLogisticsChangeBySku,
  plannedChangeNote,
  changeRowsWithRanges,
  changesMoneySummary,
  countProductLines,
  LEGAL_EMPTY_TITLE,
  LEGAL_EMPTY_DETAIL,
  NO_PERMISSION_SENTENCE,
  TAB_NO_PERMISSION_SENTENCE,
  BROKEN_EMPTY_DETAIL,
  LOAD_FAILURE_DETAIL,
  MONEY_HIDDEN_SENTENCE,
  SORT_LINE,
  HISTORY_LEAD,
  FROZEN_PRICE_SENTENCE,
} from '@/lib/projectLogistics'
import { useAuth } from '@/contexts/AuthContext'
import { getProjectLogistics, getProjectChanges, getProjectQuoteMeta } from './api'
import { getQuote, getPricingCatalog } from '@/modules/03_quotes/api'

// אותה חסימת-מצב כמו כפתור-המעטפת (ProjectCardPage): אחרי האירוע שינויים מוזנים בלשונית
// הסגירה (㉔). המחרוזת משוכפלת מהמעטפת בכוונה גלויה — היא אינה מיוצאת משם, ואיחוד הוא
// עניינו של המאחד (מדווח בדוח-הסשן).
export default function LogisticsTab({ project }) {
  const projectId = project?.project_id
  // 🔴 המבחין הראשון — **ההרשאה שלה ללוגיסטיקה**, ולא ההצעה. `logistics` חסומה מחזירה
  // אפס שורות עם `error: null`, זהה-בייט ל"ריק כדין"; מפת-ההרשאות היא הדרך היחידה
  // להבדיל. בלעדיה חסימה תקינה הוצגה כ**תקלה במערכת**.
  const { permissions } = useAuth()
  const canReadLogistics = ['view', 'edit'].includes(permissions?.['לוגיסטיקה'])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])
  const [changes, setChanges] = useState([])
  const [quoteMeta, setQuoteMeta] = useState(null)
  const [products, setProducts] = useState([])
  // 'legal' | 'noPermission' | 'broken' | null (טבלה מאוכלסת)
  const [emptyKind, setEmptyKind] = useState(null)
  const [now, setNow] = useState(() => new Date().toISOString())
  const [reloadTick, setReloadTick] = useState(0)

  const refresh = useCallback(() => {
    setLoading(true)
    setReloadTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // ההצעה (quoteMeta) נקראת לשם ההנחה בלבד; חסימת 'הצעות מחיר' מחזירה null בלי
        // שגיאה — וזה הסימן, לא תקלה (אותו שער בדיוק כמו money_visible: השניים נוסעים יחד).
        const [logisticsRows, changeRows, meta, catalog] = await Promise.all([
          getProjectLogistics(projectId),
          getProjectChanges(projectId),
          project?.quote_id ? getProjectQuoteMeta(project.quote_id) : Promise.resolve(null),
          getPricingCatalog(),
        ])

        let kind = null
        if (logisticsRows.length === 0) {
          if (!canReadLogistics) {
            // חסומה על לוגיסטיקה ⇒ אפס שורות אינו "ריק" ואינו "תקלה" — הוא חוסר-הרשאה,
            // וזה נכון **בלי קשר** למה שההצעה מכילה. השער הזה קודם לכל האחרים.
            kind = 'noPermissionLogistics'
          } else if (!project?.quote_id) {
            // אין הצעה מקושרת ⇒ אין שורות-מוצר שיכלו להוליד לוגיסטיקה — ריק כדין (`הנחתי`).
            kind = 'legal'
          } else {
            const quote = await getQuote(project.quote_id)
            const productLines = countProductLines(quote, catalog.products)
            // null = ההצעה לא נקראה (RLS מחזיר אפס שורות בלי שגיאה) ⇒ המבחין חסום.
            kind = productLines === null ? 'noPermission' : productLines === 0 ? 'legal' : 'broken'
          }
        }

        if (cancelled) return
        setRows(logisticsRows)
        setChanges(changeRows)
        setQuoteMeta(meta)
        setProducts(catalog.products)
        setEmptyKind(kind)
        setNow(new Date().toISOString())
        setError(null)
      } catch (err) {
        if (!cancelled) {
          // הודעה עברית נעולה למסך; הפרט הטכני לקונסול (התקדים של 3.1).
          console.error('logistics tab load failed:', err)
          setError(LOAD_FAILURE_DETAIL)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, project?.quote_id, reloadTick])

  if (loading) {
    return (
      <div className="pt-3" data-testid="logistics-tab">
        <LoadingOrError loading skeleton={{ variant: 'table', rows: 3, cols: 4 }} />
      </div>
    )
  }

  const productName = (sku) => products.find((p) => p.sku === sku)?.item_name ?? sku
  // גם 'broken' חוסם את המדד: רשימה ריקה שלא-כדין היא תקלה, ו-'0 מתוך 0' עם '✓' מעל
  // פאנל-השגיאה היה בדיוק השקר של S-26. הסט חי ב-readinessMetricBlocked (כלל 14).
  const metricBlocked = Boolean(error) || readinessMetricBlocked(emptyKind)
  const hasChanges = changes.length > 0
  const hidden = moneyHidden(changes)
  const money = hasChanges && !hidden ? changesMoneySummary(changes, quoteMeta) : null

  return (
    <div className="pt-3" data-testid="logistics-tab">
      {/* ── שלושת האריחים: מה מוכן · מה השתנה · כמה זה עלה ── */}
      <div className="mb-3 flex flex-wrap gap-3">
        <ReadinessTile rows={rows} blocked={metricBlocked} emptyKind={emptyKind} />
        <StatTile
          label="שינויי תכולה"
          value={error ? null : <Ltr>{String(changes.length)}</Ltr>}
          emptyText="—"
          sub={error ? undefined : (lastChangeSub(changes, now) ?? undefined)}
          testId="logistics-tile-changes"
        />
        <ImpactTile error={error} hasChanges={hasChanges} hidden={hidden} money={money} />
      </div>

      {/* ── סרגל-המיון. הכפתור "שינוי תכולה" שהמוקאפ צייר כאן הוסר בהכרעת-ישי-מואצלת
          19/08/2026 ("שניים באותו תפקיד ⇒ אחד נמחק"): כותרת-הכרטיס (משטח 2) כבר נושאת
          את אותו כפתור-ראשי בדיוק, נראה מכל לשונית — שני ראשיים זהים על מסך אחד הם
          הכפילות שמעבר-המלאי אוסר. המוקאפים צוירו כל-אחד-לבדו ולא הראו את ההרכבה.
          הוספת פריט *היא* שינוי-תכולה — ולכן גם אין CTA במצב-הריק (הערת-המוקאפ). ── */}
      <div className="flex flex-wrap items-center gap-2 pb-3">
        {rows.length > 0 && <span className="text-xs text-slate-400">{SORT_LINE}</span>}
      </div>

      {error ? (
        <PermissionAwareEmpty
          state="error"
          detail={error}
          onRetry={refresh}
          testId="logistics-state-error"
        />
      ) : emptyKind === 'noPermissionLogistics' ? (
        <PermissionAwareEmpty
          state="noPermission"
          title={TAB_NO_PERMISSION_SENTENCE}
          testId="logistics-state-no-permission-logistics"
        />
      ) : emptyKind === 'noPermission' ? (
        <PermissionAwareEmpty
          state="noPermission"
          title={NO_PERMISSION_SENTENCE}
          testId="logistics-state-no-permission"
        />
      ) : emptyKind === 'broken' ? (
        // ריק שאינו כדין: להצעה יש שורות-מוצר ⇒ רשימה ריקה היא תקלה, לא מצב תקין.
        <PermissionAwareEmpty
          state="error"
          detail={BROKEN_EMPTY_DETAIL}
          onRetry={refresh}
          testId="logistics-state-broken"
        />
      ) : emptyKind === 'legal' ? (
        <PermissionAwareEmpty
          state="empty"
          title={LEGAL_EMPTY_TITLE}
          detail={LEGAL_EMPTY_DETAIL}
          testId="logistics-state-legal-empty"
        />
      ) : (
        <MainTable rows={rows} changes={changes} productName={productName} />
      )}

      {/* ההיסטוריה מוצגת גם כשטבלת-הפריטים ריקה-כדין או חסומה — שינויי כמות-דיילות
          נקראים דרך ה-RPC המוגדר ('פרויקטים') וזמינים גם בלי 'לוגיסטיקה'/'הצעות מחיר'. */}
      {!error && emptyKind !== 'broken' && (
        <HistorySection
          changes={changes}
          rows={rows}
          project={project}
          productName={productName}
          hidden={hidden}
          money={money}
        />
      )}
    </div>
  )
}

// אריח "פריטים מוכנים": רק ready נספר (§1.3). חסום/שגיאה ⇒ '—', לעולם לא '0/0' —
// "אפס שורות ⇒ הושלם" על טבלה לא-קריאה הוא בדיוק השקר ש-S-26 חוסמת.
function ReadinessTile({ rows, blocked, emptyKind }) {
  if (blocked) {
    return (
      <StatTile label="פריטים מוכנים" value={null} emptyText="—" testId="logistics-tile-ready" />
    )
  }
  if (emptyKind === 'legal') {
    // הכרעת-ישי 08/08: פרויקט בלי פריטים נספר כמוכן לוגיסטית — הנוסח של #11.
    return (
      <StatTile
        label="פריטים מוכנים"
        value={<span className="text-sm font-semibold text-slate-500">✓ אין פריטים</span>}
        testId="logistics-tile-ready"
      />
    )
  }
  // אותה ספירה בדיוק שמזינה את שורת-המשנה — מונה אחד לשניהם, לא שכפול (כלל 14).
  const ready = readyItemsCount(rows)
  const sub = readinessTileSub(rows)
  return (
    <StatTile
      label="פריטים מוכנים"
      value={
        <span>
          <Ltr>{String(ready)}</Ltr> מתוך <Ltr>{String(rows.length)}</Ltr>
        </span>
      }
      sub={
        sub && (
          <span className={sub.tone === 'hint' ? 'font-semibold text-amber-700' : undefined}>
            {sub.text}
          </span>
        )
      }
      testId="logistics-tile-ready"
    />
  )
}

function lastChangeSub(changes, now) {
  if (changes.length === 0) return null
  const sub = changesTileSub(changes[0]?.created_at, now)
  if (!sub) return null
  return (
    <span>
      {sub.prefix}
      <Ltr>{sub.value}</Ltr>
    </span>
  )
}

// האריח השלישי — שלושת מצביו: אין שינויים (טקסט, לא 0) · כסף חסום ('—' עם הסבר, לא מקף
// חשוף — as-built 3.3③) · סכום אחרי הנחת-ההצעה, עם שורת-המשנה רק כשההנחה הוחלה בפועל.
function ImpactTile({ error, hasChanges, hidden, money }) {
  if (error) {
    return (
      <StatTile
        label="השפעת השינויים על ההכנסה"
        value={null}
        emptyText="—"
        testId="logistics-tile-impact"
      />
    )
  }
  if (!hasChanges) {
    return (
      <StatTile
        label="השפעת השינויים על ההכנסה"
        value={null}
        emptyText="אין שינויים עדיין"
        testId="logistics-tile-impact"
      />
    )
  }
  if (hidden) {
    return (
      <StatTile
        label="השפעת השינויים על ההכנסה"
        value="—"
        sub={<span data-testid="logistics-impact-no-permission">🔒 {MONEY_HIDDEN_SENTENCE}</span>}
        testId="logistics-tile-impact"
      />
    )
  }
  return (
    <StatTile
      label="השפעת השינויים על ההכנסה"
      value={<Ltr>{signedShekelCents(money.afterDiscount)}</Ltr>}
      sub={money.discountPercent > 0 ? 'אחרי הנחת הלקוח' : undefined}
      testId="logistics-tile-impact"
    />
  )
}

// 🔒 תווית תת-שורת-ההערה (㉒). הקבוע יושב כאן ולא ב-`src/lib/projectLogistics.js` כי
// האדווה הזאת מצומצמת לקובץ הזה; אתר-קריאה שני יעביר אותו לספרייה (כלל 14).
const NOTE_LABEL = 'הערת הלוגיסטיקה:'

// טבלת-הפריטים: 4 עמודות, קריאה בלבד. תקציב-הצבע: אפס שורות אדומות; ענבר רק על
// "הוגדל מ-…" (הגדלה יוצרת חוסר); הקטנה אפורה (עובדה).
function MainTable({ rows, changes, productName }) {
  const lastBySku = lastLogisticsChangeBySku(changes)
  const sorted = sortLogisticsRows(rows)

  return (
    <>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-right text-xs font-semibold text-slate-500">
            <th className="w-[46%] px-2.5 py-1.5">פריט</th>
            <th className="w-[17%] px-2.5 py-1.5">כמות מתוכננת</th>
            <th className="w-[15%] px-2.5 py-1.5">כמות בפועל</th>
            <th className="w-[22%] px-2.5 py-1.5">מצב הפריט</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const note = plannedChangeNote(row.planned_qty, lastBySku.get(row.sku))
            const statusLabel = LOGISTICS_STATUS_LABELS[row.item_status]
            // ㉒ — ההערה שמנהלת הלוגיסטיקה כתבה במסך שלה (מ5), כאן לקריאה בלבד.
            // הצורה שהוכרעה 26/08/2026: **תת-שורה ברוחב מלא מתחת לשורת-הפריט**, ולא
            // עמודה חמישית — עמודה הייתה מצרה את ארבע הקיימות ומציגה "—" ברוב השורות.
            // 🔴 ושורה בלי הערה אינה מייצרת תת-שורה כלל: לא מקף, לא תא ריק.
            const noteText = String(row.notes ?? '').trim()
            return (
              <Fragment key={`${row.sku}-${row.serial_number}`}>
                <tr
                  // הקו התחתון עובר לתת-שורה כשהיא קיימת — אחרת קו היה מפריד את ההערה
                  // מהפריט שהיא שייכת לו, וההצמדה היא כל העניין בצורה שהוכרעה.
                  className={noteText ? '' : 'border-b border-slate-100'}
                  data-testid={`logistics-row-${row.sku}-${row.serial_number}`}
                >
                  <td className="px-2.5 py-2.5">
                    <div className="font-semibold text-slate-800">{productName(row.sku)}</div>
                    {/* מקור-השורה אינו מוצג — בחירה מוצרית, לא היעדר דאטה. ר' הערת-הראש. */}
                    <div className="mt-0.5 text-[11.5px] text-slate-500">
                      <Ltr>{row.sku}</Ltr>
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="text-[13.5px] font-bold text-slate-800">
                      <Ltr>{String(row.planned_qty)}</Ltr>
                    </div>
                    {note && (
                      <div
                        className={cn(
                          'text-[11px]',
                          note.tone === 'hint' ? 'font-semibold text-amber-700' : 'text-slate-400',
                        )}
                        data-testid={`logistics-change-note-${row.sku}-${row.serial_number}`}
                      >
                        {note.tone === 'hint' && '⚠ '}
                        {note.text}
                        <Ltr>{String(note.previous)}</Ltr>
                        {note.dayMonth && (
                          <>
                            {' · '}
                            <Ltr>{note.dayMonth}</Ltr>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <Ltr>{String(row.actual_qty ?? 0)}</Ltr>
                  </td>
                  <td className="px-2.5 py-2.5">
                    {/* קריאה בלבד — מי שמעדכנת היא מנהלת הלוגיסטיקה, במסך שלה (מ5). */}
                    <StatusTag label={statusLabel} tone={resolveLogisticsTone(statusLabel)} />
                  </td>
                </tr>
                {noteText ? (
                  <tr
                    className="border-b border-slate-100"
                    data-testid={`logistics-note-${row.sku}-${row.serial_number}`}
                  >
                    <td
                      colSpan={4}
                      className="px-2.5 pb-2.5 text-[11.5px] leading-relaxed text-slate-500"
                    >
                      <span className="font-semibold text-slate-600">{NOTE_LABEL}</span> {noteText}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          })}
        </tbody>
      </table>
      <div className="mt-2 text-[11.5px] text-slate-400">
        שלושת מצבי הפריט, לפי הסדר: <b>טרם החל</b>, <b>הוזמן</b>, <b>מוכן</b>. מי שמעדכנת אותם היא
        מנהלת הלוגיסטיקה, במסך שלה. כאן הם לקריאה בלבד.
      </div>
    </>
  )
}

// היסטוריית שינויי-התכולה — יושבת כאן בהכרעת-ישי ("מנהלת הפרויקטים משנה — בלוגיסטיקה
// מתעדכנת הדרישה החדשה"): ההיסטוריה יושבת איפה שהתוצאה שלה נראית. שורה היא רשומה
// קבועה — אין עריכה ואין מחיקה.
function HistorySection({ changes, rows, project, productName, hidden, money }) {
  const plannedBySku = new Map(rows.map((row) => [row.sku, Number(row.planned_qty)]))
  const ranged = changeRowsWithRanges(changes, {
    plannedBySku,
    currentRequired: project?.required_hostess_count,
  })

  return (
    <div className="mt-6" data-testid="logistics-history">
      <h2 className="text-lg font-bold text-slate-800">היסטוריית שינויי תכולה</h2>
      <div className="mb-2.5 mt-0.5 text-xs text-slate-500">{HISTORY_LEAD}</div>

      {changes.length === 0 ? (
        <div className="text-[12.5px] text-slate-400" data-testid="logistics-history-empty">
          אין שינויים עדיין.
        </div>
      ) : (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-xs font-semibold text-slate-500">
                <th className="w-[15%] px-2.5 py-1.5">מתי</th>
                <th className="w-[22%] px-2.5 py-1.5">פריט</th>
                <th className="w-[14%] px-2.5 py-1.5">השינוי</th>
                <th className="w-[27%] px-2.5 py-1.5">סיבה</th>
                <th className="w-[12%] px-2.5 py-1.5">מי ביצעה</th>
                <th className="w-[10%] px-2.5 py-1.5">השפעה על ההכנסה</th>
              </tr>
            </thead>
            <tbody>
              {ranged.map(({ change, from, to }) => (
                <tr
                  key={change.change_id}
                  className="border-b border-slate-100"
                  data-testid={`logistics-history-row-${change.change_id}`}
                >
                  <td className="px-2.5 py-2.5 text-xs text-slate-500">
                    <Ltr>{formatTimestampFull(change.created_at)}</Ltr>
                  </td>
                  <td className="px-2.5 py-2.5">
                    {change.change_target === 'hostess_count'
                      ? 'כמות דיילות'
                      : productName(change.sku)}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="text-[13.5px] font-bold text-slate-800">
                      <Ltr>{signedDelta(change.delta_qty)}</Ltr>
                    </div>
                    {from != null && to != null && (
                      <div className="text-[11.5px] text-slate-400">
                        <Ltr>{`${from} → ${to}`}</Ltr>
                      </div>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 text-xs text-slate-600">{change.reason}</td>
                  {/* חותמת-המבצעת היא אימייל — המזהה הכן היחיד (טבלת users אינה קריאה
                      לרוב התפקידים; התקדים של 3.2④). */}
                  <td className="px-2.5 py-2.5 text-xs text-slate-500">
                    <Ltr>{change.performed_by ?? '—'}</Ltr>
                  </td>
                  <td
                    className="px-2.5 py-2.5"
                    data-testid={`logistics-history-money-${change.change_id}`}
                  >
                    {change.money_visible === false ? (
                      // '—' בתא; ההסבר המרוכז יושב בשורת-הסיכום שמתחת (as-built ③).
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span className="font-semibold text-slate-700">
                        <Ltr>{signedShekelCents(change.revenue_delta)}</Ltr>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hidden ? (
            <div
              className="mt-2.5 border-t border-slate-200 pt-2.5 text-[12.5px] text-slate-500"
              data-testid="logistics-totals-no-permission"
            >
              🔒 {MONEY_HIDDEN_SENTENCE} עמודת ההשפעה על ההכנסה וסך-השינויים מוצגים כ״—״.
            </div>
          ) : (
            <div
              className="mt-2.5 border-t border-slate-200 pt-2.5 text-[12.5px] text-slate-600"
              data-testid="logistics-totals"
            >
              סך שינויי התכולה:{' '}
              <b>
                <Ltr>{signedShekelCents(money.preDiscount)}</Ltr>
              </b>{' '}
              לפני הנחה.
              {money.discountPercent > 0 && (
                <>
                  {' '}
                  אחרי הנחת הלקוח שנקבעה בהצעה (<Ltr>{`${money.discountPercent}%`}</Ltr>):{' '}
                  <b>
                    <Ltr>{signedShekelCents(money.afterDiscount)}</Ltr>
                  </b>
                  .
                </>
              )}{' '}
              {FROZEN_PRICE_SENTENCE}
            </div>
          )}
        </>
      )}
    </div>
  )
}
