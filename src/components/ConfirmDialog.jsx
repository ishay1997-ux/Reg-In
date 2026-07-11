// חלון-וידוא משותף (RTL, שפת-העיצוב §4) — מחליף את window.confirm המכוער של הדפדפן בכל המערכת,
// כדי שכל אישור-פעולה ייראה אחיד (בקשת-ישי 11/07: "צריכים להיות עקביים במערכת").
//
// דפוס אימפרטיבי במכוון: useConfirm() מחזיר confirm(options)⇒Promise<boolean>, כך שקוד קיים עובר
// כמעט 1:1 — `if (window.confirm(msg))` הופך ל-`if (await confirm({ message: msg }))`. ה-Provider
// יושב פעם אחת בשורש (App.jsx) ומרנדר דיאלוג יחיד; כל מודול רק קורא useConfirm ולא בונה דיאלוג משלו.
//
// why-first: ה-resolver נשמר ב-ref (לא ב-state) כי הוא ערך חד-פעמי שאין לו קשר לרינדור — שמירתו
// ב-state הייתה גוררת רינדור מיותר ו-setState-בתוך-updater. פתיחה/סגירה של הדיאלוג היא ה-state.

import { createContext, useCallback, useContext, useRef, useState } from 'react'
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

const ConfirmContext = createContext(null)

// מוחזר ל-hook: פונקציית confirm(options). זריקה אם נקרא מחוץ ל-Provider = שגיאת-חיווט מפורשת.
// (אותו דפוס כמו useAuth ב-AuthContext — קובץ אחד לספק+hook; ה-Fast-Refresh לא רלוונטי כאן.)
// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm חייב להיקרא בתוך <ConfirmProvider>')
  return confirm
}

const DEFAULTS = {
  title: 'אישור פעולה',
  message: '',
  confirmLabel: 'אישור',
  cancelLabel: 'ביטול',
  danger: false, // danger=true → כפתור-אישור אדום (למחיקות אמת). ארכוב/השבתה הפיכים = teal.
}

export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null) // null = סגור; אובייקט = פתוח עם ההגדרות
  const resolverRef = useRef(null)

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setOptions({ ...DEFAULTS, ...opts })
    })
  }, [])

  // סוגר את הדיאלוג ומחזיר את התוצאה לקורא (true=אישר, false=ביטל/ESC/רקע).
  const settle = useCallback((result) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOptions(null)
  }, [])

  const open = options != null

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(next) => !next && settle(false)}>
        <DialogContent dir="rtl" className="sm:max-w-md" data-testid="confirm-dialog">
          <DialogHeader>
            <DialogTitle data-testid="confirm-dialog-title">{options?.title}</DialogTitle>
            {options?.message && (
              <DialogDescription data-testid="confirm-dialog-message">
                {options.message}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => settle(false)}
              className="h-auto py-2.5 px-4 rounded-lg border-slate-300 text-slate-700"
              data-testid="confirm-dialog-cancel"
            >
              {options?.cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={() => settle(true)}
              className={cn(
                'h-auto py-2.5 px-4 rounded-lg text-white font-semibold',
                options?.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700',
              )}
              data-testid="confirm-dialog-confirm"
            >
              {options?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}
