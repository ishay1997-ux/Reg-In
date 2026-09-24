// "נסחי מייל מעקב" + חלון "טיוטת מייל מעקב" — נוסחה בעזרת AI, ונשלחת **רק** בידי אדם
// (ליטושי-הכנס D2, 24/09/2026; התוכנית `docs/plans/2026-09-24-system-polish.md` §6 D2 · §6ה).
//
// יושב בתוך חלון-המסמך (`QuoteDocumentDialog.jsx`). הכללים הטהורים — מתי הכפתור פעיל, איך כשל
// מסווג, איך נבנה ה-`mailto:` — ב-`src/lib/quoteFollowup.js`; הקריאה לשרת ב-`api.js`.
//
// 🔒 **אין כאן כפתור "שלחי".** שתי הפעולות מעבירות את הטקסט לאדם: `העתיקי` (ללוח) ו-`פתחי במייל`
//    (תוכנת-המייל שלה, עם הנמען, הנושא והגוף). ולכן `טיוטה — בדקי לפני שליחה.` קבוע, בבסיס — אזהרה
//    לפני פעולה יוצאת-החוצה לעולם לא עוברת לשכבת-ההסבר (מדריך-הסגנון H2).
//
// ♿ **נגישות — מה ש-Radix נותן, ולמה הכפתור הוא `DialogTrigger`:** פוקוס נכנס לחלון ונלכד בו, `Esc`
//    סוגר (את החלון העליון בלבד), והפוקוס **חוזר לכפתור שפתח** — ⚠️ **רק כשהכפתור הוא ה-Trigger של
//    החלון.** חלון שנפתח ב-`open` חיצוני בלי Trigger מבטל ב-`onCloseAutoFocus` את ההחזרה ואין לו לאן
//    להחזיר — הפוקוס נופל ל-`body`, מחוץ למלכודת של חלון-המסמך שמתחת. מה שנוסף כאן: אזור
//    `aria-live="polite"` ("מנסחת…" · "הטיוטה מוכנה." · הכשל · "הועתק."), `<label>` לנושא ולגוף,
//    כתובת-המייל ב-`dir="ltr"`, שלד ב-`motion-safe:` בלבד, ונימוק-השבתה **כטקסט גלוי** שמקושר
//    לכפתור ב-`aria-describedby` — לא `title`.

import { useEffect, useRef, useState } from 'react'
import { Copy, Mail, RotateCcw, Sparkles } from 'lucide-react'
import Hint from '@/components/Hint'
import Ltr from '@/components/Ltr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import { buildSenderSignature } from '@/lib/quotes'
import {
  FOLLOWUP_LABEL,
  FOLLOWUP_NO_EMAIL_REASON,
  FOLLOWUP_NOTICE,
  buildFollowupMailto,
  composeFollowupBody,
} from '@/lib/quoteFollowup'
import { draftFollowupEmail } from '@/modules/03_quotes/api'

const BUTTON = 'h-auto py-2 px-4 rounded-lg font-semibold gap-2'
const PRIMARY = 'bg-teal-700 hover:bg-teal-800 text-white'
const FIELD =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-300'

// השלד — צורת-הטיוטה (שורת-נושא + חמש שורות-גוף), לא ספינר: המשתמשת רואה *מה* עומד להופיע.
// ‏`motion-safe:` — מי שביקשה להפחית תנועה (`prefers-reduced-motion`) רואה שלד עומד.
function DraftSkeleton() {
  const bar = 'motion-safe:animate-pulse rounded bg-slate-200'
  return (
    <div className="flex flex-col gap-3" aria-hidden="true" data-testid="followup-skeleton">
      <div className={`h-9 w-full ${bar}`} />
      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
        {['w-1/3', 'w-full', 'w-11/12', 'w-4/5', 'w-1/4'].map((width) => (
          <div key={width} className={`h-4 ${width} ${bar}`} />
        ))}
      </div>
    </div>
  )
}

// מה האזור-החי אומר עכשיו — פונקציה ולא טרנארי-מקונן (SonarJS).
function statusText(phase, failure, notice) {
  // ✏️ 24/09/2026 (הסגן): כנות במצב-המערכת — שתי המדידות החיות לא הגיעו לתשובה תוך 18–25 שניות.
  if (phase === 'loading') return 'מנסחת טיוטה — זה יכול לקחת עד חצי דקה.'
  if (phase === 'error') return failure?.message
  if (notice === 'copied') return 'הועתק.'
  if (notice === 'bodyCopied') return 'גוף הטיוטה הועתק — הדביקי אותו במייל שנפתח.'
  return 'הטיוטה מוכנה.'
}

function statusClass(phase, notice) {
  if (phase === 'error') return 'text-sm font-medium text-red-600'
  if (phase === 'ready' && !notice) return 'sr-only'
  return 'text-sm text-slate-500'
}

