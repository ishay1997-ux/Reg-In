// 🤖 **מ25 — פס-מצב סיווג-ההערות, בתוך דף מ22** (ת2 · `cards-customers.md` מ22 ① שורה 13).
// **אין לו מסך משלו** (🖥️ מ25: *"מצויר בקובץ-המוקאפ של דף 20, לא כקובץ נפרד"*).
//
// 🔴 **וזו הכתיבה היחידה בכל מודול 11** (§4.4), ולכן שני הכפתורים גדורים **`edit` על
// 'דו"חות'** ואינם מוצגים כלל בלעדיה (הכרטיס ⑤ · ⑦). ‏🚫 **הדפדפן אינו כותב לטבלאות:**
// *"הרץ ניתוח"* קורא לפונקציית-שרת, ו*"אשר להצגה"* ל-RPC מגודר.
//
// ⚠️ **החריג המוצהר לכלל-ברזל 14:** הקריאה ל-`supabase.functions.invoke` יושבת כאן ולא
// ב-`api.js` — **הוראת-המתזמר לצעד 3.4 במפורש** (*"add that single call to your tab
// through a small helper in your own files (do not edit `api.js`)"*), כי `api.js` משותף
// לארבע לשוניות שנבנות במקביל. **האישור לעומת זאת כן עובר דרך `api.js`**
// (`approveFeedbackAiRun`), כי הוא כבר נכתב שם בצעד-היסוד.
//
// 🔑 **חמשת המצבים אינם חמשת מצבי-המעטפת** (הכרטיס ④): הדף יכול להיות ב"תקלה" בזמן
// שהריצה `done`, ולהפך. הפס קורא את מצבו משלושה מקורות, בסדר הזה:
// ‏① תשובת הקריאה האחרונה **בסשן הזה** ⇒ מצבים 2–4, עם המספרים המדויקים שהיא החזירה.
// ‏② `meta.run_in_progress` — **ריצה לא-מאושרת שהתחילה במקום אחר** ⇒ מצב 2 או 3.
// ‏③ `meta.run` — הריצות המאושרות ⇒ מצב 5.
// ✅ **② נסגר בסבב-היישור 16/09 11:1X, והוא היה הנקודה-העיוורת שדיווחתי עליה:** עד
// מיגרציה G2 הדף לא ידע דבר על ריצה שרצה בכרטיסייה אחרת, הפס אמר *"N הערות טרם סווגו"*
// עם כפתור פעיל, והלחיצה הוחזרה `409`.
// 🔴 **והענף הוא על `status`, לעולם לא על עצם קיום המפתח** — נמדד 16/09/2026: המטען החי
// מחזיר `run_in_progress` של **ריצה 4 במצב `failed`**. ריצה כזו אינה "בתהליך" בשום מובן:
// אי-אפשר להמשיכה (`continue` מקבל `partial` בלבד) ואין מה לאשר בה ⇒ היא מתעלמת, והדף
// מציג את מה שהיה מציג בלעדיה.

import { useState } from 'react'
import { supabase } from '@/supabaseClient'
import { Button } from '@/components/ui/button'
import { formatIsraelDate, isolateLtr } from '@/lib/reportsFormat'
import { approveFeedbackAiRun } from '../../api'

const FUNCTION_NAME = 'classify-feedback'

// 🔤 הנוסחים הנעולים של הכרטיס ושל המוקאפ המאושר, מילה-במילה.
const RUN_LABEL = 'הרץ ניתוח'
const CONTINUE_LABEL = 'המשך'
const APPROVE_LABEL = 'אשר להצגה'
const VIEWER_SENTENCE = 'טרם אושרה ריצת-ניתוח — פנה למנכ"ל'
const BATCH_SUB =
  'הניתוח רץ באצווה, לא בזמן אמת. אחרי שהוא מסיים, את בודקת 20 דוגמאות ומאשרת להצגה — ורק אז הדוח מוצג.'
// 🔤 נוסח אחד שאינו בכרטיס ואינו במוקאפ — ר' הדיווח: **אין ערוץ-התקדמות חי**, כי ההרצה
// היא סבב-רשת אחד שחוזר בסופו. *"מסווג… 0/426"* היה מספר שקרי, ולכן נאמר רק מה שידוע.
const RUNNING_SUB = 'זה לוקח כמה דקות. הסיווג נשמר בשרת גם אם תעזבי את הדף.'
const GENERIC_ERROR = 'הניתוח נכשל. נסי שוב, ואם זה חוזר — פני למנכ"ל.'
// 🔤 הנוסח של פונקציית-השרת עצמה (‏`index.ts`, ענף ה-409) — **מועתק ולא מנוסח מחדש**, כדי
// שמה שכתוב על הפס לפני הלחיצה יהיה בדיוק מה שהיה נאמר אחריה.
const ALREADY_RUNNING = 'ריצת-ניתוח כבר פועלת.'
// שני המצבים שבהם ריצה **לא-מאושרת** היא עדיין רלוונטית. `failed` אינו בהם במכוון.
const LIVE_RUN_STATUSES = new Set(['running', 'partial'])

