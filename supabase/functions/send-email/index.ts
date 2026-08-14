// פונקציית-השרת היחידה ששולחת מיילים במערכת (הכרעת-ישי 30/07/2026).
//
// למה היא קיימת בכלל: REG-IN היא אפליקציית-דפדפן בלי שרת, וכתובת ה-webhook של Make היא
// **סוד** — כל ערך שנכתב בקוד-הלקוח נצרב לתוך הבנדל הציבורי, וכל גולש היה יכול לשלוח
// מיילים בשם החברה. הפונקציה הזו היא המקום היחיד שבו הכתובת קיימת (משתנה-סביבה
// MAKE_EMAIL_WEBHOOK_URL), והיא גם השער שמוודא מי מורשה לשלוח.
//
// 🔗 הזרימה: המסך ⇒ הפונקציה הזו ⇒ webhook של Make ⇒ Gmail עם ה-PDF מצורף.
//
// ⚠️ **גנרית ולא "שליחת הצעת-מחיר"**: ב-params יש 9 תבניות-מייל (נמדד חי 09/08/2026) ומודולים
//    4/8/11 ישלחו גם הם. ר' src/CLAUDE.md §"שליחת מייל" ו-PROJECT_MASTER §6 (🚧 מ4·מ8·מ11).

// ⚠️ הגרסה **נעולה במדויק** ולא `@2` (מייג'ור פתוח) — ‏.github/workflows/ci.yml ביקש זאת
// כ-🚧 מ10 "כשנוגעים בפונקציה בפעם הבאה", כי `@2` היה יכול לשבור את שער-הטיפוסים ב-CI
// **מעצמו, בלי שאיש נגע בקוד**, ברגע שגרסה חדשה תעלה ל-JSR. מודול 4 נגע — לכן ננעל.
import { createClient } from 'jsr:@supabase/supabase-js@2.112.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── מפת ישות ⇒ מודול-נדרש: **סגורה, ובשרת** ────────────────────────────────
// 🚫 הלקוח לעולם אינו שולח שם-מודול — השרת מסיק את ההרשאה מהמשאב. אחרת תוקף פשוט
// יצהיר על המודול שכן מותר לו (הכרעת-ישי 31/07/2026, PROJECT_MASTER §6, מול Curity/Auth0).
// 🚫 **אין כאן `invoice`/`salary_report`**: ה-CHECK של `email_log.entity_type` אינו מכיר אותם
// עדיין, וכשל בכתיבת-היומן **נבלע** (ר' למטה) — כלומר המייל היה יוצא והיומן נשאר ריק, בשקט.
// מ8/מ11 יוסיפו את הערך שלהם **יחד עם המיגרציה שמרחיבה את ה-CHECK**, לא לפניה.
// ✅ **מ6 עשה בדיוק את זה 14/08/2026:** המיגרציה `module6_email_log_accepts_project` הוחלה
//    ואומתה (ה-CHECK מונה ארבעה ערכים), **ורק אחריה נפרסה הגרסה הזו.** הכיוון אינו סימטרי:
//    פריסה לפני המיגרציה ⇒ המייל יוצא, כתיבת-היומן נדחית, **והכשל נבלע** (ר' למטה).
const ENTITY_MODULE: Record<string, string> = {
  quote: 'הצעות מחיר',
  shift: 'דיילות',
  // 🔴 **שני ערכים למ6, ושניהם מול 'פרויקטים'. 🚫 ולא מיחזור של `shift`** — נמדד חי:
  //    ‏`shift` נשפט מול 'דיילות', ולמנהלת הפרויקטים יש שם **`view` ולא `edit`** ⇒ כל
  //    מייל-ביטול שהיא הייתה שולחת נדחה **403 בשקט**, ואף דיילת לא הייתה שומעת שהאירוע בוטל.
  project: 'פרויקטים',
  project_report: 'פרויקטים',
}

