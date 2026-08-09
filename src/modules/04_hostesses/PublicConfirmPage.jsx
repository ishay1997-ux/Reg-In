// משטח 5 — **הדף הציבורי לאישור/סירוב משמרת.**
//
// 🔴 **זה הדף היחיד באפליקציה שנפתח בלי התחברות, בלי תפקיד ובלי סרגל-צד.** מי שרואה
// אותו היא דיילת בטלפון שלה, שקיבלה קישור במייל ולחצה עליו — אין לה חשבון ולא תהיה לה.
// ⇒ **הוא יושב מחוץ ל-`<MainLayout>`**, כמו `/login`, ובלי `<ProtectedRoute>`.
// ⚠️ **עטיפה ב-`<ProtectedRoute>` "כדי לספק את `App.routes.test.jsx`" הייתה מרצה את
// הבדיקה ושוברת את הדף** — הוא היה דורש התחברות ממי שאין לה. *(ובפועל הבדיקה כלל אינה
// סורקת מסלולים מחוץ ל-`MainLayout`; ר' ההערה ב-`App.jsx`.)*
//
// 🔴 **הנתיב `/shift/:token` נעול ואינו בחירה** — `confirmUrlFor` כבר צרב אותו לתוך
// זימונים שנשלחו, ומייל אי-אפשר להחזיר. נתיב אחר אינו נכשל בקול: הוא מייצר 404 לדיילת
// שמחזיקה קישור ששלחנו, והמנהלת רואה שורה שנשארה `pending` וקוראת אותה כ"לא ענתה".

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Money from '@/components/Money'
import { Button } from '@/components/ui/button'
import {
  SHIFT_INVITE_STATE,
  SHIFT_INVITE_MESSAGE,
  stateFromInvitePayload,
  stateFromRespondPayload,
  travelAmountToShow,
  expiryNotice,
  eventWhenLine,
} from '@/lib/shiftInvite'
import { fetchShiftInvite, respondToShiftInvite, SHIFT_RESPONSE } from './publicApi'

const RESULT_LOOK = {
  [SHIFT_INVITE_STATE.confirmed]: { icon: '✓', tone: 'bg-green-100 text-green-700' },
  [SHIFT_INVITE_STATE.declined]: { icon: '↩', tone: 'bg-slate-100 text-slate-500' },
  [SHIFT_INVITE_STATE.filled]: { icon: '👥', tone: 'bg-teal-100 text-teal-700' },
  [SHIFT_INVITE_STATE.dead]: { icon: '⏳', tone: 'bg-amber-50 text-amber-700' },
  [SHIFT_INVITE_STATE.saveFailed]: { icon: '!', tone: 'bg-red-50 text-red-700' },
}

export default function PublicConfirmPage() {
  const { token } = useParams()
  const [state, setState] = useState(SHIFT_INVITE_STATE.loading)
  const [invite, setInvite] = useState(null)
  const [saving, setSaving] = useState(false)

  // 🔴 **כשל-רשת אינו "הקישור אינו בתוקף".** טעינה שנכשלה טכנית מגיעה ל-`saveFailed`,
  // שהוא המצב היחיד עם כפתור "נסי שוב" — להציג "הקישור מת" על קרטוע-סלולר היה שולח
  // דיילת פעילה להתקשר למשרד בלי סיבה.
  //
  // טעינת-הזימון — **תבנית האפקט של שאר המודול** (`RepositoryTab`): פונקציה אסינכרונית
  // פנימית + שומר-ביטול, כך שתשובה שחוזרת אחרי שהדף נסגר אינה כותבת למצב שכבר אינו קיים.
  // ⚠️ הקריאה **חייבת** להיות בתוך ה-IIFE ולא פונקציה חיצונית שנקראת כאן —
  // ‏`react-hooks/set-state-in-effect` חוסם קריאה ישירה לכל דבר שהוא מסוגל לעקוב ממנו
  // ל-`setState`. הרענון הידני נעשה דרך `reloadKey` ולא דרך קריאה חוזרת לאותה פונקציה.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const payload = await fetchShiftInvite(token)
        if (cancelled) return
        setInvite(payload?.state === 'awaiting' ? payload : null)
        setState(stateFromInvitePayload(payload))
      } catch {
        if (cancelled) return
        setInvite(null)
        setState(SHIFT_INVITE_STATE.saveFailed)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  // "נסי שוב" — כאן דווקא **כן** חוזרים לשלד מיד, כדי שהלחיצה תיראה על המסך.
  function retry() {
    setState(SHIFT_INVITE_STATE.loading)
    setReloadKey((key) => key + 1)
  }

  // 🔑 **כישלון-כתיבה אינו מנוחש מהמחרוזת הגנרית — הדף קורא מחדש.** הפונקציה הכותבת
  // מחזירה במכוון נוסח אחד לשלושת מצבי-הכישלון (§③, אנטי-אורקל), אבל §⑦ דורש שאם
  // המשרה התמלאה בזמן שהדף היה פתוח בטלפון — הקליק יראה **"כבר אוישה"**. הקריאה החוזרת
  // מספקת בדיוק את זה, בלי לגעת בפונקציה הכותבת ובלי לפצל את ההודעה הגנרית.
  async function answer(response) {
    setSaving(true)
    try {
      const written = stateFromRespondPayload(await respondToShiftInvite(token, response))
      if (written) {
        setState(written)
        return
      }
      const payload = await fetchShiftInvite(token)
      setState(stateFromInvitePayload(payload))
    } catch {
      // 🚫 **לעולם לא "נשמר" כשלא נשמר** (`spec.md § מה ייחשב עובד` #3).
      setState(SHIFT_INVITE_STATE.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="mx-auto flex min-h-[560px] w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal-600" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-500">REG-IN · אישור השתתפות</span>
        </div>

        {state === SHIFT_INVITE_STATE.loading ? (
          <Skeleton />
        ) : state === SHIFT_INVITE_STATE.awaiting ? (
          <AwaitingAnswer invite={invite} saving={saving} onAnswer={answer} />
        ) : (
          <Result state={state} onRetry={state === SHIFT_INVITE_STATE.saveFailed ? retry : null} />
        )}
      </div>
    </div>
  )
}

// 🚫 **שלד בלי הבטחה מוקדמת** (§⑤, "טעינה"): אין כאן שם-אירוע, אין כפתורים, ואין
// "טוען את המשמרת שלך" — טקסט כזה מבטיח שיש משמרת עוד לפני שהטוקן נבדק.
function Skeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="shift-loading" aria-busy="true">
      <span className="sr-only">טוען</span>
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
    </div>
  )
}

