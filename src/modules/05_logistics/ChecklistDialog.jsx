// דיאלוג צ'קליסט-הפרויקט — מודול 5 · משטח 2 (צעד 3.2).
//
// זהו **משטח-הקלט היחיד של מנהלת הלוגיסטיקה בכל המערכת**: `item_status` · `actual_qty` ·
// `notes` · `expected_arrival_date` הן ארבע עמודות שאף מסך אחר אינו כותב אליהן (כרטיס §②).
//
// ── שלוש הכרעות שמעצבות את הקובץ, וכל אחת שוברת משהו בשקט אם היא נופלת ──────────────
//
// 🔴 **‏㊲ + `🧱④` — הדיאלוג אינו סומך על שורת-התור ששיגרה אותו.** תור-העבודה הוא תצלום-רגע,
//    והוא נטען לפני שהביטול נחת. ונמדד ששומר-הסטטוס של מ6 יושב **בתוך**
//    `recompute_project_status` ועושה `return` מוקדם על פרויקט מבוטל ⇒ **כתיבה לפרויקט מבוטל
//    "מצליחה" בשקט ורק חישוב-הסטטוס מדולג.** בלי קריאה-מחדש בפתיחה, היא מסמנת `מוכן` על
//    פרויקט שבוטל לפני דקה, רואה הצלחה, והולכת הביתה בטוחה שסימנה. ⇒ הנעילה נגזרת מ-
//    `getChecklist` שנקרא **בפתיחה**, ולעולם לא מהשורה שנלחצה.
//
// 🔴 **שמירה מיידית פר-שורה, בלי כפתור שמירה (`🧱⑤` · AR-4).** לטריגר-החישוב-מחדש על
//    `logistics` אין `WHEN` ואין `OF` ⇒ **כל** כתיבה — גם שמירת הערה בלבד — מריצה חישוב מלא
//    ותופסת `FOR UPDATE` על שורת-הפרויקט. שמירה קבוצתית של ארבע שורות מסתדרת בתור ותיראה תקועה.
//
// 🔴 **אין UI אופטימי — השורה מתעדכנת מה-`row` שחזר מה-RPC** (כלל-הבית של מ4/מ6). כתיבה
//    שנחסמה ב-RLS חוזרת כ-0 שורות עם `error: null`; `assertLogisticsUpdate` הופכת אותה
//    לזריקה, וכאן הערך **חוזר לקודמו** ומוצג משפט-הכשל. ערך שנשאר על המסך בלי שנכתב הוא
//    בדיוק ה"נשמר" הכוזב שהמודול נבנה נגדו.
//
// ── ומה שהמסך הזה **אינו** מכיל, בכוונה (כרטיס §①): מסננים · חיפוש · מיון-בלחיצה · ייצוא ·
//    הוספת פריט · **פקד-הסרה בשום צורה** (㊳ — ההסרה עברה לדיאלוג שינוי-התכולה של מ6) ·
//    כפתור שמירה · מחירים · ₪ בכל צורה שהיא.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Ltr from '@/components/Ltr'
import StatusTag from '@/components/StatusTag'
import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty, { DENIED_MARK } from '@/components/PermissionAwareEmpty'
import SegmentedControl from './SegmentedControl'
import { useAuth } from '@/contexts/AuthContext'
import { getChecklist, listProducts, updateLogisticsItem } from './api'
import {
  ACTIVE_PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  eventDaysFromToday,
  logisticsMetric,
  logisticsTileSub,
  proximitySentence,
  resolveProjectTone,
} from '@/lib/projects'
import {
  BROKEN_EMPTY_DETAIL,
  LEGAL_EMPTY_DETAIL,
  LEGAL_EMPTY_TITLE,
  LOAD_FAILURE_DETAIL,
  LOGISTICS_STATUS_LABELS,
  NEGATIVE_QTY_SENTENCE,
  NO_PERMISSION_SENTENCE,
  SORT_LINE,
  WRITE_FAILURE_SENTENCE,
  readinessMetricBlocked,
  resolveLogisticsTone,
  sortLogisticsRows,
} from '@/lib/projectLogistics'
import { formatDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

// ── 🔤 המחרוזות של המשטח — מועתקות מ-§3.7 של מדריך-המיקרו, לעולם לא מנוסחות מחדש ────────
// אלה שכבר חיות ב-`src/lib/projectLogistics.js` מיובאות משם (למעלה); כאן רק מה שאין לו בית
// משותף — מחרוזות של המסך הזה בלבד, שאף קורא אחר אינו צורך.

const NOTE_PLACEHOLDER = 'הערה חופשית — מה שכדאי שמנהלת הפרויקטים תדע'
// ㉚ — הנימוק של השדה המושבת ב-`טרם החל`. ㉕ מתירה עריכה ב-`הוזמן`/`מוכן` **ולא בשלישי**,
// והפקד נשאר גלוי ומנומק ולא נעלם. 🔑 ולמה זה אינו קוסמטי: שדה פתוח כאן היה נותן לה להעלות
// `actual_qty` מעל 0 בשורה שלא נגעו בה — ובכך **לנעול לעצמה** את פקד-ההסרה של אותה שורה (㊱).
const QTY_LOCKED_BY_ITEM = 'הפריט טרם הוזמן — הכמות בפועל נפתחת לעריכה אחרי סימון "הוזמן"'
const CANCELLED_CONTROL_TITLE = 'הפרויקט בוטל — לא ניתן לעדכן'
const CANCELLED_QTY_TITLE = 'הפרויקט בוטל — אך אפשר לרשום סחורה שהגיעה (㊴)'
// 🔒 העתק-בייט של ה-`raise` במיגרציה `20260826002447_module5_checklist_rpc.sql` (‏§3.7 · G4,
// הכרעת-ישי 25/08). כאן הוא **נימוק-הנעילה שלפני-השליחה** — אותו כלל AR-9 שמחזיק את
// `NEGATIVE_QTY_SENTENCE`: שני נוסחים לאותה שגיאה הם מה שהכלל מונע.
const CLOSED_EVENT_SENTENCE = 'האירוע כבר הסתיים — לא ניתן לעדכן את הלוגיסטיקה שלו.'
// שתי שורות-ההסבר שמתחת לטבלה — §3.7, מצוטטות **במלואן** (מצביע הסתיר פעם את שורת-㊵).
const EXPLAINER_SAVE = 'כל שינוי נשמר מיד — אין כפתור שמירה במסך.'
const AUTOFILL_TAG = 'מולא אוטומטית'
// 📌 **הכרעה-על-עוגן — O-5 (אושרה ע"י ישי 26/08/2026, "מאשר את הכל"), const אחד.**
// המוקאפ צייר *"נרשם חוסר של 80 יחידות **בשרוך הסאטן**"* — צורה מוטה שאין קוד שיכול לגזור
// משם-הקטלוג (`שרוך סאטן - ממותג`). עקרון-O-5 (*"'יחידות' מחליף את 'שרוכים'"*) מוחל כאן על
// שם-הפריט: הוא מובא **במרכאות כפי שהוא בקטלוג**. וכשהחוסר פרוס על כמה פריטים — מונה במקום שם.
// 🔴 **תיקון 26/08/2026 (צעד 4.4, נמצא באימות ה-E2E): חוסר של יחידה אחת הודפס "‏1 יחידות".**
// הענף היה על `items` (כמה פריטים חסרים) בעוד שהמילה שאחריו מתארת את `units` (כמה יחידות) —
// ומכיוון שהמוקאפ צייר `80`, צורת-היחיד מעולם לא צוירה ולא הוכרעה.
// **העוגן שלפיו הוכרע:** הכרעת-ישי `O-5` (26/08/2026) נתנה בדיוק לאח-התאום של המשפט הזה
// צורת-יחיד — `יחידה אחת עדיין בדרך` (`projectLogistics.js`, `plainReason`) — ולכן אותה
// צורה בדיוק מוחלת כאן. ⚠️ **מדווח כהכרעה-על-עוגן, הפיכה: ישי רשאי לעקוף בנוסח אחר.**
const SHORTFALL = {
  lead: 'נרשם חוסר של ',
  oneUnit: 'יחידה אחת',
  inOne: ' ב',
  inSingle: ' יחידות ב',
  inMany: ' יחידות ב-',
  itemsWord: ' פריטים',
  dash: ' — ',
  emphasis: 'הוא מתועד ואינו עוצר את הפרויקט',
  period: '.',
}

const rowKey = (row) => `${row.sku}-${row.serial_number}`

// שלושת הערכים של הפקד המקוטע — נגזרים מ-`LOGISTICS_STATUS_LABELS` (המילון המוזג), לעולם
// לא מוקלדים כאן שוב: `resolveLogisticsTone` זורקת על תווית שאינה במפה, וליטרל רביעי היה
// נופל שם ולא במסך. הסדר הוא הסדר המצויר.
const STATUS_OPTIONS = ['not_started', 'ordered', 'ready'].map((value) => ({
  value,
  label: LOGISTICS_STATUS_LABELS[value],
}))

// ㊵ — החוסר של באנר-ההשלמה. הקיזוז פר-שורה **לא-שלילי**: שורה שהגיעה בעודף אינה "מינוס
// חוסר" (‏`actual_qty > planned_qty` חוקי במפורש — כרטיס §⑦).
function buildCompletion(rows, productName) {
  const shortages = rows
    .map((row) => ({
      row,
      gap: Math.max(Number(row.planned_qty || 0) - Number(row.actual_qty || 0), 0),
    }))
    .filter((entry) => entry.gap > 0)
  if (shortages.length === 0) return { units: 0, items: 0, name: null }
  return {
    units: shortages.reduce((sum, entry) => sum + entry.gap, 0),
    items: shortages.length,
    name: productName(shortages[0].row.sku),
  }
}

// 🔤 הודעת-הכשל: **הודעת-שרת מוצגת כפי-שהיא ולעולם אינה משוחזרת** (דפוס-הבית `rpcErrorMessage`
// של מ6) — ה-RPC זורק עברית גמורה בלשון-נקבה (㉜), וניסוח שני בצד-הלקוח היה יוצר שתי אמיתות
// לאותה שגיאה. **המבחין הוא `code`:** שגיאת-שרת נושאת קוד (‏`P0001` מה-`raise`, או
// `RLS_DENIED` הסינתטי שמשמעותו "תשובה בלי שורה"); לתקלת-רשת/timeout אין קוד, וההודעה שלה
// היא ניסוח-ה-fallback הטכני של שכבת-ה-api ⇒ שם מוצג **S-2 הנעול**, המשפט שאושר לכשל-כתיבה.
function failureMessage(error) {
  const message = typeof error?.message === 'string' ? error.message.trim() : ''
  return error?.code && message ? message : WRITE_FAILURE_SENTENCE
}

export default function ChecklistDialog({ projectId, open, onOpenChange }) {
  // 🔴 **המסך מבטיח "כל שינוי נשמר מיד" — והשמירה תלויה ב-`onBlur`.** נמדד 26/08/2026:
  // הקלדת הערה ואז סגירת הדיאלוג **בלי לצאת מהשדה** אינה שומרת כלום — `updateLogisticsItem`
  // נקרא **אפס פעמים**, כי React אינו יורה `blur` על אלמנט ממוקד שמפורק מה-DOM.
  // ⚠️ והפער היה **תלוי-אמצעי-קלט**, וזה מה שהופך אותו למסוכן: סגירה בעכבר מזיזה את המיקוד
  // לכפתור ⇒ `blur` יורה ⇒ נשמר. סגירה ב-Esc מפרקת ישירות ⇒ אובד. אותה כוונה, שתי תוצאות.
  // ⇒ מוציאים את המיקוד **לפני** שהסגירה עוברת הלאה: זה מפעיל את שמירת-ה-blur הקיימת
  // והמוולדת, בלי פקד חדש, בלי חלון-אישור, ובלי לגעת במסלול-השמירה עצמו.
  const closeAfterFlush = (next) => {
    if (!next) document.activeElement?.blur?.()
    onOpenChange?.(next)
  }

  return (
    <Dialog open={open} onOpenChange={closeAfterFlush}>
      {/* ‏`sm:max-w-3xl` = 768px — הדריסה **חובה**: ברירת-המחדל `sm:max-w-lg` היא 512px וטבלה
          בת שש עמודות נשברת בה. זה הרוחב הרחב-ביותר שכבר חי בפרויקט (‏`ScopeChangeDialog`,
          הדיאלוג הקרוב-ביותר לזה — ועל אותן שורות-לוגיסטיקה בדיוק). ‏`dir="rtl"` מפורש:
          אין `DirectionProvider`, וכל משטח שנפתח ב-portal מקבל את התכונה ידנית. */}
      <DialogContent dir="rtl" className="sm:max-w-3xl">
        {open && projectId ? (
          <ChecklistBody projectId={projectId} onOpenChange={closeAfterFlush} />
        ) : (
          <DialogTitle className="sr-only">צ׳קליסט הפרויקט</DialogTitle>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ChecklistBody({ projectId, onOpenChange }) {
  const { permissions } = useAuth()
  // ㉞/§⑤ — התפקיד נקרא מ-`AuthContext` בדיוק כמו ב-`ProjectCardPage`, ולעולם לא כ-prop
  // שמישהו עלול לשכוח להעביר. **השער הוא `'לוגיסטיקה'`, לעולם לא `'פרויקטים'`** — מנהלת
  // הלוגיסטיקה היא `view` שם, ושער-פרויקטים היה נועל אותה מחוץ למודול שלה.
  const canEdit = permissions?.['לוגיסטיקה'] === 'edit'

  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const [data, setData] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState({})
  const [completion, setCompletion] = useState(null)

  // מראה-הכתיבה של `data`: כתיבה מגיעה מתוך `await`, ולכן היא לעולם אינה נשענת על ה-state
  // שנתפס בסגירה של הרנדר שהתחיל אותה (שתי שמירות רצופות היו דורסות זו את זו).
  const dataRef = useRef(null)
  const aliveRef = useRef(true)
  // 🔴 שימור-המיקוד אחרי קפיצת-המיון: סימון `מוכן` מזיז את השורה לתחתית הרשימה (המיון הוא
  // ערוץ-מידע), והכרטיס קורא לזה **הפתעה ידועה**. `key` יציב לבדו אינו מספיק — הזזת צומת
  // ב-DOM מאבדת מיקוד — ולכן המיקוד מוחזר במפורש לפקד שנלחץ. קורא-המסך זקוק לזה בין כה.
  const focusRef = useRef(null)

  const commit = useCallback((next) => {
    dataRef.current = next
    setData(next)
  }, [])

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        // 🔴 ㊲ — הקריאה הזאת **היא** מסלול-הכניסה לווריאנט-המבוטל. `listProducts` מצטרפת
        // כי `logistics` נושאת מק"ט עירום; השם והיחידה חיים ב-`products` (‏`using(true)`).
        // 🚫 אין כאן `getQuote`/`getPricingCatalog` — שכבת-ה-api כבר קוראת אותם, ורק כשצריך.
        const [checklist, products] = await Promise.all([getChecklist(projectId), listProducts()])
        if (cancelled) return
        if (!checklist.project) {
          // אין פרויקט לקרוא (חסום/נמחק) — אין על מה לצייר כותרת, וזו תקלת-טעינה ולא "ריק".
          setLoadFailed(true)
          return
        }
        commit({
          project: checklist.project,
          rows: checklist.rows,
          products,
          // 🚨 שלושת מצבי-הריק (§⑨ · S-26): "ריק" ו"חסום" זהים-בייט מהמסד, ולכן המבחין הוא
          // `quoteProductLines` שבמעטפת. `null` (ההצעה אינה קריאה) **וגם** `undefined` (מצב
          // שהמעטפת אינה אמורה להחזיר על רשימה ריקה) ⇒ ענף חוסר-ההרשאה: כשההבחנה עצמה
          // חסרה, הענף הבטוח הוא "אולי חסומה" ולא "הכול תקין" (fail-toward-blocked).
          emptyKind:
            checklist.rows.length > 0
              ? null
              : checklist.quoteProductLines == null
                ? 'noPermission'
                : checklist.quoteProductLines === 0
                  ? 'legal'
                  : 'broken',
          // "היום" נגזר כאן ולא ברנדר: `react-hooks/purity` אוסרת שעון בגוף-הרנדר, והתקדים
          // הוא `loadedAt` של `ScopeChangeDialog`.
          todayIso: new Date().toISOString().slice(0, 10),
        })
        setLoadFailed(false)
      } catch (error) {
        if (cancelled) return
        // ההודעה העברית הנעולה למסך; הפרט הטכני לקונסול (התקדים של `LogisticsTab`).
        console.error('checklist dialog load failed:', error)
        setLoadFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, reloadTick, commit])

  // מוחזר אחרי הרנדר שבו השורות כבר מוינו מחדש — ולכן `focusRef` נדלק רק ברגע ה-`commit`.
  useEffect(() => {
    const testId = focusRef.current
    if (!testId) return
    focusRef.current = null
    document.querySelector(`[data-testid="${testId}"]`)?.focus()
  })

  const setDraft = (key, field, value) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  const clearDraft = (key) =>
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })

  async function save(row, changes, { focusTestId } = {}) {
    const key = rowKey(row)
    setErrors((prev) => ({ ...prev, [key]: null }))
    setSaving((prev) => ({ ...prev, [key]: true }))
    try {
      const result = await updateLogisticsItem({
        projectId,
        sku: row.sku,
        // 🔴 `serial_number` הוא החלק השלישי במפתח הראשי — השמטתו אינה שגיאה אלא **עדכון
        // שורה אחרת**. שתי שורות של אותו מק"ט באותו אירוע הן מצב חוקי (③).
        serialNumber: row.serial_number,
        changes,
      })
      if (!aliveRef.current) return
      const prev = dataRef.current
      const rows = prev.rows.map((current) => (rowKey(current) === key ? result.row : current))
      const wasReady = prev.project?.project_status === 'ready'
      const productName = (sku) =>
        prev.products.find((product) => product.sku === sku)?.item_name ?? sku
      if (focusTestId) focusRef.current = focusTestId
      commit({ ...prev, rows, project: { ...prev.project, project_status: result.project_status } })
      // ⑬ — **הודעה, לא שער.** טריגר-המסד מקדם ברגע-הכתיבה ואינו יכול להמתין ללחיצה אנושית
      // ⇒ אין מה לאשר ואין דרך לעצור; הבאנר מסביר מה כבר קרה. הוא נדלק רק ב*מעבר* אל `ready`
      // (‏`project_status` שחזר מה-RPC), ונכבה ביציאה משם — סימון שבוטל אינו משאיר בשורה הודעה.
      if (result.project_status === 'ready') {
        setCompletion(wasReady ? null : buildCompletion(rows, productName))
      } else {
        setCompletion(null)
      }
    } catch (error) {
      if (!aliveRef.current) return
      setErrors((prev) => ({ ...prev, [key]: failureMessage(error) }))
    } finally {
      if (aliveRef.current) {
        clearDraft(key)
        setSaving((prev) => ({ ...prev, [key]: false }))
      }
    }
  }

  if (loading) {
    return (
      <>
        <DialogTitle className="sr-only">צ׳קליסט הפרויקט</DialogTitle>
        <DialogDescription className="sr-only">טוען את פריטי הפרויקט</DialogDescription>
        <LoadingOrError loading skeleton={{ variant: 'table', rows: 4, cols: 5 }} />
      </>
    )
  }

  if (loadFailed || !data) {
    return (
      <>
        <DialogTitle className="sr-only">צ׳קליסט הפרויקט</DialogTitle>
        <DialogDescription className="sr-only">שגיאה בטעינת פריטי הפרויקט</DialogDescription>
        {/* ‏`ERROR_TITLE` ("לא ניתן לטעון את הנתונים.") ותווית-הניסיון-החוזר **`נסי שוב`**
            חיים בתוך `PermissionAwareEmpty` ואינם ניתנים לדריסה — כלומר לשון-הנקבה (㉜/S-28)
            מובטחת כאן מבנית, ולא בהעברת-פרמטר שמישהו יכול לשכוח. שורת-הפירוט היא
            `LOAD_FAILURE_DETAIL`, ש**מדברת על "הפרויקט"** ולכן מתאימה למשטח הזה. */}
        <PermissionAwareEmpty
          state="error"
          detail={LOAD_FAILURE_DETAIL}
          onRetry={() => setReloadTick((tick) => tick + 1)}
          testId="checklist-state-error"
        />
        <ChecklistFooter onOpenChange={onOpenChange} />
      </>
    )
  }

  const { project, rows, products, emptyKind, todayIso } = data
  const productOf = (sku) => products.find((product) => product.sku === sku) ?? null
  const statusLabel = PROJECT_STATUS_LABELS[project.project_status] ?? null
  const isCancelled = project.project_status === 'cancelled'
  // 🔴 הנעילה נגזרת מהסטטוס ש**נקרא עכשיו** (㊲), לא מהשורה שנלחצה. הרשימה מיובאת מ-מ6
  // ולעולם אינה מוגדרת כאן מחדש (`🚧 מ5 ← מ6` #3): הגדרה שנייה תסטה בשקט.
  const locked = !ACTIVE_PROJECT_STATUSES.includes(project.project_status)
  const lockTitle = isCancelled ? CANCELLED_CONTROL_TITLE : CLOSED_EVENT_SENTENCE
  const metric = logisticsMetric(rows)
  const metricBlocked = readinessMetricBlocked(emptyKind)
  const subLine = logisticsTileSub({ count: 1, itemsNotReady: metric.total - metric.ready })
  const proximity = proximitySentence(eventDaysFromToday(project.final_event_date, todayIso))
  const sorted = sortLogisticsRows(rows)
  // ㉚ פר-מקור-חסימה: **היעדר הרשאה ⇒ הפקד מוסר מהמסך**, ולכן גם עמודת "עדכון מצב" עצמה
  // יורדת למשתמשת `view` — עמודה שכל תאיה ריקים היא בדיוק ה"אין תפקיד ⇒ נמחק" של מעבר-המלאי.
  const columnCount = canEdit ? 6 : 5

  return (
    <>
      <DialogHeader>
        {/* ㉘ — מצב ה**פרויקט** חי בכותרת הדיאלוג; מצב ה**פריט** חי כתג בתוך שורת-הטבלה.
            לעולם לא על אותה שורה ויזואלית: שתי המחרוזות חולקות את התווית "טרם החל". */}
        <DialogTitle className="text-lg font-bold text-slate-800">{project.event_name}</DialogTitle>
        <DialogDescription className="text-[12.5px] text-slate-500">
          {project.customer_name ?? '—'} · <Ltr>{formatDate(project.final_event_date, '—')}</Ltr>
          {proximity ? ` · ${proximity}` : ''}
        </DialogDescription>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span>
            <span className="text-[11.5px] text-slate-500">מצב הפרויקט:</span>{' '}
            <StatusTag
              label={statusLabel}
              tone={statusLabel ? resolveProjectTone(statusLabel) : undefined}
              testId="checklist-project-status"
            />
          </span>
          <span>
            <span className="text-[11.5px] text-slate-500">מוכנות לוגיסטית:</span>{' '}
            <span
              className="text-[13px] font-semibold text-slate-800"
              data-testid="checklist-metric"
            >
              {/* מונה שאסור לקרוא מציג `—` ולעולם לא `0` — "אפס שורות ⇒ הושלם" על טבלה
                  לא-קריאה הוא השקר המסוכן של המודול (S-26). */}
              {metricBlocked ? (
                <Ltr>{DENIED_MARK}</Ltr>
              ) : (
                <>
                  <Ltr>{String(metric.ready)}</Ltr> מתוך <Ltr>{String(metric.total)}</Ltr>
                </>
              )}
            </span>
          </span>
        </div>
        {/* §⑧-9ב — שורת-המשנה מושמטת בתצוגה המבוטלת: על פרויקט נעול היא נקראת כקריאה-לפעולה.
            המדד עצמו נשאר, כי הוא עובדה. */}
        {!isCancelled && !metricBlocked && subLine && (
          <span className="text-[11.5px] font-semibold text-amber-700">{subLine}</span>
        )}
      </DialogHeader>

      {isCancelled && <CancelBanner project={project} />}
      {locked && !isCancelled && (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-800"
          data-testid="checklist-banner-closed"
        >
          {CLOSED_EVENT_SENTENCE}
        </div>
      )}
      {completion && <CompletionBanner completion={completion} />}

      {emptyKind === 'noPermission' ? (
        <PermissionAwareEmpty
          state="noPermission"
          title={NO_PERMISSION_SENTENCE}
          testId="checklist-state-no-permission"
        />
      ) : emptyKind === 'broken' ? (
        <PermissionAwareEmpty
          state="error"
          detail={BROKEN_EMPTY_DETAIL}
          onRetry={() => setReloadTick((tick) => tick + 1)}
          testId="checklist-state-broken"
        />
      ) : emptyKind === 'legal' ? (
        // 🚫 בלי כפתור "הוסף פריט": הרשימה נגזרת מההצעה המאושרת, ותוספת היא שינוי-תכולה
        // של מנהלת הפרויקטים (`🔄א` · ㊳).
        <PermissionAwareEmpty
          state="empty"
          title={LEGAL_EMPTY_TITLE}
          detail={LEGAL_EMPTY_DETAIL}
          testId="checklist-state-legal-empty"
        />
      ) : (
        <div>
          <p className="mb-2 text-[11.5px] text-slate-400">{SORT_LINE}</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-xs font-semibold text-slate-500">
                <th className="w-[30%] px-2.5 py-1.5">פריט</th>
                <th className="w-[10%] px-2.5 py-1.5">כמות מתוכננת</th>
                <th className="w-[13%] px-2.5 py-1.5">כמות בפועל</th>
                <th className="w-[13%] px-2.5 py-1.5">הגעה משוערת</th>
                <th className="w-[10%] px-2.5 py-1.5">מצב הפריט</th>
                {/* שם-פעולה חסר-מין בכוונה (`design-contract §⑥`: "כשאפשר לנסח בלי מין — עדיף"). */}
                {canEdit && <th className="w-[24%] px-2.5 py-1.5">עדכון מצב</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <ItemRows
                  // `key` יציב לפי המפתח הראשי — הוא מה שמאפשר ל-React להזיז את השורה
                  // בקפיצת-המיון במקום לבנות אותה מחדש (וחצי מהחזרת-המיקוד).
                  key={rowKey(row)}
                  row={row}
                  product={productOf(row.sku)}
                  canEdit={canEdit}
                  locked={locked}
                  isCancelled={isCancelled}
                  lockTitle={lockTitle}
                  columnCount={columnCount}
                  draft={drafts[rowKey(row)]}
                  error={errors[rowKey(row)]}
                  busy={Boolean(saving[rowKey(row)])}
                  onDraft={setDraft}
                  onClearDraft={clearDraft}
                  onError={(key, message) => setErrors((prev) => ({ ...prev, [key]: message }))}
                  onSave={save}
                />
              ))}
            </tbody>
          </table>

          {/* שתי שורות-ההסבר — §3.7, מילה-במילה. אינן קישוט: כל אחת עונה על שאלה שהמסך
              מזמין ואינו עונה עליה לבד — "איפה כפתור השמירה?" ו"מה קורה למספר כשאני מסמנת
              מוכן?" (`🧱⑤` · ㉕). */}
          <div className="mt-2.5 text-[11px] leading-loose text-slate-400">
            {EXPLAINER_SAVE}
            <br />
            סימון <b>מוכן</b> ממלא את הכמות בפועל אוטומטית, <b>רק אם עדיין לא הוקלד בה ערך</b>.
            <b> וערך שמולא כך נושא לידו את הכיתוב &quot;{AUTOFILL_TAG}&quot;</b> — שנעלם ברגע שהיא
            מקלידה.{' '}
            <span className="block text-slate-400">
              מספר שנרשם כאילו נמדד, ולא נמדד, יזלוג לחישוב הרווחיות של מודול 8 בלי שאיש ידע.
            </span>
            מספר שהקלדת לעולם אינו נדרס.
          </div>
        </div>
      )}

      {isCancelled && (
        <div
          className="text-[11px] leading-loose text-slate-400"
          data-testid="checklist-locked-note"
        >
          כל הפקדים במסך הזה מושבתים ונשארים גלויים, כדי שיהיה ברור{' '}
          <b>מה היה אפשר לעשות ולמה אי-אפשר</b>.
        </div>
      )}

      <ChecklistFooter onOpenChange={onOpenChange} />
    </>
  )
}

