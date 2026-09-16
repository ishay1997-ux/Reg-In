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
// שהריצה `done`, ולהפך. הפס קורא את מצבו משני מקורות בלבד:
// ‏① `meta.run` של המטען — **הריצה המאושרת האחרונה בלבד** (כך ה-RPC כתוב) ⇒ מצב 5.
// ‏② תשובת הקריאה האחרונה בסשן הזה ⇒ מצבים 2–4.
// 🔴 **ומה שאין, ומדווח כמגבלה:** ריצה שרצה / נעצרה / ממתינה-לאישור **שהתחילה בכרטיסייה
// אחרת אינה נראית כאן** — ‏`report_m22_notes` שולף `where approved_at is not null` בלבד.

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

function barState({ run, local, pending, notesCount, canEdit }) {
  if (pending) return { text: 'מסווג…', sub: RUNNING_SUB, action: null }
  if (local) return localState(local)
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
  const state = barState({ run, local, pending, notesCount: payload?.population?.n, canEdit })

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
      {/* ⑤ · ⑦ — בלי `edit` על 'דו"חות' הכפתור **אינו מוצג כלל**, ולא מוצג-מנוטרל. */}
      {canEdit && state.action && (
        <Button
          type="button"
          disabled={pending}
          onClick={actions[state.action]}
          className="h-auto rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
          data-testid="m25-run-button"
        >
          {state.actionLabel}
        </Button>
      )}
    </section>
  )
}
