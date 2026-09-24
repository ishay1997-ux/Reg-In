// לולאת הניסיון-החוזר של `draft-followup` — טהורה, בלי Deno ובלי רשת, כדי שבדיקת-יחידה עם שעון מזויף
// (`providerRetry.test.js`) תוכיח את תקרת-הזמן. ‏`index.ts` מייבא מכאן; ‏`deno check` של ה-CI בודק גם את הקובץ הזה.
// ⚠️ **פריסה דרך MCP חייבת לכלול אותו** (יחד עם `index.ts` ו-`draftGuard.ts`), אחרת הייבוא נופל.
//
// 🧱 **הדפוס של `callProvider` ב-`classify-feedback`** (המתנות 2/5 שניות · ניסיון נוסף רק על כשל זמני ·
// רק אם ההמתנה לא חוצה את ה-deadline) — **ועוד כלל אחד, שם הוא חסר:** תקרת כל ניסיון נחתכת למה
// שנשאר מהתקציב. ⏱️ בלי זה, ניסיון שמתחיל שנייה לפני ה-deadline מקבל 60 שניות מלאות ⇒ ריצה של ~150
// שניות, בדיוק תקרת-הזמן של פונקציית-קצה, והמשתמשת מקבלת שגיאה כללית במקום "הניסוח נכשל" (הכרעת-הסגן
// 25/09/2026, #5). עם החיתוך הריצה כולה נגמרת עד `deadline` (+ זמן-התשובה של המסד, שנקרא לפניו).

export const RETRY_WAITS_MS = [2_000, 5_000]
// פחות משנייה שנשארה — לא פותחים ניסיון: שום ספק לא יענה בזמן הזה, וזו רק עוד בקשה מהמכסה.
export const MIN_ATTEMPT_MS = 1_000

interface RetryOptions {
  deadline: number
  attemptMs: number
  isTransient: (err: unknown) => boolean
  exhausted: () => Error
  onRetry?: (attempt: number, err: unknown) => void
}

export async function callWithRetry<T>(
  attempt: (timeoutMs: number) => Promise<T>,
  { deadline, attemptMs, isTransient, exhausted, onRetry }: RetryOptions,
): Promise<T> {
  for (let n = 0; ; n += 1) {
    const left = deadline - Date.now()
    if (left < MIN_ATTEMPT_MS) throw exhausted()
    try {
      return await attempt(Math.min(attemptMs, left))
    } catch (err) {
      if (!isTransient(err)) throw err
      const wait = RETRY_WAITS_MS[n]
      if (wait === undefined || Date.now() + wait >= deadline) throw err
      onRetry?.(n + 1, err)
      await new Promise((resolve) => setTimeout(resolve, wait))
    }
  }
}
