// מסך-שער משותף לטעינה/שגיאה (חולץ 25/07/2026 מ-UsersManagementPage + CustomersPage לאחר
// ש-jscpd זיהה כפילות זהה בין השניים; PermissionsMatrixPage הצטרף כצרכן שלישי עם וריאציה חלקית).
// onRetry אופציונלי: כשמסופק - גרסה מלאה (עטיפה+role=alert+כפתור "נסה שוב"); כשלא - פסקת-שגיאה בלבד.
//
// 🆕 `skeleton` (10/08/2026, נולד מ-3.7 של מודול 4) — פרמטר-רשות. בלעדיו ההתנהגות זהה-בייט
// למה שהייתה: פסקת "טוען..." — כל אתר-הקריאה הקיים במודולים 1–3 ממשיך לעבוד בלי שינוי.
// עם `skeleton`, מוצגת צורה שמזכירה את התוכן שבדרך במקום טקסט גנרי — בדיוק מה שהאפיון
// של מודול 4 דורש בכמה מסכים ("שלד-טבלה" / "שלד-כרטיסים" / "שלד-כרטיס"), ולא ייחודי אליו:
// זה רכיב-משותף, אז כל מודול עתידי שרוצה שלד-טעינה מקבל אותו מכאן, לא בונה אחד משלו.
// ‏`variant`: `'table'` (שורות+עמודות) · `'cards'` (רשת-כרטיסים) · `'card'` (כרטיס-פרטים בודד) ·
// `'page'` (מלבנים כלליים, כשאין עדיין צורה ספציפית).

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BAR = 'animate-pulse rounded bg-slate-200'

function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full" data-testid="skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="mb-2 flex items-center gap-3 border-b border-slate-100 py-2.5">
          {Array.from({ length: cols }).map((_, c) => (
            <span
              key={c}
              className={cn(BAR, 'h-3.5')}
              style={{ width: c === 0 ? '22%' : `${Math.round(78 / (cols - 1))}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function CardsSkeleton({ count = 8 }) {
  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      data-testid="skeleton-cards"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-3">
          <span className={cn(BAR, 'block h-4 w-2/3')} />
          <span className={cn(BAR, 'mt-2 block h-3 w-1/3')} />
          <span className={cn(BAR, 'mt-3 block h-3 w-full')} />
        </div>
      ))}
    </div>
  )
}

function CardDetailSkeleton() {
  // רצועת-הדגשים (§ תיאור-האפיון: "רצועת-הדגשים + פרטים כקווים אפורים") + כמה שורות-פרטים.
  return (
    <div data-testid="skeleton-card" aria-hidden="true">
      <div className="mb-3 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className={cn(BAR, 'h-14 w-28 rounded-lg')} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={cn(BAR, 'mb-2 block h-3.5')} style={{ width: `${90 - i * 8}%` }} />
      ))}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" data-testid="skeleton-page" aria-hidden="true">
      <span className={cn(BAR, 'h-5 w-1/3')} />
      <span className={cn(BAR, 'h-3.5 w-2/3')} />
      <span className={cn(BAR, 'mt-3 h-24 w-full')} />
    </div>
  )
}

function FieldsSkeleton({ rows = 4 }) {
  // תווית קצרה + קלט מלא, בשורות — לדיאלוג-טופס שממתין לרשומה קיימת (עריכה, לא הוספה).
  return (
    <div className="flex flex-col gap-3" data-testid="skeleton-fields" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          <span className={cn(BAR, 'mb-1 block h-3 w-20')} />
          <span className={cn(BAR, 'block h-8 w-full')} />
        </div>
      ))}
    </div>
  )
}

const VARIANTS = {
  table: TableSkeleton,
  cards: CardsSkeleton,
  card: CardDetailSkeleton,
  page: PageSkeleton,
  fields: FieldsSkeleton,
}

// 🆕 `retryLabel` (19/08/2026, צעד 3.0 ε של מודול 6) — פרמטר-רשות שברירת-המחדל שלו היא
// המחרוזת הקיימת "נסה שוב", כלומר אפס שינוי-התנהגות לארבעת אתרי-הקריאה הקיימים.
// למה prop ולא עריכת המחרוזת: מודול 6 כולו בלשון-נקבה ("נסי שוב" — S-28), אבל החלפת
// ברירת-המחדל היא שינוי חוצה-מערכת שרשום כ-`🚧 מ12` — לא של מודול 6 לעשות.
export default function LoadingOrError({
  loading,
  error,
  onRetry,
  retryTestId,
  skeleton,
  retryLabel = 'נסה שוב',
}) {
  if (loading) {
    if (skeleton) {
      const Variant = VARIANTS[skeleton.variant] ?? PageSkeleton
      // השלד עצמו aria-hidden (הוא דקורטיבי) — בלי ההכרזה הנפרדת כאן קורא-מסך לא שומע כלום.
      return (
        <div role="status" aria-live="polite">
          <span className="sr-only">טוען...</span>
          <Variant {...skeleton} />
        </div>
      )
    }
    return (
      <p className="text-slate-500" role="status" aria-live="polite">
        טוען...
      </p>
    )
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
          {retryLabel}
        </Button>
      </div>
    )
  }

  return <p className="text-red-600 font-semibold">{error}</p>
}
