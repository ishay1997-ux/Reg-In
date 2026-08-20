// דיאלוג שינוי-התכולה (משטח 6, צעד 3.6) — משנים **כמויות בלבד**: ההצעה נעולה במסד
// (טריגר P0001), והשינוי נרשם ב-`project_changes` דרך ה-RPC האטומי `apply_scope_change`.
//
// שלוש הכרעות שמעצבות את הקובץ, וקל לשבור אותן בלי שגיאה:
// · **`target_qty` הוא היעד, לא הדלתא** (חוזה-הפיילוד 1.8/2.5) — שליחת דלתא מחייבת-כפול בניסיון-חוזר.
// · **שורה חדשה נשלחת בלי `serial_number` בכלל** — ההשמטה *היא* האות "פריט חדש", והשרת מקצה
//   max+1 בעצמו. הלקוח לעולם לא ממציא מספר סידורי (שני מוסיפים במקביל היו מתנגשים על ה-PK).
// · **הזמן מודיע ולא חוסם** (⑯) — באנר "שינוי מאוחר" מותנה (`isLateChange`), והשמירה נשארת
//   פעילה בכל טווח-זמן. אין סף-שעון חוסם בשום מקום בקובץ.
//
// המספרים כולם מיובאים מ-`src/lib/` (כלל 14): החשבון מ-projectChanges.js, המדדים מ-projects.js,
// סך-ההצעה מ-pricing.js. הקומפוננטה לא מחשבת נוסחה בעצמה.
//
// מבנה: גוף-הדיאלוג ממונטש רק כשהוא פתוח (Radix מסיר את התוכן בסגירה) ⇒ כל פתיחה מתחילה
// מ-state טרי — אותו עיקרון של "איפוס דרך remount, לא effect שמסנכרן" (src/CLAUDE.md).
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Money from '@/components/Money'
import Ltr from '@/components/Ltr'
import StatusTag from '@/components/StatusTag'
import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty from '@/components/PermissionAwareEmpty'
import { useAuth } from '@/contexts/AuthContext'
import { applyScopeChange, getProjectAssignments, getProjectLogistics } from './api'
import { getPricingCatalog, getQuote } from '@/modules/03_quotes/api'
import {
  computeDeltaQty,
  computeScopeChangeMoney,
  hoursUntilEvent,
  isLateChange,
  lateChangeBanner,
  lineChangeAmount,
  projectTotalAfterChange,
  staffingConsequence,
  tierCrossingNotice,
} from '@/lib/projectChanges'
import {
  PROJECT_STATUS_LABELS,
  eventDaysFromToday,
  proximitySentence,
  staffingMetric,
} from '@/lib/projects'
import { computeQuoteTotals, findMatchingTier, resolveUnitPrice } from '@/lib/pricing'
import { formatDate, formatTimeRange, formatTimestamp } from '@/lib/dates'

// 🔒 שתי מחרוזות-הסירוב זהות-בייט לשרת — הדיאלוג חוסם **לפני** השליחה באותו משפט בדיוק
// שה-RPC היה זורק (as-built ② של צעד 3.6: "verify they are identical, not merely similar").
// המקור: supabase/migrations/20260814142440_module6_rpcs_writes.sql, גוף apply_scope_change
// (שורות ה-raise של בדיקת-הכמות). ⚠️ נוסח-השרת של אי-השלם נושא סיומת " השינוי לא בוצע." —
// היא מושמטת כאן במכוון (לפני-שליחה שום שינוי לא נוסה), בהתאם לנוסח שמדריך-המיקרו נעל.
const ZERO_QTY_MESSAGE = 'הכמות חייבת להיות גדולה מאפס. להסרת פריט לגמרי — פני למנהלת הלוגיסטיקה.'
const NON_INTEGER_MESSAGE = 'הכמות חייבת להיות מספר שלם.'
// 🔒 נעול ב-§3.7 של מדריך-המיקרו (וריאנט שינוי-התכולה — שונה במכוון מנוסח-הביטול).
const EMPTY_REASON_MESSAGE = 'חובה למלא סיבה — היא מה שיסביר את החיוב הזה בעוד חודש.'
// הדפוס של מודול 3 ("עדכן ושלח" בלי שינוי — הכרעת-ישי 01/08/2026), בנוסח הכרטיס.
const NO_CHANGE_MESSAGE = 'לא שינית אף כמות — אין מה לשמור'