// רצפת-המצורף **פר-ישות ולא גורפת**: הפיכת המצורף לרשות באופן כללי הייתה מוחקת שומר חי
// מנתיב הצעת-המחיר (מסמך ללקוח בלי הקובץ), ואף בדיקה קיימת לא הייתה נופלת על כך.
// זימון-משמרת הוא טקסט בלבד ואין לו קובץ.
const ENTITY_REQUIRES_ATTACHMENT: Record<string, boolean> = {
  quote: true,
  shift: false,
  // 🔑 **וזו הסיבה ששני ערכים ולא אחד:** שלושת מיילי-הטקסט של מ6 (ביטול · פרטים-השתנו ·
  //    סקר-משוב) אינם נושאים קובץ, **ודוח-הסיכום ללקוח חייב אותו.** ערך אחד היה מכריח
  //    לוותר על אחת משתי ההגנות.
  project: false,
  project_report: true,
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const webhookUrl = Deno.env.get('MAKE_EMAIL_WEBHOOK_URL')
  // ⚠️ סוד חסר הוא תקלת-תצורה ולא תקלת-משתמש. נכשלים ברעש ובמפורש: אילו החזרנו "נשלח"
  // כאן, המשתמש היה מקבל אישור על מייל שמעולם לא יצא — הכשל הכי מסוכן בזרימה הזו.
  if (!webhookUrl) return json({ error: 'שליחת מיילים אינה מוגדרת במערכת.' }, 500)

  // ── שער 1: מי אתה ──────────────────────────────────────────────────────────
  // ה-JWT מגיע מהלקוח; `getUser` מאמת אותו מול Supabase Auth. בלי זה הפונקציה היא
  // ממסר-מיילים פתוח לכל מי שמכיר את כתובתה.
  const authHeader = req.headers.get('Authorization') ?? ''
  const asUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: authError } = await asUser.auth.getUser()
  if (authError || !userData?.user) return json({ error: 'לא מחובר.' }, 401)
  const email = userData.user.email ?? ''

  // ── הגוף נקרא כאן, ו**שום שגיאה אינה מוחזרת ממנו עדיין** ──────────────────
  // ⚠️ **הסדר הזה הוא חוזה, לא סגנון.** שער-ההרשאה חייב לרוץ **לפני** אימות-השדות, אחרת
  // מנהלת-כספים שתשלח בקשה פגומה תקבל 400 ("חסרים נתונים") במקום 403 — כלומר השרת יגלה
  // לה שהיא הייתה עוברת את השער אילו רק מילאה את הגוף. `e2e/quote-email.spec.js` נועל את
  // ההבחנה בשתי בדיקות: גוף ריק כמנהלת-כספים ⇒ 403, אותו גוף בדיוק כמנכ"ל ⇒ 400.
  // ⇒ **קוראים כאן רק כדי לדעת איזו ישות זו**, וכל כשל-גוף נדחה לאחרי השער.
  let payload: Record<string, string> | null = null
  try {
    payload = await req.json()
  } catch {
    payload = null
  }

  // ברירת-המחדל `quote` נשמרת מהקוד הקודם בכוונה: קורא ותיק שאינו שולח `entity_type`
  // ממשיך להתנהג בדיוק כמו קודם, ובקשה בלי גוף כלל נשפטת מול המודול המחמיר יותר.
  const entityType = payload?.entity_type ?? 'quote'
  const requiredModule = ENTITY_MODULE[entityType]

  // ── שער 2: מותר לך? ────────────────────────────────────────────────────────
  // כלל ברזל 9: ה-UI הוא נוחות, החומה היא בשרת. שליחת מסמך/זימון היא פעולה עסקית,
  // לא צפייה — ולכן `edit` על המודול שאליו המשאב שייך.
  //
  // ⚠️ ישות לא-מוכרת נדחית **כאן, ב-403 ולא ב-400**: deny-by-default. ערך שאיננו מכירים
  // אין לו מודול, ואין לנו על מה לאשר.
  //
  // ⚠️ **שני שלבים, ולא אחד** — וזה בדיוק הבאג שנתפס באימות הראשון (30/07): ה-policy
  // ‏`permissions_select_all` הוא `using (true)`, כלומר כל משתמש מחובר רואה את **כל 45
  // השורות** (5 תפקידים × 9 מודולים). שאילתה שמסננת לפי מודול בלבד מחזירה 5 שורות,
  // ‏`maybeSingle()` נכשל, והתוצאה הייתה 403 לכל אחד — כולל למנכ"ל. חייבים לסנן
  // **לפי role_id של המשתמש**, בדיוק כמו `AuthContext` בקליינט.
  //
  // ⚠️ וגם `status='active'`: משתמש שעבר "מחיקה רכה" מקבל בקליינט מפת-הרשאות ריקה,
  // ולכן השרת חייב לדחות אותו באותה מידה — אחרת השרת מתיר את מה שה-UI אוסר.
  const { data: me } = await asUser
    .from('users')
    .select('role_id, status')
    .eq('email', email)
    .maybeSingle()
  if (!me || me.status !== 'active') return json({ error: 'אין לך הרשאה לשלוח.' }, 403)

  if (!requiredModule) return json({ error: 'אין לך הרשאה לשלוח.' }, 403)

  const { data: perm } = await asUser
    .from('permissions')
    .select('permission_level, modules!inner(module_name)')
    .eq('role_id', me.role_id)
    .eq('modules.module_name', requiredModule)
    .maybeSingle()
  if (perm?.permission_level !== 'edit') return json({ error: 'אין לך הרשאה לשלוח.' }, 403)

  // ── ורק עכשיו, אחרי השער: תקינות הגוף ──────────────────────────────────────
  if (!payload) return json({ error: 'גוף הבקשה אינו תקין.' }, 400)

  // חמשת השדות הם החוזה מול מבנה-הנתונים של תרחיש ה-Make. שדה חסר כאן יגיע ל-Make
  // כ-NULL וייצור מייל פגום בשקט — לכן נבדק כאן, לפני היציאה.
  const { to, subject, body, filename, pdf_base64 } = payload
  if (!to || !body) return json({ error: 'חסרים נתונים לשליחה.' }, 400)
  if (ENTITY_REQUIRES_ATTACHMENT[entityType] && !pdf_base64) {
    return json({ error: 'חסרים נתונים לשליחה.' }, 400)
  }

  // מטא-דאטה ליומן. אינם נשלחים ל-Make — הוא לא צריך לדעת על הצעות-מחיר.
  const entityId = Number(payload.entity_id) || null
  const templateName = payload.template_name ?? null

  // ── השליחה עצמה ────────────────────────────────────────────────────────────
  // ⚠️ התרחיש ב-Make מחזיר 200 **רק אחרי** שמודול-הדואר הצליח, ו-502 בכשל (מודול
  // Webhook-response). בלי זה Make עונה "התקבל" מיד והתשובה חסרת-משמעות.
  let ok = false
  let errorMessage: string | null = null
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ⚠️ **חמשת המפתחות נשלחים תמיד, גם כשאין מצורף** — `JSON.stringify` משמיט מפתח
      // שערכו `undefined`, ותרחיש ה-Make מפריד בין "אין מצורף" לבין "השדה נעלם" (הראשון
      // הוא הענף שנוסף ב-09/08/2026, השני נראה שם כמו תקלת-מיפוי). מחרוזת ריקה = אין מצורף.
      body: JSON.stringify({
        to,
        subject,
        body,
        filename: filename ?? '',
        pdf_base64: pdf_base64 ?? '',
      }),
    })
    ok = res.ok
    if (!ok) errorMessage = `Make responded ${res.status}`
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'network error'
  }

  // ── היומן ──────────────────────────────────────────────────────────────────
  // נכתב ב-service-role בכוונה: ל-`email_log` אין policy-כתיבה ללקוח, כי יומן שהדפדפן
  // יכול לכתוב אליו אינו ראיה. נרשמות **גם** שליחות שנכשלו — "ניסינו ולא הצליח" הוא
  // מידע אמיתי למי שבודק למה הלקוח לא קיבל.
  // ⚠️ כשל בכתיבת-היומן לא מפיל את התשובה: המייל כבר יצא, ולומר "נכשל" בגללו היה גורם
  //    לשליחה כפולה ללקוח. נרשם ללוג הפונקציה כדי שלא ייעלם.
  // ⚠️ **אבל לוג-פונקציה אינו התראה** (תוקן 31/07/2026): היומן הוא מקור-האמת היחיד
  //    ל"כבר נשלח", ולכן כשל בכתיבתו **מכבה בשקט** את ההגנה מפני שליחה-כפולה — בדיוק
  //    הכשל שהטבלה נועדה למנוע. התשובה מדווחת `log_failed` והמסך אומר זאת למשתמש.
  //    השדה **אדיטיבי**: לקוח שאינו מכיר אותו מתנהג בדיוק כמו קודם.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { error: logError } = await admin.from('email_log').insert({
    entity_type: entityType,
    entity_id: entityId,
    recipient: to,
    template_name: templateName,
    subject: subject ?? null,
    status: ok ? 'sent' : 'failed',
    error_message: errorMessage,
    sent_by_email: email,
  })
  if (logError) console.error('email_log insert failed:', logError.message)

  if (!ok) return json({ error: 'השליחה נכשלה.', detail: errorMessage }, 502)
  return json(logError ? { ok: true, log_failed: true } : { ok: true })
})
