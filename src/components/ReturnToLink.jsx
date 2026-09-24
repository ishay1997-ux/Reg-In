// קישור "חזרה לדוח" / "חזרה למסך הבית" — ליטושי-הכנס, חבילה 0ב (24/09/2026).
// מוצג רק כשהגיעו מדלת של דוח או של "מה דורש טיפול" (`?returnTo=`), ורק לנתיב פנימי שעבר
// `safeReturnTo` (`src/lib/returnTo.js`). אחרת — `null`, והמסך נראה בדיוק כמו קודם.
// 🔑 האייקון `ArrowRight` — אותו כפתור-חזרה כמו ב-`CustomerDetailsPage` (ב-RTL "אחורה" הוא ימינה).

import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { RETURN_TO_PARAM, returnToLabel, safeReturnTo } from '@/lib/returnTo'

// אותו דפוס כמו `useToast`/`useConfirm` — ה-hook והרכיב שלו בקובץ אחד.
// eslint-disable-next-line react-refresh/only-export-components
export function useReturnTo() {
  const [searchParams] = useSearchParams()
  return safeReturnTo(searchParams.get(RETURN_TO_PARAM))
}

export default function ReturnToLink({ className = '' }) {
  const returnTo = useReturnTo()
  if (!returnTo) return null
  return (
    <Link
      to={returnTo}
      className={`inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 ${className}`}
      data-testid="return-to-link"
    >
      <ArrowRight aria-hidden="true" className="size-4" />
      {returnToLabel(returnTo)}
    </Link>
  )
}
