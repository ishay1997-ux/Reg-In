// המעטפת המשותפת לשני חלונות-הפעולה של מסך-הניהול (אישור ודחייה).
//
// למה היא קיימת: שני החלונות חולקים בדיוק את אותו שלד — כותרת+הסבר, גוף משתנה, שורת
// שגיאה, וזוג כפתורים שנעולים בזמן שמירה. ‏jscpd (שער חוסם ב-CI) זיהה את זה ככפילות
// אמיתית, והיא גם סיכון תחזוקה: תיקון בהתנהגות-השמירה של אחד היה מפספס את השני.
//
// חלוקת האחריות: **המעטפת** מחזיקה את מצב-השמירה ואת הצגת-השגיאה; **הקורא** מחזיק את
// הוולידציה ואת הפעולה. כל שגיאה שהקורא זורק — בין אם היא ולידציה מקומית ("יש לבחור
// סיבה") ובין אם היא שגיאת-שרת ("אין הרשאה") — מוצגת באותו מקום ובאותו מראה.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const TONES = {
  // ירוק/אדום מגיעים משפת-העיצוב §4 (success ~#22C55E · danger ~#EF4444) — לא הומצאו כאן.
  approve: 'bg-green-600 hover:bg-green-700',
  reject: 'bg-red-600 hover:bg-red-700',
}

export default function QuoteActionDialog({
  open,
  onOpenChange,
  tone,
  title,
  description,
  confirmLabel,
  savingLabel,
  fallbackError,
  onConfirm,
  children,
  titleTestId,
  confirmTestId,
}) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleConfirm() {
    setSaving(true)
    try {
      await onConfirm()
    } catch (e) {
      setError(e?.message ?? fallbackError)
    } finally {
      setSaving(false)
    }
  }

  return (
    // בזמן שמירה החלון לא נסגר — לא ב-ESC, לא בלחיצה על הרקע: סגירה באמצע פעולה
    // הייתה משאירה את המשתמש בלי לדעת אם היא הצליחה.
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid={titleTestId}>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* clearError מועבר לילדים כדי ששינוי-קלט ינקה שגיאה שכבר לא רלוונטית */}
        {typeof children === 'function' ? children({ clearError: () => setError('') }) : children}

        {error && (
          <p className="text-red-600 text-sm font-semibold" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-auto py-2 px-4 rounded-lg border-slate-300 text-slate-700"
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className={cn('h-auto py-2 px-4 rounded-lg text-white font-semibold', TONES[tone])}
            data-testid={confirmTestId}
          >
            {saving ? savingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
