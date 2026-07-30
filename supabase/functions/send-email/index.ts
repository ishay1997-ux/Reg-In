// פונקציית-השרת היחידה ששולחת מיילים במערכת (הכרעת-ישי 30/07/2026).
//
// למה היא קיימת בכלל: REG-IN היא אפליקציית-דפדפן בלי שרת, וכתובת ה-webhook של Make היא
// **סוד** — כל ערך שנכתב בקוד-הלקוח נצרב לתוך הבנדל הציבורי, וכל גולש היה יכול לשלוח
// מיילים בשם החברה. הפונקציה הזו היא המקום היחיד שבו הכתובת קיימת (משתנה-סביבה
// MAKE_EMAIL_WEBHOOK_URL), והיא גם השער שמוודא מי מורשה לשלוח.
//
// 🔗 הזרימה: המסך ⇒ הפונקציה הזו ⇒ webhook של Make ⇒ Gmail עם ה-PDF מצורף.
//
// ⚠️ **גנרית ולא "שליחת הצעת-מחיר"**: ב-params יש 6 תבניות-מייל ומודולים 4/8/11 ישלחו גם הם.
//    ר' src/CLAUDE.md §"שליחת מייל" ו-PROJECT_MASTER §6 (🚧 מ4·מ8·מ11).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  // ── שער 2: מותר לך? ────────────────────────────────────────────────────────
  // כלל ברזל 9: ה-UI הוא נוחות, החומה היא בשרת. 'הצעות מחיר' + edit — שליחת מסמך
  // ללקוח היא פעולה עסקית, לא צפייה.
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

  const { data: perm } = await asUser
    .from('permissions')
    .select('permission_level, modules!inner(module_name)')
    .eq('role_id', me.role_id)
    .eq('modules.module_name', 'הצעות מחיר')
    .maybeSingle()
  if (perm?.permission_level !== 'edit') return json({ error: 'אין לך הרשאה לשלוח.' }, 403)

  // ── הגוף ───────────────────────────────────────────────────────────────────
  let payload: Record<string, string>
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'גוף הבקשה אינו תקין.' }, 400)
  }

  // חמשת השדות הם החוזה מול מבנה-הנתונים של תרחיש ה-Make. שדה חסר כאן יגיע ל-Make
  // כ-NULL וייצור מייל פגום בשקט — לכן נבדק כאן, לפני היציאה.
  const { to, subject, body, filename, pdf_base64 } = payload ?? {}
  if (!to || !body || !pdf_base64) return json({ error: 'חסרים נתונים לשליחה.' }, 400)

  // מטא-דאטה ליומן. אינם נשלחים ל-Make — הוא לא צריך לדעת על הצעות-מחיר.
  const entityType = payload.entity_type ?? 'quote'
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
      body: JSON.stringify({ to, subject, body, filename, pdf_base64 }),
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
  return json({ ok: true })
})
