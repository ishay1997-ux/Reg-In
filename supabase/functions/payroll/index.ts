// פונקציית-השרת של דוח השכר (חוזה השכר §3): הפקת הקובץ הסופי, שמירתו, חתימת הדוח במסד,
// ושליחה דרך Make — לרו"ח (עם הקובץ) ולדיילות (קישור אישי לבדיקת שעות).
//
// כאן רק מחברים: זהות ⇒ שני לקוחות-Supabase ⇒ תלויות אמיתיות ⇒ `pipeline.ts`. כל ההיגיון והבדיקות
// שם. סדר השערים כמו ב-`send-email`: סוד ⇒ זהות ⇒ גוף. ההרשאה עצמה נבדקת במסד, בקריאה הראשונה
// של כל פעולה (בזהות המשתמשת).
// 🔒 כל מייל עובר את `guard.ts` — כל כתובת שאינה של ישי נמסרת לכתובת שלו (הכרעת-ישי 13.10.2026).

import { createClient } from 'jsr:@supabase/supabase-js@2.112.0'
import {
  failureBody,
  handleRequest,
  resolveAllowedOrigins,
  type Failure,
  type PayrollDeps,
} from './pipeline.ts'
import { sendToMake } from './transport.ts'
import { writeSalaryReportXlsx } from './xlsx.ts'

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

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

// בתים ⇒ base64 בנתחים: `String.fromCharCode(...bytes)` על קובץ שלם חורג ממגבלת הארגומנטים.
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

const BUCKET = 'finance'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ ok: false, code: 'INVALID_REQUEST' }, 405)

  // ── שער 1: הסוד. בלעדיו שום מייל לא יוצא, ולכן גם לא חותמים דוח שאי-אפשר לשלוח.
  const webhookUrl = Deno.env.get('MAKE_EMAIL_WEBHOOK_URL')
  if (!webhookUrl) {
    return json(
      { ok: false, code: 'MAIL_NOT_CONFIGURED', message: 'שליחת מיילים אינה מוגדרת במערכת.' },
      500,
    )
  }

  // ── שער 2: מי את. ה-JWT מאומת מול Supabase Auth; הכתובת שממנו היא היחידה שעוברת כ-actor.
  const url = Deno.env.get('SUPABASE_URL')!
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: userData, error: authError } = await asUser.auth.getUser()
  const actorEmail = userData?.user?.email ?? ''
  if (authError || !actorEmail) {
    return json({ ok: false, code: 'PERMISSION_DENIED', message: 'לא מחובר.' }, 401)
  }

  // ── שער 3: הגוף.
  let body: unknown = null
  try {
    body = await req.json()
  } catch {
    // גוף שאינו JSON ⇒ `parseRequest(null)` מחזיר INVALID_REQUEST — אין צורך במידע נוסף.
    body = null
  }

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const deps: PayrollDeps = {
    actorEmail,
    userRpc: async (name, args) => {
      const { data, error } = await asUser.rpc(name, args)
      return { data, error }
    },
    adminRpc: async (name, args) => {
      const { data, error } = await admin.rpc(name, args)
      return { data, error }
    },
    uploadArtifact: async (key, bytes, contentType) => {
      const { error } = await admin.storage
        .from(BUCKET)
        .upload(key, bytes, { upsert: false, contentType })
      return { error: error ? error.message : null }
    },
    downloadArtifact: async (key) => {
      const { data, error } = await admin.storage.from(BUCKET).download(key)
      if (error || !data) return { bytes: null, error: error?.message ?? 'empty' }
      return { bytes: new Uint8Array(await data.arrayBuffer()), error: null }
    },
    readTemplate: async (name) => {
      const { data, error } = await admin
        .from('params')
        .select('param_value')
        .eq('param_name', name)
        .maybeSingle()
      if (error) return { text: null, error: error.message }
      return { text: data?.param_value ?? null, error: null }
    },
    buildXlsx: writeSalaryReportXlsx,
    sha256Hex,
    toBase64,
    transport: (payload) => sendToMake(webhookUrl, payload),
    now: () => Date.now(),
  }

  try {
    const result = await handleRequest(deps, body, {
      allowedOrigins: resolveAllowedOrigins(Deno.env.get('PAYROLL_ALLOWED_ORIGINS')),
    })
    if (result.ok === false) {
      const { status, body: failure } = failureBody(result as Failure)
      return json(failure, status)
    }
    return json(result)
  } catch (err) {
    // תקלה שלא נצפתה מראש. המצב השמור במסד הוא האמת — "בדוק סטטוס" / "המשך" מתחילים ממנו.
    console.error('payroll unexpected error:', err instanceof Error ? err.message : String(err))
    return json(
      { ok: false, code: 'UNEXPECTED_ERROR', message: 'אירעה תקלה בלתי צפויה.', retryable: true },
      500,
    )
  }
})