// ‏`סגירה` בלבד. 🚫 אינו שומר ואינו מבטל — הכול כבר נשמר; ואין בדיאלוג הזה כפתור ראשי
// טורקיז כלל, כי הפעולה הראשית כאן היא **פר-שורה** (כרטיס §⑧-9ג).
function ChecklistFooter({ onOpenChange }) {
  return (
    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
        onClick={() => onOpenChange?.(false)}
        data-testid="checklist-close"
      >
        סגירה
      </Button>
    </DialogFooter>
  )
}

// ㉝ כפי שצומצמה ב-㊴. ענבר ולא אדום: זו הודעה על מצב **תקין-וסופי**, לא כשל-מערכת
// (תקציב-הצבע: אפס אדום בשני מסכי המודול).
function CancelBanner({ project }) {
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-800"
      data-testid="checklist-banner-cancelled"
    >
      <b className="mb-0.5 block text-[13.5px]">
        האירוע בוטל ב-<Ltr>{formatDate(project.cancelled_at, '—')}</Ltr> — הפרויקט נעול לעריכה.
      </b>
      {project.cancel_reason ? `הסיבה שנרשמה: "${project.cancel_reason}". ` : ''}
      {/* ✅ O-4 (ישי, 26/08/2026) — הנוסח המצויר אמר "מצב, **כמות** או הערה", וזה סתר את ㊴
          שמתירה את הכמות במפורש. השורה השנייה היא התוספת שאושרה באותו סבב: ה-`title` על
          השדה בלבד אינו נראה עד ריחוף ואינו נגיש במקלדת. */}
      אין לעדכן מצב או הערה בפרויקט מבוטל. אפשר עדיין לרשום כמות שהגיעה — שאר הפקדים נעולים. הנעילה
      חלה על כל המשתמשות.
      <br />
      הפריט שכבר הוזמן <b>נשאר ברשימה כראיית-חיוב</b> ואינו משתנה — אין לו מצב &quot;בוטל&quot;.
    </div>
  )
}

