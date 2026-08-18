// הלוגיקה הטהורה של משטח 5 — הדף הציבורי לאישור/סירוב משמרת.
//
// 🚫 **אין כאן Supabase, אין DOM, ואין `Date.now()` מובלע** — השעון נכנס כפרמטר, כדי
// שספירת-הזמן-שנותר תהיה ניתנת לבדיקה בלי לזייף שעון גלובלי. אותה מוסכמה כמו שאר `src/lib/`.

import { formatDate, formatTimeRange, weekdayOf } from '@/lib/dates'

// ── שמונת המצבים, ולמה הם **שבעה** בקוד ─────────────────────────────────────
//
// ‏`screens-approved.md` משטח 5 §⑤ מונה שמונה מצבים. בקוד יש שבעה, וזה **לא** מצב שנשמט:
// 🔴 **"הקישור אינו בתוקף" ו"קישור לא תקין" הם מצב אחד** — §⑤ מורה במפורש שהנוסח זהה,
// **"בכוונה לא מבחינה בין הסיבות"**, ו-`get_shift_invite` מחזירה לשניהם `{ok:false}`
// **זהה בייט-בבייט** (ר' כותרת המיגרציה `20260810004500`).
// 🔑 **ולכן זו אינה בחירה אלא כפייה של הנתונים: ללקוח פיזית אין את המידע להפריד ביניהם.**
// ➕ והרווח: שני מצבים נפרדים שחייבים להישאר זהים הם בדיוק זוג שסטייה עתידית תפריד
// בשקט — מצב אחד הופך את ההפרדה לבלתי-אפשרית.
export const SHIFT_INVITE_STATE = {
  loading: 'loading',
  awaiting: 'awaiting',
  confirmed: 'confirmed',
  declined: 'declined',
  filled: 'filled',
  // §⑤ מצבים 6+7 יחד — "אינו בתוקף" ≡ "לא תקין".
  dead: 'dead',
  // 🔴 המצב שקיים כדי ש**לעולם לא ייכתב "נשמר" כשלא נשמר** (`spec.md § מה ייחשב עובד` #3).
  saveFailed: 'saveFailed',
}

// 🔴 **הנוסחים מצוטטים מילה-במילה מהמוקאפ המאושר** (`05_public_confirm_approved.html:132-153`),
// ו"המשרה כבר אוישה" הוא בעצמו ציטוט מ-`processes-approved.md §ב6`. 🚫 לא לנסח מחדש —
// זו לא סטייה קוסמטית אלא טקסט שאושר, ו"כבר אוישה" נבחר במפורש **במקום** מייל-ביטול,
// כי *"המשמרת שלך בוטלה"* הוא שקר: הדיילת מעולם לא שובצה.
export const SHIFT_INVITE_MESSAGE = {
  [SHIFT_INVITE_STATE.confirmed]: 'תודה! רשמנו שאת מגיעה. פרטים סופיים יישלחו בקרוב.',
  [SHIFT_INVITE_STATE.declined]: 'תודה שעדכנת. נשמח לפנות אלייך בפעם הבאה.',
  [SHIFT_INVITE_STATE.filled]:
    'תודה שהתפנית — המשרה כבר אוישה לאירוע הזה. נשמח לפנות אלייך בפעם הבאה.',
  [SHIFT_INVITE_STATE.dead]: 'הקישור הזה אינו בתוקף יותר. אם עדיין מתאים לך — התקשרי למנהלת הגיוס.',
  [SHIFT_INVITE_STATE.saveFailed]: 'לא הצלחנו לשמור את התשובה. נסי שוב, או התקשרי למנהלת.',
}

// תשובת `get_shift_invite` ⇒ מצב-מסך. **`ok:false` הוא תמיד `dead`** — ר' ההסבר למעלה.
export function stateFromInvitePayload(payload) {
  if (!payload || payload.ok !== true) return SHIFT_INVITE_STATE.dead

  switch (payload.state) {
    case 'awaiting':
      return SHIFT_INVITE_STATE.awaiting
    case 'confirmed':
      return SHIFT_INVITE_STATE.confirmed
    case 'declined':
      return SHIFT_INVITE_STATE.declined
    case 'filled':
      return SHIFT_INVITE_STATE.filled
    // ⚠️ ערך לא-מוכר (למשל אחרי הרחבת-סטטוסים עתידית שתשכח את המסך הזה) נופל ל-`dead`
    // ולא ל"ממתין למענה" — 🔑 **ברירת-המחדל הבטוחה היא לא-להציע-כפתור**, כי כפתור
    // שמוצג ונכשל גרוע מהודעה שמפנה לטלפון.
    default:
      return SHIFT_INVITE_STATE.dead
  }
}