// ── מודל-השורות: שורת-הצעה אחת ⇒ שורת-דיאלוג אחת ───────────────────────────────────
// הטבלה לעולם אינה ריקה — §7.53 מחייב שורת-דיילות בכל הצעה. שורת-דיילות נמדדת מול
// `projects.required_hostess_count` (המכנה של מכונת-הסטטוס), ושורת-לוגיסטיקה מול
// `logistics.planned_qty` — "כמות בתוקף" היא הכמות המצטברת אחרי שינויים קודמים.
function buildLineModels({ quote, products, logisticsRows, requiredHostessCount }) {
  const bySku = new Map((products ?? []).map((p) => [p.sku, p]))
  const unmatched = (logisticsRows ?? []).slice()

  // ההצעה אינה קריאה (אין 'הצעות מחיר') ⇒ אין מחירים קפואים, אבל הכמויות עדיין ידועות:
  // שורות-הלוגיסטיקה + כמות-הדיילות מהפרויקט. עמודות-הכסף יציגו '—' (לעולם לא 0).
  if (!quote) {
    return [
      {
        key: 'hostess-fallback',
        kind: 'hostess',
        sku: null,
        name: 'כמות הדיילות בפרויקט',
        subLabel: 'משמרת · קובע את מספר הדיילות הנדרשות',
        frozenPrice: null,
        effectiveQty: Number(requiredHostessCount) || 0,
        serialNumber: null,
        editable: true,
        product: null,
      },
      ...unmatched.map((row) => ({
        key: `log-${row.sku}-${row.serial_number}`,
        kind: 'logistics',
        sku: row.sku,
        name: bySku.get(row.sku)?.item_name ?? row.sku,
        subLabel: bySku.get(row.sku)?.unit ?? 'יחידה',
        frozenPrice: null,
        effectiveQty: Number(row.planned_qty),
        serialNumber: row.serial_number,
        editable: true,
        product: bySku.get(row.sku) ?? null,
      })),
    ]
  }

  const services = [...(quote.quote_services ?? [])].sort(
    (a, b) => Number(a.line_number) - Number(b.line_number),
  )

  return services.map((line) => {
    const product = bySku.get(line.sku) ?? null
    const isHostess = product?.category === 'hostess'
    const name = product?.item_name ?? line.sku
    // צבע מוצג לצד השם כשקיים (כרטיס §⑧י): באירוע עם אותו מק"ט בשני צבעים השם לבדו אינו מבחין.
    const displayName = line.color ? `${name} · ${line.color}` : name

    if (isHostess) {
      return {
        key: `line-${line.line_id}`,
        kind: 'hostess',
        sku: line.sku,
        name: displayName,
        subLabel: 'משמרת · קובע את מספר הדיילות הנדרשות',
        frozenPrice: line.closing_unit_price,
        effectiveQty: Number(requiredHostessCount) || Number(line.qty) || 0,
        serialNumber: null,
        editable: true,
        product,
      }
    }

    // ההתאמה הראשית — עמודת-המקור `quote_service_line_id`; fallback לפי sku לשורות-עבר
    // שנולדו לפני שהעמודה קיימת (היא nullable, הערת-הסכמה ב-schema.sql:1061).
    let idx = unmatched.findIndex((row) => row.quote_service_line_id === line.line_id)
    if (idx === -1) {
      idx = unmatched.findIndex(
        (row) =>
          row.sku === line.sku &&
          row.quote_service_line_id == null &&
          row.project_change_id == null,
      )
    }
    const logRow = idx === -1 ? null : unmatched.splice(idx, 1)[0]

    return {
      key: `line-${line.line_id}`,
      kind: 'logistics',
      sku: line.sku,
      name: displayName,
      subLabel: product?.unit ?? 'יחידה',
      frozenPrice: line.closing_unit_price,
      effectiveQty: logRow ? Number(logRow.planned_qty) : Number(line.qty),
      serialNumber: logRow ? logRow.serial_number : null,
      // 🔴 בלי שורת-לוגיסטיקה תואמת אין `serial_number` — ושליחה בלעדיו הייתה מתפרשת
      // בשרת כ"פריט חדש" וכותבת שורה שנייה. עדיף פקד מושבת-ומנומק מכתיבה שגויה-בשקט.
      editable: Boolean(logRow),
      product,
    }
  })
}

// פענוח קלט-כמות: '' = "לא נגעו" (השורה מוצגת ללא-שינוי) · לא-שלם/אפס-ומטה = שגיאה
// באותו נוסח שהשרת היה מחזיר. הבדיקה כאן היא נוחות; ה-RPC הוא השער (וה-CHECK — הגיבוי).
function parseQtyInput(raw) {
  const text = String(raw ?? '').trim()
  if (text === '') return { value: null, error: null }
  const value = Number(text)
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return { value: null, error: NON_INTEGER_MESSAGE }
  }
  if (value <= 0) return { value: null, error: ZERO_QTY_MESSAGE }
  return { value, error: null }
}

// מצב כל שורה קיימת: קלט ⇒ יעד ⇒ דלתא ⇒ סכום — דרך הפונקציות הטהורות של 2.2.
function deriveLineStates(lineModels, qtyInputs) {
  return lineModels.map((model) => {
    const raw = qtyInputs[model.key] ?? String(model.effectiveQty)
    const { value: target, error } = parseQtyInput(raw)
    const delta = error || target === null ? null : computeDeltaQty(model.effectiveQty, target)
    const changed = model.editable && delta !== null && delta !== 0
    return {
      model,
      raw,
      target,
      error: model.editable ? error : null,
      delta,
      changed,
      amount: changed ? lineChangeAmount(delta, model.frozenPrice) : null,
    }
  })
}