function CompletionBanner({ completion }) {
  return (
    <div
      role="status"
      className="rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-green-700"
      data-testid="checklist-banner-complete"
    >
      <b className="mb-0.5 block text-[13.5px]">
        הפרויקט עבר ל&quot;מוכן לביצוע&quot; ויצא מרשימת העבודה שלך.
      </b>
      כל הפריטים סומנו מוכנים והאיוש מלא.{' '}
      {completion.items > 0 && (
        <span data-testid="checklist-shortfall">
          {SHORTFALL.lead}
          {/* 🔴 היחיד נגזר מ-`units`, לא מ-`items` — המילה שאחרי המספר מתארת **יחידות**.
              חוסר של יחידה אחת נמצא תמיד בפריט אחד, ולכן הענף הזה מכסה גם את שם-הפריט. */}
          {completion.units === 1 ? (
            <>
              {SHORTFALL.oneUnit}
              {SHORTFALL.inOne}&quot;{completion.name}&quot;
            </>
          ) : completion.items === 1 ? (
            <>
              <Ltr>{String(completion.units)}</Ltr>
              {SHORTFALL.inSingle}&quot;{completion.name}&quot;
            </>
          ) : (
            <>
              <Ltr>{String(completion.units)}</Ltr>
              {SHORTFALL.inMany}
              <Ltr>{String(completion.items)}</Ltr>
              {SHORTFALL.itemsWord}
            </>
          )}
          {SHORTFALL.dash}
          <b>{SHORTFALL.emphasis}</b>
          {SHORTFALL.period}
        </span>
      )}
    </div>
  )
}