// ── תוכן-החלון, עם כל המצב. **נטען מחדש בכל פתיחה**: Radix מסיר את `DialogContent` כשהחלון סגור,
// ולכן כל פתיחה היא mount טרי = טיוטה חדשה, בלי effect שמאפס state (שגיאת-lint בקונפיג הזה).
function FollowupDraftPanel({ quoteId }) {
  const { user } = useAuth()
  const toast = useToast()
  // 🔴 **החתימה נקבעת פעם אחת, בפתיחה — ולא כתלות של ה-effect.** ‏`user` מ-AuthContext יכול להתחלף
  //    בזהות (רענון-טוקן), ותלות בו הייתה מנסחת מחדש **ושורפת עוד בקשה ממכסת-ה-AI** בלי שאיש לחץ.
  const [signature] = useState(() => buildSenderSignature(user))
  // phase: 'loading' | 'ready' | 'error'. ⚠️ המעבר ל-'loading' בניסיון-חוזר קורה **בלחיצה**, לא ב-effect.
  const [phase, setPhase] = useState('loading')
  const [failure, setFailure] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [to, setTo] = useState(null)
  // מה האזור-החי אומר אחרי פעולה: '' · 'copied' · 'bodyCopied'. מתאפס אחרי רגע.
  const [notice, setNotice] = useState('')
  const noticeTimer = useRef(null)
  // 🔴 **בקשה אחת לכל ניסיון — גם תחת StrictMode** (`src/main.jsx`). בפיתוח React מריץ כל effect
  //    פעמיים; בלי הזיכרון הזה כל פתיחה הייתה שולחת **שתי** בקשות ל-Gemini ושורפת מכסה כפולה.
  //    ההרצה השנייה נרשמת לאותה הבטחה, והראשונה (שבוטלה) פשוט לא מעדכנת state.
  const inflight = useRef(null)
  // ✏️ 24/09/2026 (ממצא-הבודק): סגירת-החלון באמצע הניסוח **מבטלת** את הבקשה — אחרת פתיחה-מחדש
  // השאירה שתי בקשות חיות במקביל. 🔴 **הביטול דחוי בתקתוק אחד ומתבטל בהרכבה-מחדש:** StrictMode מפרק
  // ומרכיב כל רכיב פעם אחת בפיתוח, וביטול מיידי היה הורג את הבקשה היחידה (ר' `inflight` למעלה).
  const abortTimer = useRef(null)
  useEffect(() => {
    clearTimeout(abortTimer.current)
    return () => {
      abortTimer.current = setTimeout(() => inflight.current?.controller.abort(), 0)
    }
  }, [])

  useEffect(() => {
    if (!quoteId) return undefined
    if (inflight.current?.attempt !== attempt) {
      const controller = new AbortController()
      inflight.current = {
        attempt,
        controller,
        promise: draftFollowupEmail(quoteId, { signal: controller.signal }),
      }
    }
    let cancelled = false
    inflight.current.promise
      .then((draft) => {
        if (cancelled) return
        setSubject(draft.subject)
        // החתימה של מי שלחצה — אותה חתימה של מייל-ההצעה (`buildSenderSignature`).
        setBody(composeFollowupBody(draft.body, signature))
        setTo(draft.to)
        setPhase('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setFailure({ kind: err?.kind ?? 'retry', message: err?.message })
        setPhase('error')
      })
    return () => {
      cancelled = true
    }
  }, [quoteId, attempt, signature])

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  // ✏️ 24/09/2026 (ממצא-הבודק): "גוף הטיוטה הועתק — הדביקי…" **נשאר** — הוא נקרא אחרי שתוכנת-המייל
  // נפתחה מעל החלון, ו-2.5 שניות כבר עברו כשהיא חוזרת. רק "הועתק." (אישור-רגע) נעלם.
  function announce(next) {
    clearTimeout(noticeTimer.current)
    setNotice(next)
    if (next !== 'bodyCopied') noticeTimer.current = setTimeout(() => setNotice(''), 2500)
  }

  function retry() {
    setFailure(null)
    setPhase('loading')
    setAttempt((n) => n + 1)
  }

  async function copyText(text, kind) {
    try {
      await navigator.clipboard.writeText(text)
      announce(kind)
    } catch {
      // אותו נוסח של אזור-השיווק (`MarketingPanel.jsx`) — אותה תקלה, אותן מילים (R30). ✏️ 24/09 (הסגן):
      // סביל ⇐ ציווי-נקבה, מדריך-הסגנון §1 — ובשני המקומות יחד.
      toast.error('העתקה נכשלה — סמני את הטקסט והעתיקי ידנית.')
    }
  }

  const ready = phase === 'ready'
  const mailto = ready && to ? buildFollowupMailto({ to, subject, body }) : null

  // קישור ארוך מדי ⇒ בלי גוף, והגוף מועתק ללוח **באותה לחיצה** (ר' `buildFollowupMailto`).
  function onOpenMail() {
    if (mailto && !mailto.bodyIncluded) copyText(body, 'bodyCopied')
  }

  const liveText = statusText(phase, failure, notice)

  return (
    <>
      {/* ⚠️ קבוע, לא רמז: אזהרה לפני פעולה יוצאת-החוצה (H2). ענבר = "דורש תשומת-לב", לא חוסם.
          מוצג כל עוד יש (או עומדת להיות) טיוטה — בכשל אין מה לבדוק, והאזהרה הייתה רעש. */}
      {phase !== 'error' && (
        <p
          className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-800"
          data-testid="followup-notice"
        >
          {FOLLOWUP_NOTICE}
        </p>
      )}
      <Hint id="quoteFollowup.privacy" />

      {/* האזור-החי: הודעה אחת בכל רגע. הכשל גלוי (לא sr-only) — יש בו דרך קדימה. "הטיוטה מוכנה."
          מוכרז לקורא-מסך בלבד — הטיוטה עצמה על המסך היא ההודעה; אותו אלמנט, כדי שההכרזה תישמע. */}
      <p aria-live="polite" className={statusClass(phase, notice)} data-testid="followup-status">
        {liveText}
      </p>

      {phase === 'loading' && <DraftSkeleton />}

      {phase === 'error' && failure?.kind === 'retry' && (
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={retry}
            className={BUTTON}
            data-testid="followup-retry"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            נסי שוב
          </Button>
        </div>
      )}

      {ready && (
        <div className="flex flex-col gap-3" data-testid="followup-draft">
          <p className="text-sm text-slate-600" data-testid="followup-ai-origin">
            נוסחה בעזרת AI
          </p>
          <p className="text-sm text-slate-600">
            אל:{' '}
            {to ? (
              <span dir="ltr" className="font-medium text-slate-800" data-testid="followup-to">
                {to}
              </span>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </p>
          <div className="flex flex-col gap-1">
            <label htmlFor="followup-subject" className="text-sm font-medium text-slate-700">
              נושא
            </label>
            <Input
              id="followup-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-right"
              placeholder="לדוגמה: מעקב אחרי הצעת המחיר"
              data-testid="followup-subject"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="followup-body" className="text-sm font-medium text-slate-700">
              גוף המייל
            </label>
            <textarea
              id="followup-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className={`${FIELD} resize-y leading-relaxed`}
              placeholder="לדוגמה: שלום, רצינו לבדוק אם עלו שאלות על ההצעה."
              data-testid="followup-body"
            />
          </div>
        </div>
      )}

      {ready && (
        <DialogFooter className="items-start">
          {mailto ? (
            <Button asChild className={`${BUTTON} ${PRIMARY}`}>
              <a href={mailto.href} onClick={onOpenMail} data-testid="followup-open-mail">
                <Mail aria-hidden="true" className="size-4" />
                פתחי במייל
              </a>
            </Button>
          ) : (
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                disabled
                aria-describedby="followup-no-email"
                className={`${BUTTON} ${PRIMARY}`}
                data-testid="followup-open-mail"
              >
                <Mail aria-hidden="true" className="size-4" />
                פתחי במייל
              </Button>
              <p
                id="followup-no-email"
                className="text-xs text-slate-600"
                data-testid="followup-no-email"
              >
                {FOLLOWUP_NO_EMAIL_REASON}
              </p>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={body.trim() === ''}
            onClick={() => copyText(body, 'copied')}
            className={BUTTON}
            data-testid="followup-copy"
          >
            <Copy aria-hidden="true" className="size-4" />
            העתיקי
          </Button>
        </DialogFooter>
      )}
    </>
  )
}

/**
 * הכפתור שבחלון-המסמך + החלון שהוא פותח.
 * @param quote          ההצעה שבחלון-המסמך
 * @param disabledReason מ-`followupAvailability` — ריק = פעיל; אחרת מוצג **כטקסט גלוי** ליד הכפתור
 */
export default function FollowupDraftDialog({ quote, disabledReason = '' }) {
  const [open, setOpen] = useState(false)
  const reasonId = 'quote-followup-reason'

  return (
    <div className="flex items-center gap-3 flex-wrap" data-testid="quote-followup-row">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(disabledReason)}
            aria-describedby={disabledReason ? reasonId : undefined}
            className={BUTTON}
            data-testid="quote-followup-open"
          >
            <Sparkles aria-hidden="true" className="size-4 text-teal-700" />
            {FOLLOWUP_LABEL}
          </Button>
        </DialogTrigger>
        <DialogContent dir="rtl" className="sm:max-w-2xl" data-testid="followup-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles aria-hidden="true" className="size-4 text-teal-700" />
              טיוטת מייל מעקב
            </DialogTitle>
            {/* "נוסחה בעזרת AI" אינו כאן: הכותרת קבועה, והמשפט מתאר טיוטה שקיימת — בזמן הניסוח ואחרי
                כשל עוד אין כזו (נמצא ע"י סוכן D2, 24/09). הוא מוצג בראש הטיוטה עצמה, ב-`FollowupDraftPanel`. */}
            <DialogDescription>
              הצעת מחיר <Ltr data-testid="followup-quote-id">{quote?.quote_id}</Ltr> —{' '}
              {quote?.event_name}
            </DialogDescription>
          </DialogHeader>
          <FollowupDraftPanel quoteId={quote?.quote_id} />
        </DialogContent>
      </Dialog>
      {disabledReason && (
        <p id={reasonId} className="text-sm text-slate-600" data-testid="quote-followup-reason">
          {disabledReason}
        </p>
      )}
    </div>
  )
}
