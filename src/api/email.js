// שכבת-הגישה של מנוע-המייל — **חוצת-מודולים, ושייכת לטבלה שאין לה מודול-בעלים.**
//
// למה תיקייה שלישית ולא אחת משתי הקיימות (נוצרה 09/08/2026, פזה 0 של מודול 4):
//   · `src/lib/` הוא **טהור** — אף קובץ בו אינו מייבא את `supabaseClient`, וזה מה שמאפשר
//     לבדוק בו כללים בלי סביבה. תובלה ושאילתות היו שוברות את זה.
//   · `src/modules/NN_*/api.js` הוא **פר-מודול**. ‏`email_log` אינו של מודול 3: מ4/מ8/מ11
//     כותבים אליו וקוראים ממנו באותה מידה.
// ⛔ המסקנה המעשית: מודול שצריך "האם כבר נשלח" מייבא **מכאן**, ולא ממודול אחר ולא בהעתקה.
// ‏`src/CLAUDE.md` אוסר העתקה מפורשות, וזו הסיבה — תיקון (תקרה, ניסוח, מצב-שלישי) חייב
// לחול על כל השולחים בבת-אחת.
//
// 🔗 הזרימה: המסך ⇒ `sendEmail` ⇒ פונקציית-השרת `send-email` ⇒ webhook של Make ⇒ Gmail.
//    הכללים הטהורים (מילוי-תבנית, תקרת-גודל, שלושת מצבי-התוצאה) — `src/lib/email.js`.

import { supabase } from '@/supabaseClient'
import { EMAIL_SEND_TIMEOUT_MS } from '@/lib/email'
import { toError } from '@/lib/apiError'

// שליחה בפועל. **הוחלץ מ-`03_quotes/QuoteDocumentDialog.jsx` ב-09/08/2026** כדי שמודול 4
// לא יעתיק אותו — הוא נשא שלוש הכרעות שקל לאבד בהעתקה, וכולן משוחזרות כאן כלשונן:
//
// (1) ⏱️ **תקרת-זמן משלנו.** ל-`functions.invoke` אין timeout; בלעדיה כפתור "שולח..." יכול
//     להישאר תקוע לנצח כש-Make לא עונה, והמשתמש אינו יודע אם לשלוח שוב.
// (2) ⚠️ **שלושת שדות-המטא חייבים להישלח.** ל-`email_log.entity_id` יש NOT NULL — בלעדיהם
//     המייל יוצא בהצלחה והיומן נשאר ריק, כלומר ההגנה מפני שליחה-כפולה מפסיקה להתקיים
//     **בלי שאף אחד רואה שגיאה**. נתפס באימות מקצה-לקצה 30/07/2026.
// (3) הם נפרדים מ-`payload` בכוונה: `payload` הוא **חוזה חמשת-השדות מול Make**, ואלה
//     מיועדים ליומן שלנו בלבד — השרת מעביר ל-Make את החמישה ולא אותם.
//
// 🚫 **`entity_type` אינו שם-מודול ואינו הופך לכזה בלקוח** — השרת מסיק את ההרשאה מהמשאב
//    (מפה סגורה ב-`send-email/index.ts`). לקוח שהיה מצהיר על מודול היה מצהיר על זה שמותר לו.
//
// ⚠️ השגיאה **נזרקת כמות-שהיא** ולא נעטפת: `classifySendError` (`src/lib/email.js`) מבחין
//    בין פסק-זמן/תקלת-רשת ("לא ידוע") לכשל אמיתי לפי `message`/`name`, ועטיפה הייתה מוחקת
//    את ההבחנה ומחזירה "נכשל" על מייל שאולי כן יצא.
export async function sendEmail({ payload, entityType, entityId, templateName } = {}) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), EMAIL_SEND_TIMEOUT_MS),
  )

  const { data, error } = await Promise.race([
    supabase.functions.invoke('send-email', {
      body: {
        ...payload,
        entity_type: entityType,
        entity_id: entityId,
        template_name: templateName,
      },
    }),
    timeout,
  ])
  if (error) throw error

  // `log_failed` = המייל יצא אך כתיבת-היומן נכשלה. השרת מחזיר `ok:true` בכוונה (המייל כבר
  // אצל הנמען), ולכן זה **חייב** להגיע למסך — אחרת ההגנה מפני שליחה-כפולה מתה בשקט.
  return { logFailed: Boolean(data?.log_failed) }
}

