// משטח S4 — **הדף הציבורי למשוב-לקוח.** `/feedback/:token`.
//
// 🔴 **תקדים-מבנה מדויק ומדוד: `src/modules/04_hostesses/PublicConfirmPage.jsx`**
// (`/shift/:token`) — נקרא במלואו לפני כתיבת הקובץ הזה, ומצוטט שורה-שורה ב-
// `docs/specs/module_08_finance/design-contract.md §⑥/S4`. זה הדף הציבורי השני-בלבד
// באפליקציה (אחרי `/shift/:token`) שנפתח בלי התחברות, בלי תפקיד ובלי סרגל-צד — מי
// שרואה אותו הוא לקוח-חיצוני שקיבל קישור במייל-הסקר של מ6. ⇒ **הוא יושב מחוץ
// ל-`<MainLayout>`**, כמו `/login` ו-`/shift/:token`, ובלי `<ProtectedRoute>`.
//
// 🔴 **הנתיב `/feedback/:token` נעול ואינו בחירה** — `mint_feedback_token` כבר צרב
// אותו לתוך `projects.feedback_token`, ומייל-סקר אי-אפשר להחזיר. נתיב אחר לא נכשל
// בקול: הוא מייצר 404 ללקוח שמחזיק קישור ששלחנו, והמנהלת רואה `feedback_status`
// שנשאר `not_sent`/`sent` וקוראת אותו כ"לא ענה" בטעות.
//
// ⚠️ **פער מדוד מול המוקאפ המאושר — לא לתקן כאן:** `04_feedback_public_approved.html`
// מצייר שם-לקוח + טווח-שעות בכרטיס-הפרטים. `get_feedback_page` (מיגרציה
// `20260827155303`, פאזה 1 שהוחלה ונעולה — אסור לערוך `supabase/migrations/`) מחזירה
// **רק** `event_name`+`event_date`; אין `customer_name`/`final_start_time`/
// `final_end_time` בתשובה. הכרטיס למטה מציג את מה שה-RPC בפועל נותן ותו לא — שם-אירוע
// ותאריך בלבד. זהו קונפליקט בין המוקאפ המאושר לבין חוזה-RPC שכבר נעול, לא באג בעמוד.
//
// ✅ **שורת-הכוכבים — שלושת הפערים מול המוקאפ המאושר נסגרו 01/09/2026, ברכיב ולא כאן.**
// עד אז `RatingStars` נעשה בו שימוש-חוזר כפי-שהוא, ונוסח שנכתב ל**מנהלת** דלף אל מסך
// שקורא **לקוח**. שלושת הפערים והמקור שנועל כל אחד:
// ‏**(1) צבע** — המוקאפ מצייר טורקיז; הרכיב צייר `text-slate-700`. הנימוק נעול ב-
//   ‏`screens-approved.md §S4/⑧4`: *"הדירוג **הוא** הפעולה הראשית כאן"*, וכלל-המילוי
//   שומר מילוי-מלא לפעולה-הראשית. ⇒ ‏`tone="primary"`.
// ‏**(2) כיתוב-המנהלת** — הרכיב פלט `טרם התרשמת` / `N מתוך 5`: **לשון-נקבה-יחיד** בעוד
//   הדף כולו פונה ללקוח **ברבים** ("געו בכוכב", "רוצים לספר לנו עוד?"), והמילה
//   **"התרשמות" יועדה במפורש** לדעת-המנהלת-על-דיילת (הערת-הראש של הרכיב: "זו דעת
//   המנהלת"). המוקאפ אינו מצייר כיתוב כזה כלל — רק `געו בכוכב כדי לדרג`, שכבר יושב
//   מתחת לשורה כאן ולכן גם אין מה להחליף בו. ⇒ ‏`hideCaption`.
// ‏**(3) `aria-label` פר-כוכב** — `"כוכב 1"…"כוכב 5"` נעולים **פעמיים**: במוקאפ
//   ‏`04_feedback_public_approved.html` וב-`screens-approved.md §S4/①`. ⇒ ‏`starLabel`.
// 🔴 **ולמה שלושה props ולא עקיפה מקומית:** גליפים משלי כאן היו יוצרים שורת-כוכבים
// **שנייה** במערכת — בדיוק הכפילות ש-3.0 אסר, ושבגללה `RatingStars` נולד מלכתחילה.
// ⚠️ **ולמה props ולא החלפת ברירת-המחדל ברכיב:** הוא משרת גם את S1 (`FinancePage`),
// גם את חלון-הסגירה (`ClosingWindowDialog`) וגם ארבעה מסכים במ2/מ4 — לקהל שבשבילו
// הנוסח האפור והנשי **נכון**. שלושת ה-props הם `opt-in`, וברירת-המחדל שלהם משחזרת
// בייט-בבייט את מה שכל אותם קוראים קיבלו קודם.