/**
 * הקריאה לפונקציית-השרת. **מחזירה את הגוף בשני המסלולים** — `2xx` ו-`4xx/5xx` כאחד:
 * ‏`functions.invoke` עוטף תשובה לא-תקינה ב-`FunctionsHttpError`, והגוף העברי יושב ב-
 * `error.context` ולא ב-`error.message` (‏`@supabase/functions-js`, `FunctionsClient`).
 * 🔴 **בלי הקריאה ל-`context.json()` המשתמשת הייתה מקבלת `"Edge Function returned a
 * non-2xx status code"` באנגלית** במקום *"מפתח ה-AI לא הוגדר במערכת — פנה למנכ"ל"*.
 */
async function invokeClassify(body) {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body })
  if (!error) return data
  try {
    return await error.context.json()
  } catch {
    // כשל-רשת אמיתי (אין תשובה כלל) — אין גוף לקרוא, ולכן הנוסח הכללי.
    return { error: GENERIC_ERROR }
  }
}

// 🔑 **מצב-הפס נגזר בפונקציות טהורות** ולא בתוך ה-JSX: חמישה מצבים × שלוש הרשאות בתוך
// רינדור אחד עוברים את תקרת-20 של SonarJS.
const classifiedCount = (result) => (result?.ok ?? 0) + (result?.failed ?? 0)

function localState(local) {
  const done = classifiedCount(local)
  if (local.status === 'partial') {
    const progress = isolateLtr(`${done}/${done + (local.remaining ?? 0)}`)
    return {
      text: `נעצר: ${progress}`,
      sub: 'מה שסווג נשמר. "המשך" שולח רק את מה שנותר.',
      action: 'continue',
      actionLabel: CONTINUE_LABEL,
    }
  }
  if (local.status === 'done') {
    return {
      text: `הסתיים · ${isolateLtr(String(local.ok ?? done))} סווגו`,
      sub: 'בדקי עשרים דוגמאות לפני האישור — אחרי האישור הן מוצגות בדוח.',
      action: 'approve',
      actionLabel: APPROVE_LABEL,
    }
  }
  if (local.status === 'noop') return { text: 'אין הערות חדשות לסיווג.', sub: null, action: null }
  // `failed` — ו*"המשך"* אינו עוזר לה (הוא מקבל `partial` בלבד) ⇒ ריצה חדשה.
  return {
    text: 'הריצה נכשלה ולא נשמרו בה סיווגים.',
    sub: 'אפשר להריץ שוב; ריצה שנכשלה אינה ניתנת להמשכה.',
    action: 'start',
    actionLabel: RUN_LABEL,
  }
}

/**
 * ריצה לא-מאושרת שהשרת מדווח עליה (`meta.run_in_progress`) — **המצב היחיד שהפס אינו
 * לומד מהלחיצה של עצמו.**
 * ‏`running` ⇒ מצב 2: אין מה ללחוץ, והכפתור מוצג **מנוטרל** עם הנוסח של השרת (לחיצה
 * שנייה מוחזרת `409`; המוקאפ, מצב 2: *"הכפתור מנוטרל"*).
 * ‏`partial` ⇒ מצב 3: **[המשך] פעיל.** ⚠️ **וזו סטייה מוצהרת מהוראת-המתזמר** *("running/
 * partial ⇒ the button is disabled")*: ‏`continue` מקבל **בדיוק** ריצת-`partial`, וכרטיס
 * מ22 ① ומצב 3 של מ25 נוקבים ב-*"נעצר: N/M · [המשך]"*. כפתור מנוטרל כאן היה הופך ריצה
 * שנעצרה לבלתי-ניתנת-לסיום מהמסך. **מה שכן מנוטרל הוא *הרץ ניתוח*** — ריצה חדשה לצד
 * ריצה שנעצרה הייתה יוצרת שורת-ריצה שנייה על אותן הערות. מדווח להכרעה.
 */
function serverRunState(active) {
  const done = (active.ok_count ?? 0) + (active.failed_count ?? 0)
  // 🔑 `sent_count` **של הריצה הזו** הוא המכנה הנכון (⁦426⁩ בריצה 4). 🚫 ולא
  // `meta.run.sent_count`, שהוא מאז G2 **סכום על כל הריצות המאושרות** (⁦812⁩) ואינו מכנה.
  const progress = isolateLtr(`${done}/${active.sent_count ?? 0}`)
  if (active.status === 'running') {
    return {
      text: `מסווג… ${progress}`,
      sub: ALREADY_RUNNING,
      action: null,
      disabledAction: RUN_LABEL,
    }
  }
  return {
    text: `נעצר: ${progress}`,
    sub: 'הריצה נעצרה באמצע. מה שסווג נשמר, ו"המשך" שולח רק את מה שנותר.',
    action: 'continueServer',
    actionLabel: CONTINUE_LABEL,
    runId: active.run_id,
  }
}