// מצב שורות "+ הוספת פריט": ④ — מחיר לפי מדרגת-הקטלוג של **היום** לכמות המבוקשת,
// והנחת-ההצעה מוחלת בבלוק-הכסף (הכרעה ③: ירושת-תנאים).
function deriveNewRowStates(newRows, products, tiers) {
  return newRows.map((row) => {
    const product = products.find((p) => p.sku === row.sku) ?? null
    const { value: qty, error } = parseQtyInput(row.qty)
    const price = product && qty !== null ? resolveUnitPrice(product, tiers, qty) : null
    const tier = product && qty !== null ? findMatchingTier(product, tiers, qty) : null
    const valid = Boolean(product) && qty !== null && !error
    return { row, product, qty, error: row.sku ? error : null, price, tier, valid }
  })
}

// ① שינוי מאוחר — מותנה (הכרעת-ישי 14/08, סעיף ד): דיילות <24ש · טובין מודפסים
// <3 ימי-עסקים · הפחתה לעולם לא. מחזיר את משפט-הבאנר או null; לעולם אינו חוסם (⑯).
function deriveLateBanner({ changedLines, validNewRows, project, loadedAt }) {
  if (!loadedAt || !project?.final_event_date) return null
  const candidates = [
    ...changedLines.map((s) => ({
      target: s.model.kind === 'hostess' ? 'hostess_count' : 'logistics',
      deltaQty: s.delta,
    })),
    ...validNewRows.map((s) => ({ target: 'logistics', deltaQty: s.qty })),
  ]
  const anyLate = candidates.some((line) =>
    isLateChange(line, project.final_event_date, project.final_start_time, loadedAt),
  )
  if (!anyLate) return null
  return lateChangeBanner(
    hoursUntilEvent(project.final_event_date, project.final_start_time, loadedAt),
  )
}

// סה"כ ההצעה המקורית — לשורת ה"חיוב" בבלוק-ההשלכה. computeQuoteTotals זורק על
// פרמטר-הנחה חסר; הצעה לא-קריאה או פגומה ⇒ null ⇒ '—' (לעולם לא 0).
function safeQuoteTotal(quote) {
  if (!quote) return null
  try {
    return computeQuoteTotals(
      (quote.quote_services ?? []).map((s) => ({ qty: s.qty, unitPrice: s.closing_unit_price })),
      quote.applied_customer_discount,
      quote.manual_discount,
      quote.vat_rate_snapshot,
    ).total
  } catch {
    return null
  }
}

// ── תת-רכיבי תצוגה ──────────────────────────────────────────────────────────────────

function IdentityCell({ label, children }) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-[12.5px] font-semibold text-slate-800">{children}</span>
    </div>
  )
}

const NUM_TD = 'border-b border-slate-100 px-2 py-2 text-left align-middle whitespace-nowrap'
const NUM_TH =
  'border-b border-slate-200 px-2 py-1.5 text-left text-[11.5px] font-semibold whitespace-nowrap text-slate-500'

function QtyInput({ value, error, disabled, disabledReason, ariaLabel, testId, onChange }) {
  return (
    <>
      <input
        type="number"
        min="1"
        dir="ltr"
        className={`h-8 w-[78px] rounded-md border bg-white px-2 text-left text-sm text-slate-800 ${
          error ? 'border-red-600' : 'border-slate-300'
        }`}
        value={value}
        disabled={disabled}
        title={disabledReason}
        aria-label={ariaLabel}
        data-testid={testId}
        onFocus={(e) => e.target.select()}
        onChange={onChange}
      />
      {error ? (
        <div className="mt-1 text-[11px] font-semibold text-red-600" role="alert">
          {error}
        </div>
      ) : null}
    </>
  )
}

function ExistingLineRow({ state, quoteReadable, submitting, onQtyChange }) {
  const { model, raw, error, delta, changed, amount } = state
  return (
    <tr className={changed ? '' : 'bg-slate-50 text-slate-500'}>
      <td className="border-b border-slate-100 px-2 py-2 align-middle">
        <div className="font-semibold text-slate-800">{model.name}</div>
        <div className="mt-0.5 text-[11.5px] text-slate-500">{model.subLabel}</div>
      </td>
      <td className={`${NUM_TD} text-slate-600`}>
        {quoteReadable ? <Money exact amount={model.frozenPrice} /> : <Ltr>—</Ltr>}
      </td>
      <td className={`${NUM_TD} text-slate-600`}>
        <Ltr>{String(model.effectiveQty)}</Ltr>
      </td>
      <td className="border-b border-slate-100 px-2 py-2 text-left align-middle">
        <QtyInput
          value={raw}
          error={error}
          disabled={!model.editable || submitting}
          disabledReason={
            model.editable ? undefined : 'לפריט אין שורת-לוגיסטיקה מקושרת — לא ניתן לעדכן אותו מכאן'
          }
          ariaLabel={`כמות חדשה — ${model.name}`}
          onChange={(e) => onQtyChange(model.key, e.target.value)}
        />
      </td>
      <td className={`${NUM_TD} font-bold`}>
        {changed ? <Ltr>{delta > 0 ? `+${delta}` : String(delta)}</Ltr> : 'ללא שינוי'}
      </td>
      <td className={NUM_TD}>
        {!changed && '—'}
        {changed && (quoteReadable ? <Money exact amount={amount} /> : <Ltr>—</Ltr>)}
      </td>
    </tr>
  )
}