// ⚠️ **חוב שנוצר מהתיקון ולא ניתן לסגור מכאן (בעלות-קבצים):** שתי בדיקות-E2E מאתרות
// את הכוכב לפי השם-הנגיש **הישן** — `e2e/public-feedback.spec.js` ו-
// `e2e/accessibility.spec.js`, שתיהן `getByRole('button', { name: '5 מתוך 5' })`.
// אחרי התיקון השם הוא `כוכב 5`. ‏**בדיקת-היחידה כאן לא נשברה כי היא בוחרת לפי מיקום
// ולא לפי שם** — ההערה שמעל `star()` בקובץ-הבדיקה חזתה בדיוק את המצב הזה.

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Ltr from '@/components/Ltr'
import RatingStars from '@/components/RatingStars'
import { formatDate, weekdayOf } from '@/lib/dates'
import {
  FEEDBACK_STATE,
  FEEDBACK_MESSAGE,
  FEEDBACK_NEGATIVE_REASONS,
  FEEDBACK_POSITIVE_REASONS,
  sanitizeReasons,
  stateFromPagePayload,
  stateFromSubmitPayload,
} from '@/lib/feedback'
import { fetchFeedbackPage, submitFeedback } from './publicApi'

// טון+אייקון — עניין ויזואלי-קומפוננטה, לא לוגיקה טהורה, ולכן נשאר כאן ולא ב-`src/lib`
// (אותו פיצול בדיוק כמו `RESULT_LOOK` מול `SHIFT_INVITE_MESSAGE` בתקדים). הנוסחים
// עצמם (`FEEDBACK_MESSAGE`) מיובאים מ-`@/lib/feedback` — מצוטטים מילה-במילה מהמוקאפ
// המאושר + מ-processes-approved.md (N-2/N-5, אושרו 26/08/2026).
const RESULT_LOOK = {
  [FEEDBACK_STATE.thankYou]: { icon: '✓', tone: 'bg-green-100 text-green-700' },
  [FEEDBACK_STATE.already]: { icon: '✓', tone: 'bg-teal-100 text-teal-700' },
  [FEEDBACK_STATE.dead]: { icon: '⏳', tone: 'bg-amber-50 text-amber-700' },
  [FEEDBACK_STATE.saveFailed]: { icon: '!', tone: 'bg-red-50 text-red-700' },
}