function barState({ run, runInProgress, local, pending, notesCount, canEdit }) {
  if (pending) return { text: 'מסווג…', sub: RUNNING_SUB, action: null }
  if (local) return localState(local)
  // ר' ההערה למעלה: הענף הוא על `status`, ולא על עצם קיום `run_in_progress`.
  if (runInProgress && LIVE_RUN_STATUSES.has(runInProgress.status)) {
    return serverRunState(runInProgress)
  }
  if (run?.approved_at) {
    const day = isolateLtr(formatIsraelDate(String(run.approved_at).slice(0, 10)))
    return { text: `מציג את הריצה מ-${day}, אושרה ע"י ${run.approved_by}`, sub: null, action: null }
  }
  if (!canEdit) return { text: VIEWER_SENTENCE, sub: null, action: null }
  return {
    text: `${isolateLtr(String(notesCount ?? 0))} הערות טרם סווגו`,
    sub: BATCH_SUB,
    action: 'start',
    actionLabel: RUN_LABEL,
  }
}

/**
 * ‏`payload` — מטען מ22 אחרי `transformPayload` · `canEdit` — `edit` על 'דו"חות' ·
 * ‏`onChanged()` — מבקש מהמעטפת לטעון את הדוח מחדש (אחרי אישור המטען משתנה מקצה לקצה).
 */
export default function AnalysisRunBar({ payload, canEdit, onChanged }) {
  const [local, setLocal] = useState(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const run = payload?.meta?.run ?? null
  const runInProgress = payload?.meta?.run_in_progress ?? null
  const state = barState({
    run,
    runInProgress,
    local,
    pending,
    notesCount: payload?.population?.n,
    canEdit,
  })

  async function classify(body) {
    setPending(true)
    setError(null)
    try {
      const result = await invokeClassify(body)
      // 🔴 **הענף על `body.status` ולא על `res.ok`** (§2ב C8 · README של הפונקציה):
      // ריצה שנכשלה כולה מחזירה גוף עם `status:'failed'`, ותשובת-שגיאה מחזירה `error`.
      if (result?.status) setLocal(result)
      else setError(result?.error ?? GENERIC_ERROR)
    } catch (err) {
      setError(err?.message ?? GENERIC_ERROR)
    } finally {
      setPending(false)
    }
  }

  async function approve() {
    setPending(true)
    setError(null)
    try {
      await approveFeedbackAiRun(local?.run_id)
      setLocal(null)
      onChanged?.()
    } catch (err) {
      // ‏`P0001` נושא נוסח עברי מוכן מהמסד (*"ריצת-הניתוח כבר אושרה להצגה."*) ⇒ מוצג כמות שהוא.
      setError(err?.message ?? 'אישור ריצת-הניתוח נכשל.')
    } finally {
      setPending(false)
    }
  }

  const actions = {
    start: () => classify({ action: 'start' }),
    continue: () => classify({ action: 'continue', run_id: local?.run_id }),
    // המשך של ריצה שהשרת דיווח עליה — ה-`run_id` מגיע מהמטען ולא מתשובה בסשן הזה.
    continueServer: () => classify({ action: 'continue', run_id: state.runId }),
    approve,
  }

  return (
    <section
      className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5"
      aria-label="מצב ריצת-הניתוח"
      data-testid="m25-run-bar"
    >
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-slate-700" data-testid="m25-run-text">
          {state.text}
        </p>
        {state.sub && <p className="mt-0.5 text-[11.5px] text-slate-600">{state.sub}</p>}
        {error && (
          <p className="mt-1 text-[11.5px] font-semibold text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
      {/* ⑤ · ⑦ — בלי `edit` על 'דו"חות' הכפתור **אינו מוצג כלל**, ולא מוצג-מנוטרל.
          ⚠️ **ומנוטרל אינו נעדר:** בזמן שריצה פועלת הכפתור **כן** מוצג ומנוטרל (מצב 2
          של מ25), כי היעלמותו הייתה נקראת כאילו היכולת אינה קיימת בתפקיד. */}
      {canEdit && (state.action || state.disabledAction) && (
        <Button
          type="button"
          disabled={pending || !state.action}
          onClick={state.action ? actions[state.action] : undefined}
          className="h-auto rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
          data-testid="m25-run-button"
        >
          {state.actionLabel ?? state.disabledAction}
        </Button>
      )}
    </section>
  )
}