function AwaitingAnswer({ invite, saving, onAnswer }) {
  const travel = travelAmountToShow(invite?.travel_amount)
  const expiry = expiryNotice(invite?.expires_at, new Date())
  const when = eventWhenLine(invite?.event_date, invite?.start_time, invite?.end_time)

  return (
    <div className="flex flex-1 flex-col gap-4" data-testid="shift-awaiting">
      <p className="text-base font-bold">שלום, {invite?.hostess_name} 👋</p>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[15px] font-bold">
          {invite?.event_name}
          {invite?.customer_name ? ` — ${invite.customer_name}` : ''}
        </p>
        {invite?.location ? (
          <p className="mt-2 text-[12.5px] text-slate-600">📍 {invite.location}</p>
        ) : null}
        {when ? <p className="mt-2 text-[12.5px] text-slate-600">🕓 {when}</p> : null}
        <p className="mt-3 border-t border-dashed border-slate-300 pt-3 text-[13px] font-semibold text-teal-700">
          {/* `local-3` — כל עוד פרמטר-הנסיעות `0`, "נסיעות" מודפס **בלי מספר**, בדיוק כמו במייל. */}
          תעריף: <Money amount={invite?.hourly_rate} />
          /שעה + נסיעות
          {travel ? (
            <>
              {' '}
              <Money amount={travel} />
            </>
          ) : null}
        </p>
      </div>

      <p className="text-center text-sm font-semibold">תוכלי להגיע למשמרת הזו?</p>

      {/* מטרות-מגע 44px+ ו-`focus-visible` גלוי — הדף נצרך כמעט תמיד באצבע. */}
      <div className="flex flex-col gap-2.5">
        <Button
          type="button"
          disabled={saving}
          onClick={() => onAnswer(SHIFT_RESPONSE.confirm)}
          data-testid="shift-confirm"
          className="h-auto rounded-xl bg-teal-600 py-3.5 text-[15px] font-bold text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
        >
          ✓ אני מגיעה
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => onAnswer(SHIFT_RESPONSE.decline)}
          data-testid="shift-decline"
          className="h-auto rounded-xl border-slate-300 py-3.5 text-[15px] font-bold text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          לא אוכל הפעם
        </Button>
      </div>

      {expiry ? (
        <p className="mt-auto text-center text-[11px] text-slate-500" data-testid="shift-expiry">
          {expiry}
        </p>
      ) : null}
    </div>
  )
}

// 🔴 **מסך-תוצאה מחליף את כל תוכן הדף ואינו נוסף עליו** — המוקאפ המאושר אומר זאת
// במפורש. 🚫 **ואין "כפתור שני" אחרי שנרשמה תשובה**: חזרה-בה היא שיחת-טלפון למנהלת
// (`processes-approved.md §ב4`), ולכן שני הכפתורים נעלמים לגמרי.
function Result({ state, onRetry }) {
  const look = RESULT_LOOK[state] ?? RESULT_LOOK[SHIFT_INVITE_STATE.dead]

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
      role="status"
      data-testid={`shift-result-${state}`}
    >
      <span
        aria-hidden="true"
        className={`flex h-13 w-13 items-center justify-center rounded-full text-2xl ${look.tone}`}
      >
        {look.icon}
      </span>
      <p className="max-w-[230px] text-[13px] leading-relaxed text-slate-600">
        {SHIFT_INVITE_MESSAGE[state]}
      </p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          data-testid="shift-retry"
          className="h-auto rounded-xl border-slate-300 px-5 py-3 font-semibold text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          נסי שוב
        </Button>
      ) : null}
    </div>
  )
}
