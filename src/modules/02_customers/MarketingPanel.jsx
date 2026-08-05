// אזור השיווק (מסך 5.6.3, מוקאפ 01) — העלאת חומר שיווקי ושליחתו ללקוחות שמאושרים לדיוור.
// מודל-השליחה במודול 2 זמני (הכרעת ישי 06/07): mailto עם BCC של המאושרים + קישור ציבורי לקובץ.
// 🚧 מ10 — שליחת-שרת אמיתית + מעקב-שליחות (רשום ב-PROJECT_MASTER §6 "שליחת חומר שיווקי אמיתית").
// edit-only: כל הפקדים כאן מותנים בהרשאת edit (העמוד מרנדר את הפאנל רק ל-edit; שכבת ה-RLS/Storage
// היא החומה האמיתית — כלל 9).
//
// רדיזיין 11/07 (הכרעת-ישי): במקום מונה-אטום — **רשימת-נמענים** עם צ'קבוקס לכל לקוח מאושר (וי בדיפולט)
// + תצוגה-מקדימה של החומר. ביטול-וי = החרגה **לשליחה הזו בלבד**; ההסכמה-הקבועה (המתג ברשימת-הלקוחות)
// לא משתנה כאן. השליחה עצמה נשארת mailto (המכניקה האמיתית = מ10).