// תשובת `respond_to_shift_invite` ⇒ מצב-מסך, או `null` כשצריך לשאול מחדש.
//
// 🔑 **`null` הוא הלב של הפתרון לסתירה שבין §③ ל-§⑦:** הפונקציה הכותבת מחזירה מחרוזת
// גנרית **אחת** לשלושת מצבי-הכישלון — במכוון, כדי לא להיות אורקל. אבל §⑦ דורש שאם
// המשרה התמלאה בזמן שהדף פתוח בטלפון שלה, הקליק יראה את מסך **"כבר אוישה"** ולא שגיאה
// סתמית. הפתרון: כישלון-כתיבה ⇒ `null` ⇒ הדף **קורא שוב** את `get_shift_invite`, שהיא
// האורקל היחיד ממילא. הפונקציה הכותבת נשארת בדיוק כפי שנבנתה ואושרה.
export function stateFromRespondPayload(payload) {
  if (!payload || payload.ok !== true) return null
  if (payload.status === 'confirmed_available') return SHIFT_INVITE_STATE.confirmed
  if (payload.status === 'declined') return SHIFT_INVITE_STATE.declined
  return null
}

// ── נסיעות ───────────────────────────────────────────────────────────────────
//
// `local-3` (ישי 08/08): הפרמטר `סכום_נסיעות_למשמרת` נזרע `0`, וכל עוד הוא `0` —
// **המסך והמייל מדפיסים "+ נסיעות" בלי מספר.** ‏`0 ₪` על המסך נראה כמו הבטחה שלא
// תכובד; היעדר-מספר קורא כמו "יסוכם", וזה מה שקורה בפועל היום.
export function travelAmountToShow(rawValue) {
  const amount = Number(rawValue)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return amount
}

// ── הזמן שנותר ───────────────────────────────────────────────────────────────
//
// המוקאפ מצייר *"הקישור בתוקף עוד 42 שעות"*. 🔴 **המקור הוא `expires_at` שהשרת חישב
// כמוקדם מבין שני התנאים** (48ש׳ מהשליחה · 24ש׳ לפני האירוע) — 🚫 לא 48 שעות מהשליחה
// לבדן. הצגת המספר הגדול מבין השניים הייתה מבטיחה לדיילת חלון שהכתיבה כבר תחסום.
//
// ⚠️ **`now` נכנס כפרמטר** — בלעדיו אי-אפשר לבדוק את הפונקציה בלי לזייף שעון גלובלי.
export function expiryNotice(expiresAt, now) {
  if (!expiresAt) return null
  const deadline = new Date(expiresAt).getTime()
  const current = new Date(now).getTime()
  if (Number.isNaN(deadline) || Number.isNaN(current)) return null

  const hoursLeft = Math.floor((deadline - current) / 3_600_000)
  if (hoursLeft < 0) return null
  if (hoursLeft < 1) return 'הקישור בתוקף פחות משעה'
  if (hoursLeft === 1) return 'הקישור בתוקף עוד שעה'
  if (hoursLeft === 2) return 'הקישור בתוקף עוד שעתיים'
  return `הקישור בתוקף עוד ${hoursLeft} שעות`
}

// ── שורת התאריך והשעות ───────────────────────────────────────────────────────
//
// ⚠️ **סטייה מהמוקאפ, מוצהרת:** הוא מצייר *"יום שלישי הקרוב · 18:00–22:00"* — ניסוח
// **יחסי**. 🔴 ניסוח יחסי נכון רק בחלון צר: האירוע היחיד שקיים היום הוא ב-22/08, כלומר
// כשבועיים קדימה, ו"הקרוב" עליו הוא **פשוט שקר**. וזה בדיוק הלקח שכרטיס-המסך עצמו רשם
// על המוקאפים הקודמים — תאריך שננעל והפך לא-נכון. ⇒ **יום-בשבוע + תאריך מלא**: שומר
// את מה שהמוקאפ באמת נתן (הדיילת רואה איזה יום זה) בלי להמציא קרבה שאינה קיימת.
// 🚫 ואין כאן עותק רביעי של `formatDate` — היא מיובאת (`src/lib/dates.js`).
// 🔴 ואותו דבר מ-18/08/2026 על מערך-הימים: `weekdayOf` (Step 2.4 של מודול 6) עברה לגור
// ב-`dates.js`, כי מבט-העל של פרויקטים זקוק לאותה טבלת-שמות בדיוק. הצורה כאן שונה
// ("יום שבת", עם קידומת) — ולכן הקידומת נשארת כאן, ורק מערך-השמות עצמו אוחד.

export function eventWhenLine(eventDate, startTime, endTime) {
  const date = formatDate(eventDate)
  if (!date) return ''

  const weekday = weekdayOf(eventDate)
  const hours = formatTimeRange(startTime, endTime)

  const parts = [`יום ${weekday}`, date]
  if (hours) parts.push(hours)
  return parts.join(' · ')
}
