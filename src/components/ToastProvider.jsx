// מערכת התראות (toasts) משותפת — מחליפה את window.alert המכוער בהתראה מעוצבת, קופצת ונעלמת-מעצמה
// (בקשת-ישי 11/07: "מעוצב, בוגר ועקבי עם העיצוב, קופץ במקום המתאים לפי מה שמקובל בשוק").
//
// מיקום מקובל-בשוק: מרכז-תחתון (snackbar), צף מעל התוכן בלי לחסום, נערם כשיש כמה, ונעלם אוטומטית.
// דפוס זהה ל-ConfirmProvider: Provider יחיד בשורש (App.jsx) + hook useToast() שכל מודול קורא.
// why-first: ה-toast הוא משוב לא-חוסם (בניגוד ל-confirm שעוצר לפעולה) — מתאים להצלחה/שגיאה שאחרי
// פעולה שכבר קרתה. שגיאות שהיו window.alert (חוסם) עוברות לכאן; וגם משוב-הצלחה לארכוב/שחזור
// (שאיבד את המשוב כשהוסר חלון-הווידוא).

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast חייב להיקרא בתוך <ToastProvider>')
  return ctx
}

const AUTO_DISMISS_MS = 4000

// וריאנטים לפי שפת-העיצוב §4: הצלחה=טורקיז, שגיאה=אדום, מידע=אפור. הטקסט בגוון-כהה מאותה משפחה.
const VARIANTS = {
  success: {
    icon: CheckCircle2,
    box: 'bg-teal-50 border-teal-200 text-teal-800',
    icon_cls: 'text-teal-600',
  },
  error: {
    icon: AlertCircle,
    box: 'bg-red-50 border-red-200 text-red-800',
    icon_cls: 'text-red-600',
  },
  info: {
    icon: Info,
    box: 'bg-slate-50 border-slate-200 text-slate-700',
    icon_cls: 'text-slate-500',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]) // [{ id, message, variant }]
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message, variant = 'info') => {
      const id = ++idRef.current
      setToasts((list) => [...list, { id, message, variant }])
      // דחייה-אוטומטית (קונבנציית-toast); המשתמש יכול גם לסגור מיד ב-X. setTimeout ב-handler, לא ברינדור.
      // 🔴 **פרט לשגיאה — היא נשארת עד שהמשתמשת סוגרת אותה** (26/08/2026).
      // **הסיבה קונקרטית ולא עקרונית:** הודעת-הכשל של שחרור-דיילת אומרת *"הודעות-הביטול: 2 לא
      // נשלחו · 1 — לא ידוע אם יצאו. כדאי ליידע אותה טלפונית"* — **ואין בשום מסך במערכת רישום
      // שדיילת לא קיבלה הודעה שהאירוע שלה בוטל.** ‏4 שניות היו כל חלון-ההזדמנות לקרוא זאת,
      // ובמקביל הטבלה מתחלפת בשלד-טעינה ומושכת את העין.
      // 🔑 **וזו החלה של הכרעה שכבר קיימת בבית, לא חדשה:** לשונית-הסגירה נמנעת מרענון בכוונה
      // *"כי הוא היה מוחק את הודעת-הכשל"*, ובחלון-שליחת-ההצעה יושבת הודעה קבועה **בנוסף** לטוסט.
      // הידע היה; הוא פשוט לא הוחל על הטוסט עצמו. **הצלחה נשארת 4 שניות — היא ניתנת לשחזור.**
      if (variant !== 'error') setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      return id
    },
    [dismiss],
  )

  // API נוח: toast.success/error/info(message). useMemo כדי שהערך יציב בין רינדורים.
  const api = useMemo(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
      info: (m) => show(m, 'info'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* מרכז-תחתון, צף, לא חוסם; RTL. ה-live-region עבר לכל toast בנפרד (למטה) כדי ששגיאה תוכרז
          assertive (role=alert) והצלחה/מידע polite (role=status) — במקום polite אחיד לכולם (תיקון 11/07). */}
      <div
        dir="rtl"
        className="fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => {
          const v = VARIANTS[t.variant] ?? VARIANTS.info
          const Icon = v.icon
          return (
            <div
              key={t.id}
              // שגיאה = assertive (role=alert) — מוכרזת מיד; הצלחה/מידע = polite (role=status). תיקון 11/07.
              role={t.variant === 'error' ? 'alert' : 'status'}
              aria-live={t.variant === 'error' ? 'assertive' : 'polite'}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 shadow-md',
                'animate-in fade-in slide-in-from-bottom-2 duration-200',
                v.box,
              )}
              data-testid={`toast-${t.variant}`}
            >
              <Icon className={cn('size-5 shrink-0', v.icon_cls)} />
              <span className="flex-1 text-sm">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                aria-label="סגירת ההתראה"
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