import { useEffect, useState } from 'react'
import { Upload, Send, Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ToastProvider'
import { CUSTOMER_TYPE_LABELS } from '@/lib/customers'
import { cn } from '@/lib/utils'
import {
  buildMarketingMailtoHref,
  dedupeEmails,
  disabledSendReason,
  isMailtoTooLong,
  marketingPreviewKind,
  selectRecipients,
} from '@/lib/marketing'
import {
  uploadMarketingFile,
  getMarketingPublicUrl,
  getConsentedCustomers,
  MARKETING_ALLOWED_MIME,
  MARKETING_MAX_BYTES,
} from '@/modules/02_customers/api'

// כללי-השליחה (סף-הקיטוע, נושא הדיוור, בניית ה-mailto, סיבת-ההשבתה) עברו ל-`@/lib/marketing`
// ב-29/07/2026 — SSOT יחיד עם בדיקות-יחידה (כלל 14). כאן נשאר רק ה-UI.

export default function MarketingPanel({ refreshKey, embedded = false }) {
  const toast = useToast() // התראה אחידה (במקום window.alert) — כשל-העתקה ללוח
  const [recipients, setRecipients] = useState([]) // לקוחות מאושרים-פעילים (שורות מלאות)
  // החרגות פר-שליחה (§Q3, הכרעת-ישי): customer_id שהוסר-לו-הוי לשליחה הנוכחית בלבד. לא נוגע ב-DB.
  const [excludedIds, setExcludedIds] = useState(() => new Set())
  const [uploaded, setUploaded] = useState(null) // { path, name, type }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('') // 'link' | 'recipients' — משוב זמני
  const [recipientsError, setRecipientsError] = useState(false) // כשל-טעינת המאושרים — נבדל מ"אין מאושרים"

  // נמענים דרך ה-SSOT (api.getConsentedCustomers מרכז את הפרדיקט consent=true AND active).
  // refreshKey משתנה בעמוד-האב בכל טעינה/שינוי-הסכמה — כדי שהרשימה כאן לא תפגר אחרי מתג ברשימה.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await getConsentedCustomers()
        if (!cancelled) {
          setRecipients(rows)
          // הקהל השתנה ⇒ ברירת-מחדל "כולם נבחרים" (מאפסים החרגות פר-שליחה קודמות).
          setExcludedIds(new Set())
          setRecipientsError(false)
        }
      } catch {
        // כשל-טעינה נבדל מ"אין מאושרים" (תיקון 11/07): דגל-שגיאה גלוי במקום רשימה-ריקה מטעה.
        if (!cancelled) {
          setRecipients([])
          setRecipientsError(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // איפוס כדי שאפשר יהיה לבחור שוב את אותו קובץ אחרי "הסר"
    if (!file) return
    setError('')
    setBusy(true)
    try {
      // §7.36 (מעוגן): במודול 2 ההעלאה היא פעולת-Storage יחידה (אין כתיבת-DB מזווגת) — אין תרחיש
      // קובץ-יתום כאן. הולידציה (סוג/גודל) חיה ב-api.uploadMarketingFile, לא משוכפלת כאן.
      const { path } = await uploadMarketingFile(file)
      // type נשמר לתצוגה-המקדימה (תמונה מול PDF); הוא נבדק כבר ב-uploadMarketingFile מול MARKETING_ALLOWED_MIME.
      setUploaded({ path, name: file.name, type: file.type })
    } catch (err) {
      setError(err.message || 'העלאת הקובץ נכשלה.')
    } finally {
      setBusy(false)
    }
  }

  function handleRemove() {
    setUploaded(null)
    setError('')
    setCopied('')
  }

  function toggleRecipient(customerId) {
    setExcludedIds((prev) => {
      const next = new Set(prev)
      if (next.has(customerId)) next.delete(customerId)
      else next.add(customerId)
      return next
    })
  }

  const allSelected = excludedIds.size === 0
  function toggleAll() {
    // כולם-נבחרים ⇒ "נקה הכל" (מחריג את כולם); אחרת ⇒ "בחר הכל" (מנקה את ההחרגות).
    if (allSelected) setExcludedIds(new Set(recipients.map((r) => r.customer_id)))
    else setExcludedIds(new Set())
  }

  // הנמענים שנבחרו לשליחה הנוכחית; ה-BCC נגזר מהם עם dedup על email (email אינו UNIQUE §7.65).
  const checkedRecipients = selectRecipients(recipients, excludedIds)
  const bccEmails = dedupeEmails(checkedRecipients)

  const publicUrl = uploaded ? getMarketingPublicUrl(uploaded.path) : ''
  const mailtoHref = buildMarketingMailtoHref({ hasFile: !!uploaded, publicUrl, bccEmails })

  const hasRecipients = checkedRecipients.length > 0
  const tooLong = isMailtoTooLong(mailtoHref)
  // "שלח" פעיל רק כשיש קובץ וגם נמענים מסומנים — ולא כשה-mailto ייחתך בשקט (אז מפנים ל"העתק רשימת נמענים").
  const canSend = !!uploaded && hasRecipients && !tooLong

  const previewKind = marketingPreviewKind(uploaded?.type)

  async function copyToClipboard(text, kind) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      // המשוב נעלם אחרי רגע — לא צריך state מתמשך
      setTimeout(() => setCopied(''), 1500)
    } catch {
      toast.error('העתקה נכשלה — ניתן להעתיק ידנית.')
    }
  }

  return (
    <div
      className={cn('flex flex-col gap-4', !embedded && 'bg-white rounded-2xl shadow-md p-6')}
      data-testid="marketing-panel"
    >
      {/* כשמוטמע בדיאלוג — הכותרת והרקע מגיעים מ-DialogContent; כותרת-הרשימה למטה מציגה את הספירה. */}
      {!embedded && (
        <div>
          <h2 className="text-lg font-bold text-slate-800">אזור שיווק</h2>
          <p className="text-sm text-slate-500 mt-1">
            העלו חומר שיווקי, בחרו נמענים מבין הלקוחות שאישרו דיוור, ושלחו.
          </p>
        </div>
      )}

      {/* אזור ההעלאה — קלט קובץ נגיש-למקלדת (sr-only) מאחורי label-ככפתור (בלי drag-drop, הכרעת P13) */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* נגישות-מקלדת (תיקון 11/07): הקלט היה display:none ולכן מחוץ ל-tab-order — הפעולה המרכזית
            של הפאנל נחסמה למקלדת. sr-only שומר אותו ב-tab-order; focus-within מסמן מיקוד על ה-label. */}
        <label
          className="inline-flex items-center gap-2 h-auto py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-500"
          data-testid="marketing-upload-label"
        >
          <Upload className="size-4" />
          {uploaded ? 'החלף קובץ' : 'העלה קובץ'}
          <input
            type="file"
            accept={MARKETING_ALLOWED_MIME.join(',')}
            onChange={handleFileChange}
            disabled={busy}
            aria-label={uploaded ? 'החלף קובץ שיווקי' : 'העלה קובץ שיווקי'}
            className="sr-only"
            data-testid="marketing-file-input"
          />
        </label>

        {uploaded && (
          <div
            className="flex items-center gap-2 text-sm text-slate-600"
            data-testid="marketing-uploaded-name"
          >
            <span className="font-medium">{uploaded.name}</span>
            <Button
              type="button"
              variant="link"
              title="הסר קובץ"
              aria-label="הסר את הקובץ שהועלה"
              onClick={handleRemove}
              className="h-auto p-0 text-red-600 hover:text-red-700"
              data-testid="marketing-remove"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        {busy && <span className="text-sm text-slate-400">מעלה...</span>}
      </div>

      {/* המגבלה נגזרת מ-MARKETING_MAX_BYTES ולא מוקלדת — היא נאכפת ב-api.uploadMarketingFile,
          וטקסט מקודד-קשיח כאן היה סוטה ממנה בשקט ביום שהמגבלה תשתנה. */}
      <p className="text-xs text-slate-500">
        קבצים נתמכים: PDF, JPG, PNG · עד {MARKETING_MAX_BYTES / 1024 / 1024}MB.
      </p>

      {/* תצוגה-מקדימה של החומר שהועלה (רדיזיין 11/07) — כדי לראות מה נשלח לפני השליחה. גודל בינוני. */}
      <MarketingPreview kind={previewKind} url={publicUrl} name={uploaded?.name} />

      {error && (
        <p className="text-red-600 text-sm" data-testid="marketing-error">
          {error}
        </p>
      )}

      <RecipientsSection
        recipientsError={recipientsError}
        recipients={recipients}
        excludedIds={excludedIds}
        checkedCount={checkedRecipients.length}
        allSelected={allSelected}
        onToggleAll={toggleAll}
        onToggleRecipient={toggleRecipient}
      />

      {/* אזהרת קיטוע-שקט: יותר מדי נמענים מסומנים לרשימת BCC ב-mailto */}
      {uploaded && tooLong && (
        <p
          className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3"
          data-testid="marketing-toolong"
        >
          רשימת הנמענים ארוכה מדי לשליחה דרך תוכנת הדוא"ל (חלק מהנמענים היו נחתכים בשקט). בטלו חלק
          מהנמענים, השתמשו ב"העתק רשימת נמענים" ושלחו ידנית, או המתינו לשליחת-השרת (מודול 10).
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {/* "שלח" = עוגן mailto (ה-href נבדק ב-verify). מושבת ⇒ כפתור אפור בלי href */}
        {canSend ? (
          <a
            href={mailtoHref}
            className="inline-flex items-center gap-2 h-auto py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            data-testid="marketing-send"
          >
            <Send className="size-4" />
            שלח לנמענים שנבחרו
          </a>
        ) : (
          <span
            className="inline-flex items-center gap-2 h-auto py-2.5 px-4 rounded-lg bg-slate-200 text-slate-500 font-semibold cursor-not-allowed"
            title={disabledSendReason({
              hasFile: !!uploaded,
              selectedCount: checkedRecipients.length,
              consentedCount: recipients.length,
            })}
            data-testid="marketing-send-disabled"
          >
            <Send className="size-4" />
            שלח לנמענים שנבחרו
          </span>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={!uploaded}
          onClick={() => copyToClipboard(publicUrl, 'link')}
          className="h-auto py-2.5 px-4 rounded-lg border-slate-300 text-slate-700 gap-2"
          data-testid="marketing-copy-link"
        >
          <Copy className="size-4" />
          העתק קישור
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!hasRecipients}
          onClick={() => copyToClipboard(bccEmails.join(', '), 'recipients')}
          className="h-auto py-2.5 px-4 rounded-lg border-slate-300 text-slate-700 gap-2"
          data-testid="marketing-copy-recipients"
        >
          <Copy className="size-4" />
          העתק רשימת נמענים
        </Button>

        {copied && (
          <span className="text-sm text-green-600" data-testid="marketing-copied">
            {copied === 'link' ? 'הקישור הועתק' : 'רשימת הנמענים הועתקה'}
          </span>
        )}
      </div>
    </div>
  )
}

// ⚠️ שתי תת-הקומפוננטות הבאות חייבות להישאר **ברמת-המודול** ולא בתוך MarketingPanel: קומפוננטה
// מקוננת מקבלת זהות חדשה בכל render, React מרנדר מחדש את כל התת-עץ, ה-<embed> של ה-PDF מהבהב
// והמיקוד בצ'קבוקסים אובד באמצע ניווט-מקלדת. אין כלל-lint שתופס את זה. אינן מיוצאות בכוונה
// (‏`react-refresh/only-export-components`) — כמו DetailRow/MetricCard ב-CustomerDetailsPage.

// תצוגה-מקדימה של החומר שהועלה. kind ריק = אין מה להציג (אותו שער כמו התנאי המקורי בקומפוננטה).
function MarketingPreview({ kind, url, name }) {
  if (!kind) return null
  return (
    <div
      className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
      data-testid="marketing-preview"
    >
      {kind === 'image' ? (
        <img
          src={url}
          alt={`תצוגה מקדימה: ${name}`}
          className="max-h-64 w-auto mx-auto object-contain"
        />
      ) : (
        <embed src={url} type="application/pdf" className="w-full h-64" />
      )}
    </div>
  )
}

// רשימת-הנמענים (רדיזיין 11/07): הלקוחות המאושרים-לדיוור, כל אחד עם צ'קבוקס לבחירה פר-שליחה
// (וי בדיפולט). ביטול-וי = החרגה מהשליחה הזו בלבד — ההסכמה הקבועה (המתג ברשימת-הלקוחות) לא משתנה.
// שלושת המצבים כ-return מוקדם ולא כשרשרת-טרנארי: אותו DOM בדיוק, קריא יותר, ובלי עומק-קינון.
function RecipientsSection({
  recipientsError,
  recipients,
  excludedIds,
  checkedCount,
  allSelected,
  onToggleAll,
  onToggleRecipient,
}) {
  // כשל-טעינה נבדל מ"אין מאושרים" (תיקון 11/07): דגל-שגיאה גלוי במקום רשימה-ריקה מטעה.
  if (recipientsError) {
    return (
      <p className="text-amber-700 text-sm" role="alert" data-testid="marketing-recipients-error">
        שגיאה בטעינת רשימת הנמענים המאושרים.
      </p>
    )
  }
  if (recipients.length === 0) {
    return (
      <p className="text-sm text-slate-500" data-testid="marketing-no-recipients">
        אין לקוחות שאישרו קבלת דיוור.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-2" data-testid="marketing-recipients">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          נמענים — {checkedCount} מתוך {recipients.length} נבחרו
        </span>
        <Button
          type="button"
          variant="link"
          onClick={onToggleAll}
          className="h-auto p-0 text-teal-600 hover:text-teal-700 text-sm"
          data-testid="marketing-recipients-toggle-all"
        >
          {allSelected ? 'נקה הכל' : 'בחר הכל'}
        </Button>
      </div>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
        {recipients.map((r) => (
          <label
            key={r.customer_id}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50"
            data-testid="marketing-recipient-row"
          >
            <input
              type="checkbox"
              checked={!excludedIds.has(r.customer_id)}
              onChange={() => onToggleRecipient(r.customer_id)}
              className="size-4 shrink-0 accent-teal-600"
              aria-label={`שלח ל${r.company_name}`}
              data-testid="marketing-recipient-checkbox"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-700 truncate">{r.company_name}</div>
              <div className="text-xs text-slate-500 truncate">
                {r.contact_name} · <span dir="ltr">{r.email}</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 shrink-0 text-left">
              {CUSTOMER_TYPE_LABELS[r.customer_type] ?? r.customer_type}
              {Number(r.discount_percent) > 0 && ` · ${Number(r.discount_percent)}%`}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