// ── שורת-הפריט + שורת-ההערה שמתחתיה ──────────────────────────────────────────────────
// שורת-ההערה היא שורה נפרדת ברוחב מלא ולא עמודה שביעית: כעמודה היא הייתה ~130px, צרה מכדי
// לכתוב בה (כרטיס §⑧-8א).
function ItemRows({
  row,
  product,
  canEdit,
  locked,
  isCancelled,
  lockTitle,
  columnCount,
  draft,
  error,
  busy,
  onDraft,
  onClearDraft,
  onError,
  onSave,
}) {
  const key = rowKey(row)
  const name = product?.item_name ?? row.sku
  const unit = product?.unit ?? 'יחידה'
  const statusLabel = LOGISTICS_STATUS_LABELS[row.item_status] ?? null
  const savedQty = row.actual_qty == null ? '0' : String(row.actual_qty)
  const qtyValue = draft?.qty ?? savedQty
  const qtyDirty = draft?.qty !== undefined
  const noteValue = draft?.note ?? row.notes ?? ''
  const dateValue = draft?.date ?? row.expected_arrival_date ?? ''

  // ㉕ — עריך ב-`הוזמן` וב-`מוכן`, **ולא בשלישי**. ㊴ — ובפרויקט מבוטל זה השדה היחיד שנשאר
  // פתוח: הסחורה שכבר הוזמנה תגיע בכל מקרה, והשורה היא ראיית-חיוב (§7.31) — ראיה שאי-אפשר
  // להשלים אינה ראיה שלמה.
  const qtyStateAllows = row.item_status === 'ordered' || row.item_status === 'ready'
  const qtyEditable = canEdit && qtyStateAllows && (!locked || isCancelled)
  const qtyTitle = !qtyStateAllows
    ? QTY_LOCKED_BY_ITEM
    : isCancelled
      ? CANCELLED_QTY_TITLE
      : locked
        ? lockTitle
        : undefined

  const handleQtyBlur = () => {
    if (!qtyDirty) return
    const text = String(draft.qty).trim()
    const value = Number(text)
    // כרטיס §⑦: לא-מספר ⇒ **הפקד אינו שולח והערך חוזר לקודם, בשקט** (אין למה להתריע —
    // היא לא הזינה מספר). שלילי, לעומת זאת, הוא ניסיון אמיתי שנחסם ומוסבר.
    if (text === '' || !Number.isFinite(value) || !Number.isInteger(value)) {
      onClearDraft(key)
      return
    }
    if (value < 0) {
      onClearDraft(key)
      // 🔒 העתק-בייט של ה-`raise` בשרת (AR-9) — שומר טרום-שליחה, לא נוסח שני.
      onError(key, NEGATIVE_QTY_SENTENCE)
      return
    }
    // 🔑 גדול מ-`planned_qty` — **מותר ואינו שגיאה** (כרטיס §⑦): הגיע יותר ממה שהוזמן, וזו
    // עובדה שכדאי שתתועד. אין כאן תקרה, לא כאן ולא ב-RPC.
    if (value === Number(row.actual_qty ?? 0) && !row.actual_qty_autofilled) {
      // אותו ערך על שדה שלא מולא אוטומטית — אין מה לכתוב (`🧱⑤`: כל כתיבה מריצה חישוב מלא).
      onClearDraft(key)
      return
    }
    // ㊵/G8 — כל כתיבה ידנית מכבה את `actual_qty_autofilled` בשרת, **גם כשהמספר זהה**:
    // מרגע שהיא הקלידה אותו זו מדידה, ולכן ערך אוטומטי שאושרר בהקלדה חייב לאבד את התג.
    onSave(row, { actual_qty: value })
  }

  const handleNoteBlur = () => {
    if (draft?.note === undefined) return
    if (draft.note === (row.notes ?? '')) {
      onClearDraft(key)
      return
    }
    // מחרוזת ריקה היא ערך לגיטימי (הערה שנמחקה) ונשלחת כמות שהיא — הבדיקה בשכבת-ה-api היא
    // על `undefined` בלבד, לעולם לא על falsy.
    onSave(row, { notes: draft.note })
  }

  const handleDateChange = (value) => {
    onDraft(key, 'date', value)
    // G9 — מחרוזת ריקה ⇒ `null`, וזו **מחיקת** התאריך (מפתח נוכח עם ערך null נכתב).
    onSave(row, { expected_arrival_date: value === '' ? null : value })
  }

  const handleStatus = (nextStatus) => {
    // כרטיס §① — לחיצה על המצב **הנוכחי** אינה עושה דבר. אין כתיבה מיותרת, ובעיקר: כתיבה
    // כזאת הייתה מאפסת/ממלאת שדות דרך סמנטיקת-המעברים של ה-RPC בלי שהיא ביקשה כלום.
    if (nextStatus === row.item_status) return
    onSave(
      row,
      { item_status: nextStatus },
      { focusTestId: `checklist-status-${key}-${nextStatus}` },
    )
  }

  return (
    <>
      <tr data-testid={`checklist-row-${key}`}>
        <td className="px-2.5 py-2.5 align-top">
          <div className="font-semibold text-slate-800">{name}</div>
          <div className="mt-0.5 text-[11.5px] text-slate-500">
            <Ltr>{row.sku}</Ltr>
          </div>
        </td>
        <td className="px-2.5 py-2.5 align-top">
          <div className="text-[13.5px] font-bold text-slate-800">
            <Ltr>{String(row.planned_qty)}</Ltr>
          </div>
        </td>
        <td className="px-2.5 py-2.5 align-top">
          {/* ㊵ — התג יושב ליד הערך ונעלם **ברגע שהיא מקלידה**, לא רק אחרי שהכתיבה נחתה:
              `actual_qty` הוא מועמד לבסיס-חישוב הרווחיות במ8, ומספר שנרשם כאילו נמדד ולא
              נמדד יזלוג לדוח כספי בלי שאיש ידע. */}
          {row.actual_qty_autofilled && !qtyDirty && (
            <span
              className="mb-1 inline-block whitespace-nowrap rounded-full bg-slate-100 px-2 py-px text-[10.5px] text-slate-500"
              data-testid={`checklist-autofill-${key}`}
            >
              {AUTOFILL_TAG}
            </span>
          )}
          {canEdit ? (
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              // ㉟ — מוצג **ערך השדה**, לעולם לא `0` קשיח: `טרם החל` עם `actual_qty > 0` הוא
              // מצב חוקי (הכמות הוגדלה והסחורה שהגיעה לא נעלמה), והוא בדיוק מה שהשורה
              // צריכה לומר — "8 הגיעו, צריך 12, הזמיני עוד 4".
              value={qtyValue}
              disabled={!qtyEditable || busy}
              title={qtyTitle}
              aria-label={
                qtyEditable
                  ? `כמות בפועל — ${name}`
                  : `כמות בפועל — ${name} — לא זמינה: ${qtyTitle ?? ''}`
              }
              data-testid={`checklist-qty-${key}`}
              // שדה-מספר שנטען עם ערך מקבל `select()` בכניסה — בלעדיו כל הקלדה מחייבת
              // מחיקה ידנית קודם (`src/CLAUDE.md`).
              onFocus={(event) => event.target.select()}
              onChange={(event) => onDraft(key, 'qty', event.target.value)}
              onBlur={handleQtyBlur}
              className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 text-center text-[13px] text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            />
          ) : (
            // §⑤ — היעדר הרשאה ⇒ הפקד **מוסר מהמסך**, והערך מוצג כטקסט.
            <span
              className="text-[13.5px] font-bold text-slate-800"
              data-testid={`checklist-qty-text-${key}`}
            >
              <Ltr>{savedQty}</Ltr>
            </span>
          )}
          <span className="mt-0.5 block text-[11px] text-slate-500">{unit}</span>
        </td>
        <td className="px-2.5 py-2.5 align-top" data-testid={`checklist-arrival-${key}`}>
          <ArrivalCell
            row={row}
            name={name}
            canEdit={canEdit}
            locked={locked}
            lockTitle={lockTitle}
            busy={busy}
            dateValue={dateValue}
            testKey={key}
            onDateChange={handleDateChange}
          />
        </td>
        <td className="px-2.5 py-2.5 align-top">
          {statusLabel && (
            <StatusTag
              label={statusLabel}
              tone={resolveLogisticsTone(statusLabel)}
              testId={`checklist-item-status-${key}`}
            />
          )}
        </td>
        {canEdit && (
          <td className="px-2.5 py-2.5 align-top">
            <SegmentedControl
              options={STATUS_OPTIONS}
              value={row.item_status}
              onSelect={handleStatus}
              disabled={locked || busy}
              // ㉚ — נימוק של נעילת-הפרויקט בלבד: ב-busy פרויקט פעיל היה מנומק "האירוע כבר הסתיים".
              disabledTitle={locked ? lockTitle : undefined}
              ariaLabel={`עדכון מצב — ${name}`}
              testIdPrefix={`checklist-status-${key}`}
            />
          </td>
        )}
      </tr>
      <tr>
        <td className="border-b border-slate-100 px-2.5 pb-2.5" colSpan={columnCount}>
          <div className="flex items-center">
            <span className="ml-2 whitespace-nowrap text-[11px] text-slate-500">הערה</span>
            {canEdit ? (
              <input
                type="text"
                value={noteValue}
                disabled={locked || busy}
                title={locked ? lockTitle : undefined}
                placeholder={NOTE_PLACEHOLDER}
                aria-label={locked ? `הערה — ${name} — לא זמינה: ${lockTitle}` : `הערה — ${name}`}
                data-testid={`checklist-note-${key}`}
                onChange={(event) => onDraft(key, 'note', event.target.value)}
                onBlur={handleNoteBlur}
                className="h-[30px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              />
            ) : (
              <span
                className="text-[12.5px] text-slate-600"
                data-testid={`checklist-note-text-${key}`}
              >
                {row.notes?.trim() ? row.notes : '—'}
              </span>
            )}
          </div>
          {error && (
            <div
              className="mt-1 text-[11px] font-semibold text-red-600"
              role="alert"
              data-testid={`checklist-error-${key}`}
            >
              {error}
            </div>
          )}
        </td>
      </tr>
    </>
  )
}

