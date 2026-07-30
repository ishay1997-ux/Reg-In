// חלון "צפייה במסמך" — המסמך שהלקוח מקבל, כפי שהוא (צעד 3.3).
//
// למה חלון ולא הורדה ישירה (הכרעת-ישי 29/07/2026): לפני ששולחים מסמך ללקוח רוצים לראות
// אותו. הורדה-ישירה מחייבת לפתוח את סייר-הקבצים, לבדוק, ואם משהו שגוי — לחזור לסבב שלם.
// ⚠️ האייקון בשורת-הטבלה הוא **עין** ולא חץ-הורדה, בהכרעתו המפורשת: כפתור שפותח חלון-צפייה
// ומסומן בחץ-הורדה משקר על מה שיקרה בלחיצה.
//
// 🧨 מוקש מצעד 3.1 — התצוגה חייבת להיות <iframe src={blobURL}>, לעולם לא pdf.js:
// המציג המובנה של Chrome (pdfium) מרנדר את הקבצים האלה מושלם, ואילו pdf.js **דוחה את
// תת-הגופן** ש-@react-pdf/renderer מטמיע (OTS parsing error: maxp: Bad maxZones) ומשמיט
// אותיות צרות. עלה שעה שלמה של מרדף אחרי "באג" שקיים רק בכלי-האבחון. ר' 03_quotes/CLAUDE.md.
//
// 📧 שליחה במייל (צעד 3.4 — עודכן 30/07/2026): **לא mailto**. ישי ביקש שליחה אמיתית, לא
// הורדה+צירוף-ידני — הזרימה: Edge Function `send-quote-email` ← Make webhook ← Gmail.
// ‏`canSend`/`emailTemplate` מגיעים מהקורא כי הם תלויים בסטטוס-ההצעה ובפרמטרים שהמסך כבר
// טוען; החלון עצמו לא יודע דבר על מקורם (§6 מ3: איש-הקשר הראשי בלבד).

import { useEffect, useState } from 'react'
import { Download, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/supabaseClient'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import {
  quoteToPdfModel,
  isQuoteSendable,
  buildQuoteEmailPayload,
  findUnknownQuoteEmailPlaceholders,
  QUOTE_SCREEN_PARAM_NAMES,
} from '@/lib/quotes'
import {
  EMAIL_SEND_TIMEOUT_MS,
  classifySendError,
  emailSendDisabledReason,
  isAttachmentTooLarge,
  sendResultMessage,
} from '@/lib/email'
import { renderQuotePdfBlob, quotePdfFileName, formatDate } from '@/modules/03_quotes/quotePdf'
import { getLastSuccessfulSend } from '@/modules/03_quotes/api'

