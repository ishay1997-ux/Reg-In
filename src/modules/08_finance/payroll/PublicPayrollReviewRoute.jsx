// עטיפת-הנתיב `/payroll-review/:token` (חוזה §4.1: הנתיב של D, הרכיב של B).
//
// 🔑 **למה טעינה דרך `import.meta.glob` ולא ייבוא רגיל:** הרכיב `PublicPayrollReviewPage.jsx`
// נבנה במקביל בענף של בונה B ועוד לא קיים בענף הזה. ייבוא רגיל היה שובר את הבנייה עד המיזוג;
// ‏glob מחזיר `{}` כשהקובץ חסר, ומרגע שהוא ממוזג — הנתיב עובד בלי לגעת בקובץ הזה.
// עד אז הנתיב מציג "הדף לא נמצא", בדיוק כמו קישור לא מוכר.
// הכרעתי, הפיך: אחרי המיזוג אפשר להחליף בייבוא רגיל בשורה אחת.

import { Suspense, lazy } from 'react'
import NotFound from '@/components/NotFound'

const pages = import.meta.glob('../PublicPayrollReviewPage.jsx')
const loadPage = pages['../PublicPayrollReviewPage.jsx']
const PublicPayrollReviewPage = loadPage ? lazy(loadPage) : null

export default function PublicPayrollReviewRoute() {
  if (!PublicPayrollReviewPage) return <NotFound />
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50" role="status" aria-live="polite">
          <span className="sr-only">טוען…</span>
        </div>
      }
    >
      <PublicPayrollReviewPage />
    </Suspense>
  )
}
