// עטיפת-הנתיב `/payroll-review/:token` (חוזה §4.1: הנתיב של D, הרכיב של B).
// הדף נטען בטעינה עצלה כדי שקוד הדף הציבורי לא ייכנס לחבילה של מסכי הצוות.

import { Suspense, lazy } from 'react'

const PublicPayrollReviewPage = lazy(() => import('../PublicPayrollReviewPage.jsx'))

export default function PublicPayrollReviewRoute() {
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