// Blob ⇒ base64 גולמי (בלי ה-prefix `data:...;base64,`) — זה הפורמט שהעברנו ל-Edge
// Function, שמעביר אותו הלאה ל-Make בלי לגעת בו. FileReader ולא Buffer: זה קוד-דפדפן.
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export default function QuoteDocumentDialog({
  open,
  onOpenChange,
  quote,
  productsBySku,
  vatRate,
  validityDays,
  emailTemplate,
  canEdit = false,
}) {
  const toast = useToast()
  const { user } = useAuth()
  const [blobUrl, setBlobUrl] = useState('')
  const [blob, setBlob] = useState(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  // ⚠️ sendError/sent אינם מתאפסים כאן ב-effect (זה `react-hooks/set-state-in-effect`,
  // שגיאה בקונפיג הזה — ר' src/CLAUDE.md). האיפוס הוא באחריות הקורא: remount דרך
  // `key={quote?.quote_id}`, אותה מוסכמה כמו ApproveQuoteDialog/RejectQuoteDialog.
  const [sendError, setSendError] = useState('')
  const [sent, setSent] = useState(false)
  // שליחה מוצלחת קודמת **מהמסד** — לא מ-state. זו השכבה היחידה ששורדת רענון-דף ומשתמש
  // שני, ולכן היא זו שהופכת את ההגנה מפני שליחה-כפולה למשהו אמיתי (ממצא #8).
  const [previousSend, setPreviousSend] = useState(null)

  // ⚠️ blob-URL הוא משאב שדולף אם לא משחררים אותו — כל פתיחה מייצרת אחד חדש, וללא
  // revokeObjectURL הדפדפן מחזיק את כל המסמכים שנפתחו בסשן בזיכרון. הניקוי בפונקציית
  // ה-cleanup הוא היחיד שרץ גם בסגירה וגם בניווט באמצע.
  useEffect(() => {
    if (!open || !quote) return undefined

    let cancelled = false
    let createdUrl = ''
    ;(async () => {
      try {
        const model = quoteToPdfModel(quote, productsBySku, vatRate, validityDays)
        const generatedBlob = await renderQuotePdfBlob(model)
        if (cancelled) return
        createdUrl = URL.createObjectURL(generatedBlob)
        setBlob(generatedBlob)
        setBlobUrl(createdUrl)
        setError('')
      } catch {
        if (!cancelled) setError('הפקת המסמך נכשלה.')
      }
    })()

    // שאילתת-היומן רצה במקביל להפקת ה-PDF ולא אחריה: היא אינה חוסמת את התצוגה, וכשל
    // בה (למשל RLS) לא ימנע צפייה או הורדה — הוא רק ישאיר את החלון בלי חיווי-"נשלח כבר".
    if (quote?.quote_id) {
      getLastSuccessfulSend('quote', quote.quote_id)
        .then((row) => !cancelled && setPreviousSend(row))
        .catch(() => {})
    }

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
      setBlob(null)
      setBlobUrl('')
    }
  }, [open, quote, productsBySku, vatRate, validityDays])

  function downloadPdf() {
    if (!blobUrl) return
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = quotePdfFileName(quote?.quote_id)
    link.click()
  }

  // הכרעת-ישי 29/07: שליחה רק בהצעות "בתהליך". חלון-מסמך שנפתח מהבנייה (עדיין
  // לא נשמרה) מגיע עם canSend=false מהקורא — לפני-שמירה אין שורת-DB לשלוח בשמה.
  const canSend = isQuoteSendable(quote)
  const disabledReason = canSend
    ? emailSendDisabledReason({
        email: quote?.customers?.email,
        template: emailTemplate,
        canEdit,
      })
    : ''

  // 🛡️ מניעת שליחה-כפולה (בקשת-ישי 30/07/2026) — שלוש שכבות, כי כל אחת חוסמת תרחיש אחר:
  // (1) `sending` חוסם לחיצה-כפולה מהירה על אותו כפתור (הכשל הנפוץ: לחיצה, אין משוב מיידי,
  //     לחיצה שוב — הלקוח מקבל שני מיילים זהים);
  // (2) אחרי שליחה הכפתור **משנה תווית לְ"שליחה חוזרת"** ועובר לסגנון משני — כלומר הפעולה
  //     הראשית של החלון נגמרה, וכל לחיצה נוספת היא החלטה ולא אינרציה;
  // (3) חלון-אישור (`window.confirm`) שנפתח **רק** כשההצעה כבר נשלחה בעבר — כדי שהמסלול
  //     הרגיל יישאר לחיצה אחת, וההגנה תופיע בדיוק במצב שבו יש מה למנוע.
  // ⚠️ **הכפתור נשאר פעיל בכוונה** ולא מושבת: לקוח שמדווח "לא קיבלתי" הוא מקרה אמיתי,
  //    ואילוץ לסגור-ולפתוח את החלון בשבילו הוא חיכוך בלי תמורה — ה-confirm כבר מונע תאונה.
  //    *(הערה קודמת כאן הבטיחה כפתור-מושבת וזה סתר את ה-confirm; נתפס בבדיקה E2E.)*
  // (4) **השכבה שסוגרת את הפער האמיתי** (`email_log`, מיגרציה 8): שליחה מוצלחת שנרשמה
  //     במסד מפעילה את אותו חלון-אישור **גם ברענון-דף וגם אצל משתמש שני** — שלושת
  //     השכבות שמעליה חיות ב-state ומתאפסות. זה מה שהופך את ההגנה לאמיתית ולא מקומית.
  const alreadySent = sent || previousSend != null

  async function sendEmail() {
    if (!blob || disabledReason || sending) return
    if (alreadySent && !window.confirm('ההצעה כבר נשלחה ללקוח. לשלוח שוב?')) return

    setSending(true)
    setSendError('')
    try {
      const pdfBase64 = await blobToBase64(blob)
      // תקרת-Make: חריגה נדחית בצד-Make, כלומר אחרי שהמשתמש כבר קיבל "נשלח".
      if (isAttachmentTooLarge(pdfBase64)) {
        setSendError('המסמך גדול מדי לשליחה אוטומטית. יש להוריד אותו ולשלוח ידנית.')
        toast.error('המסמך גדול מדי לשליחה — יש להוריד ולשלוח ידנית.')
        return
      }

      // ⚠️ שדה-תבנית שהקוד אינו מכיר עוצר כאן, **עם שמו**: המנוע ממילא יסרב לשלוח
      // (‏`fillEmailTemplate` מחזיר ריק), אבל הודעה כללית הייתה משאירה את המשתמש בלי
      // מושג מה לתקן — והתיקון הוא שורה אחת ב-Table Editor. ר' `src/lib/email.js`.
      const unknownFields = findUnknownQuoteEmailPlaceholders(emailTemplate)
      if (unknownFields.length > 0) {
        const list = unknownFields.join(', ')
        setSendError(
          `תבנית המייל מכילה שדה שהמערכת אינה מכירה: ${list}. יש לתקן את התבנית בהגדרות.`,
        )
        toast.error('תבנית המייל מכילה שדה לא-מוכר — המייל לא נשלח.')
        return
      }

      const payload = buildQuoteEmailPayload({
        quote,
        template: emailTemplate,
        eventDate: formatDate(quote?.estimated_event_date),
        filename: quotePdfFileName(quote?.quote_id),
        pdfBase64,
        // החתימה = המשתמש המחובר (הכרעת-ישי 30/07). מגיע מ-AuthContext ולא משאילתה:
        // אותו אדם שה-Edge Function מאמתת ממילא, ובלי סבב-רשת נוסף.
        sender: user,
      })
      // תנאי-הסף כבר נבדקו למעלה (disabledReason + שדות-התבנית) — null כאן הוא תקלה
      // אמיתית, לא מצב-משתמש צפוי, ולכן הודעה כללית ולא ניסיון-ניחוש מה בדיוק חסר.
      if (!payload) throw new Error('הכנת נתוני-השליחה נכשלה.')

      // ⏱️ תקרת-זמן משלנו: ל-invoke אין timeout, ובלעדיה כפתור "שולח..." יכול להישאר
      // תקוע לנצח אם Make לא עונה — והמשתמש לא יודע אם לשלוח שוב או לא.
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), EMAIL_SEND_TIMEOUT_MS),
      )
      // ⚠️ שלושת שדות-המטא **חייבים** להישלח, אחרת רישום-היומן בשרת נכשל בשקט: לעמודה
      // `entity_id` יש NOT NULL, והמייל יוצא בהצלחה בעוד `email_log` נשאר ריק — כלומר
      // ההגנה מפני שליחה-כפולה מפסיקה להתקיים בלי שאף אחד רואה שגיאה. **נתפס באימות
      // מקצה-לקצה 30/07** (המייל הגיע עם ה-PDF, והיומן היה ריק).
      // הם נפרדים מ-`payload` בכוונה: `payload` הוא **חוזה חמשת-השדות מול Make**, ואלה
      // מיועדים ליומן שלנו בלבד — הפונקציה מעבירה ל-Make את החמישה ולא אותם.
      const { error: fnError } = await Promise.race([
        supabase.functions.invoke('send-email', {
          body: {
            ...payload,
            entity_type: 'quote',
            entity_id: quote?.quote_id,
            template_name: QUOTE_SCREEN_PARAM_NAMES.quoteEmailTemplate,
          },
        }),
        timeout,
      ])
      if (fnError) throw fnError

      setSent(true)
      toast.success(`ההצעה נשלחה ל-${payload.to}.`)
    } catch (err) {
      // שלושת המצבים (כולל "לא ידוע") והניסוח שלהם חיים ב-`src/lib/email.js` ונבדקים שם —
      // הקומפוננטה רק מציגה. ההבחנה עצמה קריטית: ר' ההערה במנוע.
      const result = classifySendError(err)
      setSendError(sendResultMessage(result))
      toast.error(
        result === 'unknown'
          ? 'לא התקבל אישור שליחה — יש לבדוק לפני שליחה חוזרת.'
          : 'ההצעה לא נשלחה ללקוח — יש לנסות שוב.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle data-testid="quote-document-title">
            הצעת מחיר {quote?.quote_id} — {quote?.event_name}
          </DialogTitle>
          <DialogDescription>
            המסמך כפי שהלקוח {quote?.customers?.company_name} יקבל אותו.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-red-600 font-semibold py-8 text-center" role="alert">
            {error}
          </p>
        ) : blobUrl ? (
          <iframe
            src={blobUrl}
            title="תצוגה מקדימה של הצעת המחיר"
            className="w-full h-[60vh] rounded-lg border border-slate-200 bg-slate-50"
            data-testid="quote-document-frame"
          />
        ) : (
          <p className="text-slate-500 py-8 text-center">מפיק את המסמך...</p>
        )}

        {/* חיווי "נשלח כבר" מהמסד — מוצג **גם בפתיחה ראשונה אחרי רענון-דף**, כלומר הוא
            עונה על השאלה "האם הלקוח כבר קיבל?" ולא רק מונע לחיצה כפולה. מוצג רק כשאין
            שליחה חדשה בחלון הזה, כדי שלא יופיעו שני חיוויים על אותו דבר. */}
        {canSend && previousSend && !sent && !sendError && (
          <p className="text-slate-600 text-sm" data-testid="quote-previous-send">
            נשלח כבר ב-{formatDate(previousSend.created_at)} אל {previousSend.recipient}
          </p>
        )}
        {canSend && sendError && (
          <p className="text-red-600 text-sm" role="alert" data-testid="quote-send-error">
            {sendError}
          </p>
        )}
        {canSend && sent && !sendError && (
          <p className="text-teal-700 text-sm" data-testid="quote-send-success">
            ✓ נשלח ל-{quote?.customers?.email}
          </p>
        )}

        <DialogFooter>
          {canSend && (
            <Button
              type="button"
              onClick={sendEmail}
              disabled={!blobUrl || sending || Boolean(disabledReason)}
              title={disabledReason || undefined}
              variant={alreadySent && !sendError ? 'outline' : undefined}
              className={cn(
                'h-auto py-2 px-4 rounded-lg font-semibold gap-2',
                // אחרי שליחה מוצלחת הכפתור **משנה מראה ולא רק טקסט**: הוא יורד מטורקיז-מלא
                // (הפעולה הראשית של המסך) לסגנון-משני, וזה מה שמונע לחיצה שנייה מאינרציה.
                // ⚠️ טורקיז-מלא שמור לפעולה הראשית האחת — ר' src/CLAUDE.md מעבר (3).
                // ‏`alreadySent` ולא `sent`: הצעה שנשלחה בסשן קודם נראית כך גם בפתיחה חדשה.
                !(alreadySent && !sendError) && 'bg-teal-600 hover:bg-teal-700 text-white',
              )}
              data-testid="quote-document-send"
            >
              <Mail className="size-4" />
              {sending
                ? 'שולח...'
                : alreadySent && !sendError
                  ? 'שליחה חוזרת'
                  : 'שליחת ההצעה במייל'}
            </Button>
          )}
          <Button
            type="button"
            onClick={downloadPdf}
            disabled={!blobUrl}
            variant={canSend ? 'outline' : undefined}
            className={cn(
              'h-auto py-2 px-4 rounded-lg font-semibold gap-2',
              !canSend && 'bg-teal-600 hover:bg-teal-700 text-white',
            )}
            data-testid="quote-document-download"
          >
            <Download className="size-4" />
            הורדת PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