export default function PublicFeedbackPage() {
  const { token } = useParams()
  const [state, setState] = useState(FEEDBACK_STATE.loading)
  const [page, setPage] = useState(null)
  const [score, setScore] = useState(null)
  const [negativeReasons, setNegativeReasons] = useState([])
  const [positiveReasons, setPositiveReasons] = useState([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [inlineError, setInlineError] = useState('')
  // רענון-ידני דרך מונה, לא דרך קריאה-ישירה לפונקציה-פנימית מתוך `retry` —
  // `react-hooks/set-state-in-effect` (src/CLAUDE.md) חוסם את זה, בדיוק כמו בתקדים.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const payload = await fetchFeedbackPage(token)
        if (cancelled) return
        setPage(payload?.state === 'ok' ? payload : null)
        setState(stateFromPagePayload(payload))
      } catch {
        if (cancelled) return
        setPage(null)
        setState(FEEDBACK_STATE.saveFailed)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  function retry() {
    setState(FEEDBACK_STATE.loading)
    setInlineError('')
    setReloadKey((key) => key + 1)
  }

  function handleScoreChange(newScore) {
    setScore(newScore)
    if (newScore <= 3) {
      setPositiveReasons([])
    } else {
      setNegativeReasons([])
    }
  }

  // 🚫 **לעולם לא "נשמר" כשלא נשמר** (אותו עוגן כמו `PublicConfirmPage`, spec.md
  // § מה ייחשב עובד #3). כשל-רשת אמיתי ⇒ `saveFailed`; תשובת-שרת מוגדרת אך לא-כותבת
  // (`invalid`) ⇒ נשארים על הטופס עם שגיאה מקומית, לא מניחים הצלחה.
  async function submit() {
    if (!score || submitting) return
    setSubmitting(true)
    setInlineError('')
    try {
      const { negativeReasons: cleanNegs, positiveReasons: cleanPos } = sanitizeReasons(
        score,
        negativeReasons,
        positiveReasons,
      )
      const payload = await submitFeedback(token, score, notes, cleanNegs, cleanPos)
      const next = stateFromSubmitPayload(payload)
      if (next) {
        setState(next)
        return
      }
      setInlineError('לא ניתן לשלוח בלי לבחור דירוג — געו בכוכב ונסו שוב.')
    } catch {
      setState(FEEDBACK_STATE.saveFailed)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="mx-auto flex min-h-[560px] w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal-600" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-500">REG-IN · משוב על האירוע</span>
        </div>

        {state === FEEDBACK_STATE.loading ? (
          <Skeleton />
        ) : state === FEEDBACK_STATE.form ? (
          <FeedbackForm
            page={page}
            score={score}
            negativeReasons={negativeReasons}
            positiveReasons={positiveReasons}
            notes={notes}
            submitting={submitting}
            inlineError={inlineError}
            onScoreChange={handleScoreChange}
            onNegativeReasonsChange={setNegativeReasons}
            onPositiveReasonsChange={setPositiveReasons}
            onNotesChange={setNotes}
            onSubmit={submit}
          />
        ) : (
          <Result state={state} onRetry={state === FEEDBACK_STATE.saveFailed ? retry : null} />
        )}
      </div>
    </div>
  )
}

// 🚫 **שלד בלי הבטחה מוקדמת** (אותו עוגן כמו התקדים) — אין שם-אירוע ואין כוכבים
// לפני שהטוקן נבדק.
function Skeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="feedback-loading" aria-busy="true">
      <span className="sr-only">טוען</span>
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-5 w-40 animate-pulse self-center rounded bg-slate-200" />
      <div className="h-9 w-48 animate-pulse self-center rounded bg-slate-100" />
      <div className="mt-auto h-12 animate-pulse rounded-xl bg-slate-100" />
    </div>
  )
}

function FeedbackForm({
  page,
  score,
  negativeReasons = [],
  positiveReasons = [],
  notes,
  submitting,
  inlineError,
  onScoreChange,
  onNegativeReasonsChange,
  onPositiveReasonsChange,
  onNotesChange,
  onSubmit,
}) {
  const date = formatDate(page?.event_date)
  const weekday = weekdayOf(page?.event_date)

  function toggleNegativeReason(item) {
    onNegativeReasonsChange((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item],
    )
  }

  function togglePositiveReason(item) {
    onPositiveReasonsChange((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item],
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4" data-testid="feedback-form">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[14.5px] font-bold">{page?.event_name}</p>
        {date ? (
          <p className="mt-2 border-t border-dashed border-slate-300 pt-2 text-[12px] text-slate-500">
            🕓 יום {weekday}, <Ltr>{date}</Ltr>
          </p>
        ) : null}
      </div>

      <p className="text-center text-sm font-bold">איך היה האירוע?</p>
      {/* ה-`role`/`aria-label` **ברמת-הקבוצה** מהמוקאפ המאושר נשמרים כאן ולא הועברו
          לרכיב: ב-`HostessFormDialog` הוא כבר עטוף ב-`<Field label="התרשמות המנהלת (1–5)">`
          (נמדד באותו תור), וקבוצה נושאת-שם בתוך שדה נושא-שם היא הכרזה כפולה לקורא-מסך.
          🔴 **ושלושת ה-props למטה הם כל ההבדל בין קהל-המנהלת לקהל-הלקוח** — הנימוק
          המלא, עם המקור שנועל כל אחד, בהערת-הראש של הקובץ. */}
      <div className="flex justify-center" role="group" aria-label="דירוג בין כוכב אחד לחמישה">
        <RatingStars
          value={score}
          onChange={onScoreChange}
          testId="feedback-stars"
          tone="primary"
          starLabel={(star) => `כוכב ${star}`}
          hideCaption
        />
      </div>
      {/* 🔴 הכיתוב היחיד מתחת לכוכבים, מילה-במילה מהמוקאפ המאושר — **ברבים**, כמו כל
          הדף. הוא גם נוסח-הסיבה לכפתור-"שלח" החסום (A-1), ולכן `hideCaption` למעלה
          אינו "מחיקת מידע": הוא מסיר כיתוב-מנהלת כפול ומשאיר את זה. */}
      <p className="text-center text-[11px] text-slate-400">געו בכוכב כדי לדרג</p>

      {score != null ? (
        <div className="flex flex-col gap-2" data-testid="feedback-chips-section">
          <p className="text-xs font-semibold text-slate-600">
            {score <= 3
              ? 'במה נוכל להשתפר? (אפשר לסמן יותר מאחד)'
              : 'מה בלט לטובה? (אפשר לסמן יותר מאחד)'}
          </p>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={score <= 3 ? 'סיבות לשיפור' : 'הדגשים לשימור'}
          >
            {(score <= 3 ? FEEDBACK_NEGATIVE_REASONS : FEEDBACK_POSITIVE_REASONS).map((item) => {
              const selected = (score <= 3 ? negativeReasons : positiveReasons).includes(item)
              const onToggle =
                score <= 3 ? () => toggleNegativeReason(item) : () => togglePositiveReason(item)

              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={selected}
                  data-testid={`feedback-chip-${item}`}
                  onClick={onToggle}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? score <= 3
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-teal-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fb-notes" className="text-xs font-semibold text-slate-600">
          רוצים לספר לנו עוד? (רשות)
        </label>
        <textarea
          id="fb-notes"
          rows={3}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="לדוגמה: מה אהבתם, ומה כדאי לשפר בפעם הבאה"
          className="resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-[13.5px] text-slate-800"
        />
      </div>

      {inlineError ? (
        <p className="text-center text-[11px] text-red-600" role="alert">
          {inlineError}
        </p>
      ) : null}

      {/* A-1: חסום עד בחירת-כוכב; "געו בכוכב כדי לדרג" שמעל הוא נוסח-הסיבה — הבית
          הקיים ל"חסום, וכתוב-לידו למה" (FilterPill/disabled gate-note), בלי לצייר
          הודעה שנייה שהמוקאפ לא ביקש. */}
      <Button
        type="button"
        disabled={!score || submitting}
        onClick={onSubmit}
        data-testid="feedback-submit"
        className="mt-auto h-auto rounded-xl bg-teal-600 py-3.5 text-[15px] font-bold text-white hover:bg-teal-700"
      >
        שלח
      </Button>
    </div>
  )
}

// 🔴 **מסך-תוצאה מחליף את כל תוכן הכרטיס ואינו נוסף עליו** — אותו עוגן כמו התקדים
// (design-contract.md §⑥/S4, "מסך-תוצאה מחליף... לא נוסף עליו").
function Result({ state, onRetry }) {
  const look = RESULT_LOOK[state] ?? RESULT_LOOK[FEEDBACK_STATE.dead]

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
      role="status"
      data-testid={`feedback-result-${state}`}
    >
      <span
        aria-hidden="true"
        className={`flex h-13 w-13 items-center justify-center rounded-full text-2xl ${look.tone}`}
      >
        {look.icon}
      </span>
      <p className="max-w-[230px] text-[14px] font-bold leading-relaxed text-slate-700">
        {FEEDBACK_MESSAGE[state]}
      </p>
      {state === FEEDBACK_STATE.thankYou ? (
        <p className="max-w-[230px] text-[12px] leading-relaxed text-slate-500">
          המשוב שלכם נשמר ועוזר לנו להשתפר באירוע הבא.
        </p>
      ) : null}
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          data-testid="feedback-retry"
          className="h-auto rounded-xl border-slate-300 px-5 py-3 font-semibold text-slate-700"
        >
          נסו שוב
        </Button>
      ) : null}
    </div>
  )
}
