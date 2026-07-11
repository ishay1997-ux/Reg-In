// אזור השיווק (מסך 5.6.3, מוקאפ 01) — העלאת חומר שיווקי ושליחתו ללקוחות שמאושרים לדיוור.
// מודל-השליחה במודול 2 זמני (הכרעת ישי 06/07): mailto עם BCC של המאושרים + קישור ציבורי לקובץ.
// 🚧 מ10 — שליחת-שרת אמיתית + מעקב-שליחות (רשום ב-PROJECT_MASTER §6 "שליחת חומר שיווקי אמיתית").
// edit-only: כל הפקדים כאן מותנים בהרשאת edit (העמוד מרנדר את הפאנל רק ל-edit; שכבת ה-RLS/Storage
// היא החומה האמיתית — כלל 9).

import { useEffect, useState } from 'react'
import { Upload, Send, Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ToastProvider'
import { cn } from '@/lib/utils'
import {
  uploadMarketingFile,
  getMarketingPublicUrl,
  getConsentedCustomerEmails,
  MARKETING_ALLOWED_MIME,
} from '@/modules/02_customers/api'

// mailto ארוך מדי נחתך בשקט ע"י מערכת-ההפעלה (~2,000 תווים ב-Windows) — חלק מהנמענים לא יקבלו
// דיוור בלי שום שגיאה. לכן סף-בטיחות מתחת לגבול: מעליו לא מרנדרים mailto חתוך — משביתים ומפנים
// ל"העתק רשימת נמענים". (השליחה האמיתית בלי מגבלה = מודול 10.)
const MAILTO_MAX_CHARS = 1900

const SUBJECT = 'חומר שיווקי מ-REG-IN'

// הסכמה דקדוקית לספירת-הנמענים (0 / יחיד / רבים) — "1 לקוחות אישרו" שגוי; ל-1 נדרש לשון-יחיד.
function consentedPhrase(count) {
  if (count === 0) return 'אין לקוחות שאישרו קבלת דיוור'
  if (count === 1) return 'לקוח אחד אישר קבלת דיוור'
  return `${count} לקוחות אישרו קבלת דיוור`
}

export default function MarketingPanel({ refreshKey, embedded = false }) {
  const toast = useToast() // התראה אחידה (במקום window.alert) — כשל-העתקה ללוח
  const [consentedEmails, setConsentedEmails] = useState([])
  const [uploaded, setUploaded] = useState(null) // { path, name }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('') // 'link' | 'recipients' — משוב זמני

  // נמענים דרך ה-SSOT (api.getConsentedCustomerEmails מרכז את הפרדיקט consent=true AND active).
  // refreshKey משתנה בעמוד-האב בכל טעינה/שינוי-הסכמה — כדי שהרשימה כאן לא תפגר אחרי מתג ברשימה.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const emails = await getConsentedCustomerEmails()
        if (!cancelled) setConsentedEmails(emails)
      } catch {
        if (!cancelled) setConsentedEmails([])
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
      setUploaded({ path, name: file.name })
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

  const publicUrl = uploaded ? getMarketingPublicUrl(uploaded.path) : ''
  const bccList = consentedEmails.join(',')
  // subject+body מקודדים ב-encodeURIComponent (load-bearing): ה-& וה-? בתוך ה-URL הציבורי היו
  // חותכים את גוף ה-mailto אחרת. ה-body נושא את הקישור הציבורי לחומר.
  const body = `לצפייה בחומר השיווקי: ${publicUrl}`
  const mailtoHref = uploaded
    ? `mailto:?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(
        SUBJECT,
      )}&body=${encodeURIComponent(body)}`
    : ''

  const hasRecipients = consentedEmails.length > 0
  const tooLong = mailtoHref.length > MAILTO_MAX_CHARS
  // "שלח" פעיל רק כשיש קובץ וגם נמענים — ולא כשה-mailto ייחתך בשקט (אז מפנים ל"העתק רשימת נמענים").
  const canSend = !!uploaded && hasRecipients && !tooLong

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
      {/* כשמוטמע בדיאלוג — הכותרת והרקע מגיעים מ-DialogContent; מציגים רק את מונה-המאושרים. */}
      {embedded ? (
        <p className="text-sm text-slate-500" data-testid="marketing-consented-count">
          {consentedPhrase(consentedEmails.length)}.
        </p>
      ) : (
        <div>
          <h2 className="text-lg font-bold text-slate-800">אזור שיווק</h2>
          <p className="text-sm text-slate-500 mt-1">
            העלו חומר שיווקי ושלחו אותו ללקוחות שאישרו קבלת דיוור.{' '}
            {consentedPhrase(consentedEmails.length)}.
          </p>
        </div>
      )}

      {/* אזור ההעלאה — קלט קובץ מוסתר מאחורי כפתור (בלי drag-drop, הכרעת P13) */}
      <div className="flex items-center gap-3 flex-wrap">
        <label
          className="inline-flex items-center gap-2 h-auto py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer hover:bg-slate-50"
          data-testid="marketing-upload-label"
        >
          <Upload className="size-4" />
          {uploaded ? 'החלף קובץ' : 'העלה קובץ'}
          <input
            type="file"
            accept={MARKETING_ALLOWED_MIME.join(',')}
            onChange={handleFileChange}
            disabled={busy}
            className="hidden"
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

      <p className="text-xs text-slate-400">קבצים נתמכים: PDF, JPG, PNG · עד 10MB.</p>

      {error && (
        <p className="text-red-600 text-sm" data-testid="marketing-error">
          {error}
        </p>
      )}

      {/* אזהרת קיטוע-שקט: יותר מדי נמענים לרשימת BCC ב-mailto */}
      {uploaded && tooLong && (
        <p
          className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3"
          data-testid="marketing-toolong"
        >
          רשימת הנמענים ארוכה מדי לשליחה דרך תוכנת הדוא"ל (חלק מהנמענים היו נחתכים בשקט). השתמשו
          ב"העתק רשימת נמענים" ושלחו ידנית, או המתינו לשליחת-השרת (מודול 10).
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
            שלח ללקוחות מאושרים
          </a>
        ) : (
          <span
            className="inline-flex items-center gap-2 h-auto py-2.5 px-4 rounded-lg bg-slate-200 text-slate-400 font-semibold cursor-not-allowed"
            title={
              !uploaded
                ? 'יש להעלות קובץ תחילה'
                : !hasRecipients
                  ? 'אין לקוחות שאישרו דיוור'
                  : 'רשימת הנמענים ארוכה מדי — השתמשו בהעתקה'
            }
            data-testid="marketing-send-disabled"
          >
            <Send className="size-4" />
            שלח ללקוחות מאושרים
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
          onClick={() => copyToClipboard(consentedEmails.join(', '), 'recipients')}
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