// ➕ חוזה עמודת "הגעה משוערת" (נוסף לכרטיס 25/08/2026 — העמודה צוירה במוקאפ ולא היה לה אף
// סעיף התנהגות, והיא הייתה הפער שהכי סביר שייבנה שגוי). שלושה מצבים, ואף אחד מהם אינו ברירת-מחדל:
// · `טרם החל` ⇒ `—` בלבד, **אין שדה** (טרם הוזמן ⇒ אין הבטחת-הגעה)
// · `הוזמן`   ⇒ שדה-תאריך עריך — `expected_arrival_date`, שהיא כותבת דרך ה-RPC
// · `מוכן`    ⇒ `actual_arrival_date` **כטקסט** + הכיתוב "הגיע בפועל" — 🚫 לעולם לא ידני:
//               ה-RPC חותם אותו במעבר ל-`ready` ומוחק אותו ביציאה משם (M5-8 · ㊶).
// 🔒 ובפרויקט נעול השדה **נעול** (S-6/㊴ — ㊴ מתירה את `actual_qty` בלבד; המוקאפ צייר אותו
//    פתוח, וזה גליץ' מדווח שאין לשחזר). ➕ וגליף התא הריק אחיד: `—`.
function ArrivalCell({
  row,
  name,
  canEdit,
  locked,
  lockTitle,
  busy,
  dateValue,
  testKey,
  onDateChange,
}) {
  if (row.item_status === 'not_started') {
    return <span className="text-[11px] text-slate-400">—</span>
  }

  if (row.item_status === 'ready') {
    const arrived = formatDate(row.actual_arrival_date, '—')
    return (
      <>
        <span className="text-[13px] text-slate-800">
          <Ltr>{arrived}</Ltr>
        </span>
        {row.actual_arrival_date && (
          <span className="mt-0.5 block text-[11px] text-slate-500">הגיע בפועל</span>
        )}
      </>
    )
  }

  if (!canEdit) {
    return (
      <span className="text-[13px] text-slate-800" data-testid={`checklist-date-text-${testKey}`}>
        <Ltr>{formatDate(row.expected_arrival_date, '—')}</Ltr>
      </span>
    )
  }

  return (
    <input
      type="date"
      dir="ltr"
      value={dateValue}
      disabled={locked || busy}
      title={locked ? lockTitle : undefined}
      aria-label={
        locked ? `תאריך הגעה משוער — ${name} — נעול: ${lockTitle}` : `תאריך הגעה משוער — ${name}`
      }
      data-testid={`checklist-date-${testKey}`}
      onChange={(event) => onDateChange(event.target.value)}
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-800',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
      )}
    />
  )
}
