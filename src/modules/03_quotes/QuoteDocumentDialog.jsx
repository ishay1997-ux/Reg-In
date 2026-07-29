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
// 🚧 צעד 3.4 מוסיף כאן את "שלח במייל" (mailto מהתבנית `תבנית_מייל_הצעת_מחיר`, לאיש-הקשר
// הראשי בלבד, ורק בהצעות בתהליך — שלוש ההכרעות של ישי 29/07). כאן: צפייה והורדה בלבד.

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { quoteToPdfModel } from '@/lib/quotes'
import { renderQuotePdfBlob, quotePdfFileName } from '@/modules/03_quotes/quotePdf'

export default function QuoteDocumentDialog({
  open,
  onOpenChange,
  quote,
  productsBySku,
  vatRate,
  validityDays,
}) {
  const [blobUrl, setBlobUrl] = useState('')
  const [error, setError] = useState('')

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
        const blob = await renderQuotePdfBlob(model)
        if (cancelled) return
        createdUrl = URL.createObjectURL(blob)
        setBlobUrl(createdUrl)
        setError('')
      } catch {
        if (!cancelled) setError('הפקת המסמך נכשלה.')
      }
    })()

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
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

        <DialogFooter>
          <Button
            type="button"
            onClick={downloadPdf}
            disabled={!blobUrl}
            className="h-auto py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-2"
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