function NewItemRow({ state, index, addableProducts, submitting, onChange, onRemove }) {
  const { row, error, price, tier, qty } = state
  return (
    <tr>
      <td className="border-b border-slate-100 px-2 py-2 align-middle">
        <select
          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
          value={row.sku}
          disabled={submitting}
          aria-label="בחירת מוצר מהקטלוג"
          data-testid={`scope-new-row-select-${index}`}
          onChange={(e) => onChange(row.key, { sku: e.target.value })}
        >
          <option value="">בחר/י מוצר מהקטלוג</option>
          {addableProducts.map((p) => (
            <option key={p.sku} value={p.sku}>
              {p.item_name}
            </option>
          ))}
        </select>
        <div className="mt-0.5 text-[11.5px] text-slate-500">
          לא היה בהצעה
          <button
            type="button"
            className="mr-2 text-red-600"
            onClick={() => onRemove(row.key)}
            aria-label="הסרת השורה החדשה"
          >
            הסרה
          </button>
        </div>
      </td>
      <td className={`${NUM_TD} text-slate-600`}>
        {price !== null ? <Money exact amount={price} /> : <Ltr>—</Ltr>}
        {tier ? (
          <div className="text-[11.5px] text-slate-500">
            מדרגה <Ltr>{`${tier.min_qty}–${tier.max_qty ?? ''}`}</Ltr>
          </div>
        ) : null}
      </td>
      <td className={`${NUM_TD} text-slate-600`}>—</td>
      <td className="border-b border-slate-100 px-2 py-2 text-left align-middle">
        <QtyInput
          value={row.qty}
          error={error}
          disabled={submitting}
          ariaLabel="כמות — פריט חדש"
          testId={`scope-new-row-qty-${index}`}
          onChange={(e) => onChange(row.key, { qty: e.target.value })}
        />
      </td>
      <td className={`${NUM_TD} font-bold`}>{qty !== null ? <Ltr>{`+${qty}`}</Ltr> : '—'}</td>
      <td className={NUM_TD}>
        {qty !== null && price !== null ? (
          <Money exact amount={lineChangeAmount(qty, price)} />
        ) : (
          '—'
        )}
      </td>
    </tr>
  )
}

function MoneyRow({ label, amount, quoteReadable, bold, testId }) {
  return (
    <div
      className={
        bold
          ? 'flex items-baseline justify-between py-1.5 text-sm font-bold text-slate-800'
          : 'flex items-baseline justify-between border-b border-slate-100 py-1.5 text-[12.5px] text-slate-600'
      }
    >
      <span>{label}</span>
      <span className="whitespace-nowrap text-slate-800" data-testid={testId}>
        {quoteReadable ? <Money exact amount={amount} /> : <Ltr>—</Ltr>}
      </span>
    </div>
  )
}