// תבנית-מייל בודדת מ-`params`, לפי שמה המדויק (זהה-בייט לשורת ה-seed). גרה כאן ולא
// במודול כלשהו כי תבניות-מייל הן משאב חוצה-מודולים בדיוק כמו email_log — מ4 (זימונים),
// מ6 (ביטול/עדכון-פרטים), ובהמשך מ8/מ11 — ועותק פר-מודול היה מתפצל בשקט ביום שהטיפול
// בתבנית-חסרה משתנה. ⚠️ למודול 4 יש עותק פרטי קודם ב-api.js שלו (מודול סגור ומוזג —
// לא נגענו); איחודו לכאן הוא ניקיון עתידי, לא חובה של מודול 6.
// 🔴 תבנית חסרה **עוצרת** ואינה נשלחת כגוף ריק: מייל ריק לדיילת גרוע ממייל שלא נשלח.
export async function getEmailTemplate(name) {
  const { data, error } = await supabase
    .from('params')
    .select('param_value')
    .eq('param_name', name)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת תבנית המייל.')
  if (!data?.param_value) throw toError({ code: 'PGRST116' }, `תבנית המייל "${name}" חסרה בהגדרות.`)
  return data.param_value
}

// השליחה המוצלחת האחרונה של ישות נתונה, מ-`email_log` (מיגרציה 20260730095439).
// **זהו מקור-האמת היחיד ל"האם כבר נשלח"** — ההגנות שבחלון חיות ב-state של הקומפוננטה
// ולכן מתאפסות ברענון-דף או אצל משתמש שני; רק שאילתה כאן שורדת את שניהם.
// מסונן ל-'sent' בכוונה: ניסיון שנכשל אינו "נשלח", והצגתו כאילו נשלח הייתה מונעת מהמשתמש
// לשלוח מייל שהנמען מעולם לא קיבל. ‏null = אין שליחה מוצלחת (או שה-RLS חוסם קריאה).
export async function getLastSuccessfulSend(entityType, entityId) {
  const { data, error } = await supabase
    .from('email_log')
    .select('recipient, subject, created_at')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('status', 'sent')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת היסטוריית השליחות.')
  return data ?? null
}

// אילו ישויות מתוך רשימה כבר נשלחו — **שאילתה אחת** לכל העמוד.
// ⚠️ במכוון לא `getLastSuccessfulSend` פר-שורה: על לקוח עם 30 הצעות זה 30 שאילתות (N+1).
// מחזיר Set של entity_id, כי המסך שואל שאלה בוליאנית ("נשלחה?") ולא מציג תאריך —
// הכרעת-ישי 30/07 (LOCAL-16): תאריך-השליחה כמעט תמיד זהה לתאריך-ההצעה ולכן הוא רעש.
// ⚠️ מסונן ל-'sent': ניסיון שנכשל אינו שליחה, והצגתו ככזו תמנע מהמשתמש לשלוח מייל
// שהנמען מעולם לא קיבל.
// ⚠️ **‏`entityType` הוא פרמטר ולא `'quote'` קשיח** (הוכלל 09/08/2026): מסך-הזימונים של
// מודול 4 שואל בדיוק את אותה שאלה על `'shift'`, ועותק שני של השאילתה היה מתפצל בשקט.
export async function getSentEntityIds(entityType, entityIds) {
  if (!entityIds?.length) return new Set()
  const { data, error } = await supabase
    .from('email_log')
    .select('entity_id')
    .eq('entity_type', entityType)
    .eq('status', 'sent')
    .in('entity_id', entityIds)
  if (error) throw toError(error, 'שגיאה בטעינת היסטוריית השליחות.')
  return new Set((data ?? []).map((row) => row.entity_id))
}
