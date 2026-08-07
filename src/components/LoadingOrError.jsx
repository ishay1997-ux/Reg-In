// מסך-שער משותף לטעינה/שגיאה (חולץ 25/07/2026 מ-UsersManagementPage + CustomersPage לאחר
// ש-jscpd זיהה כפילות זהה בין השניים; PermissionsMatrixPage הצטרף כצרכן שלישי עם וריאציה חלקית).
// onRetry אופציונלי: כשמסופק - גרסה מלאה (עטיפה+role=alert+כפתור "נסה שוב"); כשלא - פסקת-שגיאה בלבד.

import { Button } from '@/components/ui/button'

export default function LoadingOrError({ loading, error, onRetry, retryTestId }) {
  if (loading) {
    return <p className="text-slate-500">טוען...</p>
  }

  if (onRetry) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center" role="alert">
        <p className="text-red-600 font-semibold">{error}</p>
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="h-auto py-2 px-4 rounded-lg border-slate-300 text-slate-700"
          data-testid={retryTestId}
        >
          נסה שוב
        </Button>
      </div>
    )
  }

  return <p className="text-red-600 font-semibold">{error}</p>
}