// בלוק-הכסף "התוספת לחיוב" — חמש השורות בסדר המאושר, שנגמרות ב"תוספת לחיוב".
// 🚫 לעולם לא `revenue_delta_total` של ה-RPC בתור השורה האחרונה — הוא טרום-הנחה וטרום-מע"מ.
function MoneySummary({ money, quote }) {
  const readable = money !== null
  return (
    <div>
      <div className="text-xs font-bold text-slate-700">התוספת לחיוב</div>
      <div className="mt-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1">
        <MoneyRow label="סכום השינוי" amount={money?.changeAmount} quoteReadable={readable} />
        <MoneyRow
          label={
            <>
              הנחה {readable ? <Ltr>{`${money.discountPercent}%`}</Ltr> : <Ltr>—</Ltr>} — כמו בהצעה
              המקורית
            </>
          }
          amount={money && money.discountAmount !== 0 ? -money.discountAmount : 0}
          quoteReadable={readable}
        />
        <MoneyRow label='לפני מע"מ' amount={money?.preVat} quoteReadable={readable} />
        <MoneyRow
          label={<>מע"מ {readable ? <Ltr>{`${money.vatPercent}%`}</Ltr> : <Ltr>—</Ltr>}</>}
          amount={money?.vatAmount}
          quoteReadable={readable}
        />
        <MoneyRow
          label="תוספת לחיוב"
          amount={money?.total}
          quoteReadable={readable}
          bold
          testId="scope-money-total"
        />
        {readable ? (
          <div className="pb-2 text-[11px] text-slate-500">
            ההנחה זהה לזו שבהצעה — <Ltr>{`${Number(quote.applied_customer_discount) || 0}%`}</Ltr>{' '}
            הנחת-לקוח ועוד <Ltr>{`${Number(quote.manual_discount) || 0}%`}</Ltr> הנחה ידנית. מע"מ
            לפי השיעור שהוקפא באישור ההצעה.
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ConsequenceRow({ label, children }) {
  return (
    <div className="flex gap-2.5 border-b border-slate-100 px-3 py-2 text-xs last:border-b-0">
      <span className="w-[78px] flex-none pt-px text-[11.5px] text-slate-500">{label}</span>
      <span className="leading-relaxed text-slate-700">{children}</span>
    </div>
  )
}

// שורת-הצוות של בלוק-ההשלכה: הדרישה החדשה מול המאושרות-סופית, והסטטוס לפי ≥ (🔄4 —
// over-staffed הוא מוכן; `=` היה מחריג אותו בשקט).
function StaffingConsequence({ hostessState, staffing, requiredHostessCount }) {
  if (!hostessState || !hostessState.changed) {
    return (
      <>
        הדרישה נשארת <Ltr>{String(requiredHostessCount ?? '—')}</Ltr> דיילות — מספר הדיילות אינו
        משתנה בשמירה הזו.
      </>
    )
  }
  const { target, delta, model } = hostessState
  const confirmed = staffing.confirmed
  // המספרים מחושבים ב-src/lib (כלל 14) — הקומפוננטה רק מרנדרת את המודל.
  const { oldGap, newGap, ready } = staffingConsequence({
    confirmed,
    currentTarget: model.effectiveQty,
    newTarget: target,
  })
  return (
    <>
      הדרישה {delta > 0 ? 'תעלה' : 'תרד'} מ-<Ltr>{String(model.effectiveQty)}</Ltr> דיילות ל-
      <Ltr>{String(target)}</Ltr>. מאושרות סופית היום: <Ltr>{String(confirmed)}</Ltr>
      {newGap > 0 ? (
        <>
          , ולכן{' '}
          <span className="font-semibold text-red-600">
            יחסרו <Ltr>{String(newGap)}</Ltr> דיילות במקום <Ltr>{String(oldGap)}</Ltr>
          </span>
        </>
      ) : null}
      . הפרויקט {ready ? 'יעבור למצב "מוכן לביצוע"' : 'יישאר במצב "בתהליך"'}.
    </>
  )
}

function LogisticsConsequence({ changedLogistics, validNewRows }) {
  if (changedLogistics.length === 0 && validNewRows.length === 0) {
    return <>אף פריט לוגיסטי אינו משתנה בשמירה הזו.</>
  }
  return (
    <>
      {changedLogistics.map((s) => (
        <span key={s.model.key}>
          "{s.model.name}" — הכמות המתוכננת תעודכן ל-<Ltr>{String(s.target)}</Ltr> במסך הלוגיסטיקה,
          עם הפניה לשינוי הזה.{' '}
        </span>
      ))}
      {validNewRows.map((s) => (
        <span key={s.row.key}>
          "{s.product.item_name}" — תיפתח שורה חדשה במסך הלוגיסטיקה שמקורה הוא השינוי הזה.{' '}
        </span>
      ))}
    </>
  )
}

// ── גוף-הדיאלוג — ממונטש רק כשהדיאלוג פתוח, ולכן כל פתיחה מתחילה נקייה ─────────────────
function ScopeChangeBody({ project, onOpenChange, onSaved, now }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)
  // "עכשיו" נקבע פעם אחת בטעינה (לא בגוף-הרינדור — `react-hooks/purity`); prop-הרשות
  // `now` קיים כדי שבדיקות יזריקו שעון — "השעון נכנס כפרמטר", העיקרון של src/lib.
  const [loadedAt, setLoadedAt] = useState(null)
  const [qtyInputs, setQtyInputs] = useState({})
  const [newRows, setNewRows] = useState([])
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const projectId = project.project_id

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // ההצעה נקראת דרך ה-api של מודול 3 (תקדים: CustomerDetailsPage) — היא מקור המחיר
        // הקפוא. קורא בלי 'הצעות מחיר' מקבל null בלי שגיאה ⇒ עמודות-הכסף מציגות '—', לא 0.
        // 🚫 בלי .catch כאן: getQuote כבר מחזיר null על קריאה-חסומה (maybeSingle) וזורק רק על
        // כשל אמיתי — בליעתו הייתה מציגה תקלת-רשת כ"אין הרשאה" (מקפים) בעוד המסך נשאר שמיש.
        const [quote, catalog, logisticsRows, assignments] = await Promise.all([
          getQuote(project.quote_id),
          getPricingCatalog(),
          getProjectLogistics(projectId),
          getProjectAssignments(projectId),
        ])
        if (!alive) return
        setData({ quote, catalog, logisticsRows, assignments })
        setLoadedAt(now ? new Date(now) : new Date())
        const models = buildLineModels({
          quote,
          products: catalog.products,
          logisticsRows,
          requiredHostessCount: project.required_hostess_count,
        })
        setQtyInputs(Object.fromEntries(models.map((m) => [m.key, String(m.effectiveQty)])))
        setLoadError(null)
      } catch (err) {
        // ההודעה העברית של העוטף היא שורת-הפירוט (מה חסר); השורה הנעולה "לא ניתן
        // לטעון את הנתונים." מגיעה מ-PermissionAwareEmpty — לא משוכפלת לכאן.
        if (alive) setLoadError(err?.message ?? 'שגיאה לא צפויה.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- טעינה בפתיחה וברענון בלבד
  }, [reloadTick])

  if (loading) {
    return <LoadingOrError loading skeleton={{ variant: 'table' }} />
  }
  if (loadError) {
    // הצורה הנעולה של §3.7: שורה ראשונה "לא ניתן לטעון את הנתונים." (נעולה בתוך
    // PermissionAwareEmpty — אותה צורה כמו כשל-הטעינה של הכרטיס), שורה שנייה — ההודעה
    // העברית של העוטף שנכשל (מה חסר), וכפתור "נסי שוב".
    return (
      <PermissionAwareEmpty
        state="error"
        detail={loadError}
        onRetry={() => {
          setLoading(true)
          setReloadTick((t) => t + 1)
        }}
        testId="scope-load-error"
      />
    )
  }

  const quote = data.quote
  const products = data.catalog.products ?? []
  const tiers = data.catalog.tiers ?? []

  const lineModels = buildLineModels({
    quote,
    products,
    logisticsRows: data.logisticsRows,
    requiredHostessCount: project.required_hostess_count,
  })
  const lineStates = deriveLineStates(lineModels, qtyInputs)
  const newRowStates = deriveNewRowStates(newRows, products, tiers)

  const quoteSkus = new Set((quote?.quote_services ?? []).map((s) => s.sku))
  const projectSkus = new Set((data.logisticsRows ?? []).map((r) => r.sku))
  // מוצר פעיל בלבד, לא-דיילות, ולא מק"ט שכבר קיים באירוע — שלושת הסירובים שה-RPC היה
  // מחזיר ממילא; הסינון חוסך למשתמשת סירוב-שרת צפוי.
  const addableProducts = products.filter(
    (p) =>
      p.status === 'active' &&
      p.category !== 'hostess' &&
      !quoteSkus.has(p.sku) &&
      !projectSkus.has(p.sku),
  )

  const changedLines = lineStates.filter((s) => s.changed)
  const validNewRows = newRowStates.filter((s) => s.valid)
  const changedCount = changedLines.length + validNewRows.length
  const hasInputError = lineStates.some((s) => s.error) || newRowStates.some((s) => s.error)

  const money = quote
    ? computeScopeChangeMoney(
        [
          ...changedLines.map((s) => ({
            deltaQty: s.delta,
            unitPriceSnapshot: s.model.frozenPrice,
          })),
          ...validNewRows.map((s) => ({ deltaQty: s.qty, unitPriceSnapshot: s.price })),
        ],
        quote.applied_customer_discount,
        quote.manual_discount,
        quote.vat_rate_snapshot,
      )
    : null
  const quoteTotal = safeQuoteTotal(quote)
  // שורת-"חיוב": החיבור בשכבת-lib (כלל 14, חשבון-אגורות) — null ⇒ '—', לעולם לא 0.
  const totalAfterChange = projectTotalAfterChange(quoteTotal, money?.total ?? null)

  const hostessState = lineStates.find((s) => s.model.kind === 'hostess') ?? null
  const staffing = staffingMetric(data.assignments ?? [], project.required_hostess_count)
  const lateChange = deriveLateBanner({ changedLines, validNewRows, project, loadedAt })
  const hostessReduction = hostessState && hostessState.delta !== null && hostessState.delta < 0

  // ③ↄ — הודעת חציית-מדרגה, בלי שום ספרת ₪ (התוספת מחויבת במחיר הקפוא).
  const tierNotices = changedLines
    .filter((s) => s.model.kind === 'logistics' && s.delta > 0 && s.model.product)
    .map((s) => tierCrossingNotice(s.model.product, tiers, s.model.effectiveQty, s.target))
    .filter(Boolean)

  const reasonEmpty = reason.trim() === ''
  const saveDisabled = submitting || changedCount === 0 || hasInputError || reasonEmpty

  const handleSave = async () => {
    if (saveDisabled) return
    setSubmitting(true)
    setServerError('')
    try {
      // 📜 חוזה-הפיילוד: target · sku · serial_number · target_qty — ותו לא. `target_qty`
      // הוא **היעד החדש**; שורת-דיילות בלי sku ובלי serial; שורה חדשה בלי מפתח serial בכלל.
      const pLines = [
        ...changedLines.map((s) =>
          s.model.kind === 'hostess'
            ? { target: 'hostess_count', target_qty: s.target }
            : {
                target: 'logistics',
                sku: s.model.sku,
                serial_number: s.model.serialNumber,
                target_qty: s.target,
              },
        ),
        ...validNewRows.map((s) => ({ target: 'logistics', sku: s.row.sku, target_qty: s.qty })),
      ]
      const result = await applyScopeChange(projectId, pLines, reason.trim())
      onSaved?.(result)
      onOpenChange?.(false)
    } catch (err) {
      // הודעת-השרת העברית מוצגת כלשונה (rpcErrorMessage בעוטף) — "השמירה נכשלה" גנרי
      // הוא בדיוק ה"ותסיק שהמערכת שבורה" של §2.5(א).
      setServerError(err?.message ?? 'שמירת שינוי התכולה נכשלה.')
    } finally {
      setSubmitting(false)
    }
  }

  const todayIso = loadedAt.toISOString().slice(0, 10)
  const proximity = proximitySentence(eventDaysFromToday(project.final_event_date, todayIso))
  const statusLabel = PROJECT_STATUS_LABELS[project.project_status] ?? null

  return (
    <>
      {/* פס-הזהות — תווית וערך באותו תא (עיקרון LtrFieldGroup: לעולם לא שתי שורות מקבילות) */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <IdentityCell label="האירוע">{project.event_name ?? '—'}</IdentityCell>
        <IdentityCell label="לקוח">{project.customer_name ?? '—'}</IdentityCell>
        <IdentityCell label="מועד">
          <Ltr>{formatDate(project.final_event_date, '—')}</Ltr>
          {proximity ? ` · ${proximity}` : ''}
        </IdentityCell>
        <IdentityCell label="שעות">
          <Ltr>{formatTimeRange(project.final_start_time, project.final_end_time)}</Ltr>
        </IdentityCell>
        <IdentityCell label="מצב">
          <StatusTag label={statusLabel} />
        </IdentityCell>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-700">
          מה משתנה{' '}
          <span className="font-normal text-slate-500">
            — מחירי היחידה מגיעים מההצעה המאושרת ואינם ניתנים לעריכה. משנים כמויות בלבד.
          </span>
        </div>

        <table className="mt-1.5 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-[34%] border-b border-slate-200 px-2 py-1.5 text-right text-[11.5px] font-semibold text-slate-500">
                פריט
              </th>
              <th className={`w-[15%] ${NUM_TH}`}>מחיר ליח' · קפוא</th>
              <th className={`w-[13%] ${NUM_TH}`}>כמות בתוקף</th>
              <th className={`w-[13%] ${NUM_TH}`}>כמות חדשה</th>
              <th className={`w-[10%] ${NUM_TH}`}>הפרש</th>
              <th className={`w-[15%] ${NUM_TH}`}>סכום השינוי</th>
            </tr>
          </thead>
          <tbody>
            {lineStates.map((state) => (
              <ExistingLineRow
                key={state.model.key}
                state={state}
                quoteReadable={Boolean(quote)}
                submitting={submitting}
                onQtyChange={(key, value) => setQtyInputs((prev) => ({ ...prev, [key]: value }))}
              />
            ))}
            {newRowStates.map((state, i) => (
              <NewItemRow
                key={state.row.key}
                state={state}
                index={i}
                addableProducts={addableProducts}
                submitting={submitting}
                onChange={(key, patch) =>
                  setNewRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
                }
                onRemove={(key) => setNewRows((prev) => prev.filter((r) => r.key !== key))}
              />
            ))}
          </tbody>
        </table>

        <div className="pt-2">
          <button
            type="button"
            className="text-[12.5px] font-semibold whitespace-nowrap text-teal-700"
            data-testid="scope-add-item"
            disabled={submitting}
            onClick={() =>
              setNewRows((prev) => [
                ...prev,
                { key: `new-${Date.now()}-${prev.length}`, sku: '', qty: '' },
              ])
            }
          >
            + הוספת פריט שאינו בהצעה
          </button>
          <span className="mr-2 text-[11.5px] text-slate-400">
            פריט חדש נכנס לפי מדרגת-המחיר בקטלוג היום, ומקבל את הנחת ההצעה
          </span>
        </div>
      </div>

      {/* ① שינוי מאוחר — ענבר, מודיע בלבד. הכפתור נשאר פעיל (⑯ — אין סף-שעון חוסם). */}
      {lateChange ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
          data-testid="scope-late-banner"
        >
          {lateChange}
        </div>
      ) : null}

      {/* ② צמצום — מי משחרר: מנהלת הגיוס, במסך שלה. לא מכאן (ההבחנה ⑤-מול-צמצום). */}
      {hostessReduction ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
          data-testid="scope-reduction-banner"
        >
          <b>
            ⚠ הדרישה תרד ל-<Ltr>{String(hostessState.target)}</Ltr> דיילות.
          </b>{' '}
          המערכת <b>לא</b> תשחרר אף דיילת מכאן — <b>מנהלת הגיוס בוחרת את מי לשחרר</b> במסך שלה,
          והמשוחררות יקבלו את מייל "חל שינוי בתכולה".
        </div>
      ) : null}

      {tierNotices.map((notice) => (
        <div key={notice} className="text-[11.5px] text-slate-500" data-testid="scope-tier-notice">
          {notice}
        </div>
      ))}

      <MoneySummary money={money} quote={quote} />

      {/* בלוק-ההשלכה — מדווח ולא מבצע ⇒ לבן+מסגרת, לא ענבר (כרטיס §⑧ח) */}
      <div>
        <div className="text-xs font-bold text-slate-700">מה יקרה כשתשמרי</div>
        <div className="mt-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ConsequenceRow label="צוות">
            <StaffingConsequence
              hostessState={hostessState}
              staffing={staffing}
              requiredHostessCount={project.required_hostess_count}
            />
          </ConsequenceRow>
          <ConsequenceRow label="לוגיסטיקה">
            <LogisticsConsequence
              changedLogistics={changedLines.filter((s) => s.model.kind === 'logistics')}
              validNewRows={validNewRows}
            />
          </ConsequenceRow>
          <ConsequenceRow label="מיילים">
            {/* 🔴 מילולית מהמדריך: הגיוס הוא המסך של מנהלת הגיוס, לא מייל מכאן. */}
            <b>לא יישלח מייל לאף דיילת.</b> גיוס הדיילות הנוספות נעשה במסך השיבוץ של מנהלת הגיוס.
          </ConsequenceRow>
          <ConsequenceRow label="חיוב">
            ההצעה המאושרת אינה משתנה. סה"כ לפרויקט אחרי השינוי:{' '}
            <b className="whitespace-nowrap">
              {totalAfterChange !== null ? <Money exact amount={totalAfterChange} /> : <Ltr>—</Ltr>}
            </b>
            .
          </ConsequenceRow>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-xs font-bold text-slate-700">סיבת השינוי</div>
        <label className="text-xs text-slate-500" htmlFor="scope-change-reason">
          מה קרה, במילים שלך
        </label>
        <textarea
          id="scope-change-reason"
          rows={2}
          value={reason}
          disabled={submitting}
          data-testid="scope-reason"
          placeholder="למשל: רון גל הודיע ב-12/08 שיגיעו עוד 80 אורחים וביקש להוסיף 2 דיילות"
          className={`w-full resize-y rounded-lg border px-3 py-2 text-right text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-300 ${
            reasonEmpty && changedCount > 0 ? 'border-red-600' : 'border-slate-300'
          }`}
          onChange={(e) => setReason(e.target.value)}
        />
        {reasonEmpty && changedCount > 0 ? (
          <span
            className="text-[11px] font-semibold text-red-600"
            role="alert"
            data-testid="scope-reason-error"
          >
            {EMPTY_REASON_MESSAGE}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">
            חובה. בלי סיבה אי-אפשר לשמור. הסיבה נשמרת עם השינוי ומוצגת בהיסטוריה שבלשונית
            הלוגיסטיקה.
          </span>
        )}
      </div>

      <div className="text-[11px] text-slate-500">
        יירשם אוטומטית: {user?.fullName ?? user?.email ?? '—'} ·{' '}
        <Ltr>{formatTimestamp(loadedAt.toISOString())}</Ltr>
      </div>

      {serverError ? (
        <p
          className="text-sm font-semibold text-red-600"
          role="alert"
          data-testid="scope-server-error"
        >
          {serverError}
        </p>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          className="h-auto rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
          disabled={saveDisabled}
          data-testid="scope-save"
          onClick={handleSave}
        >
          {submitting ? 'שומר...' : 'שמור שינוי תכולה'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
          disabled={submitting}
          onClick={() => onOpenChange?.(false)}
        >
          ביטול
        </Button>
        {changedCount === 0 ? (
          <span className="self-center text-[11.5px] text-slate-400" data-testid="scope-no-change">
            {NO_CHANGE_MESSAGE}
          </span>
        ) : null}
      </DialogFooter>
    </>
  )
}

export default function ScopeChangeDialog({ project, open, onOpenChange, onSaved, now }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>שינוי תכולה</DialogTitle>
          <DialogDescription>
            משנים <b>כמויות בלבד</b>. ההצעה שהלקוח אישר נשארת כפי שהיא — השינוי נרשם בשורה נפרדת
            ומתווסף לחיוב.
          </DialogDescription>
        </DialogHeader>
        {open && project ? (
          <ScopeChangeBody
            project={project}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
            now={now}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
