// שכבת-הרשת של כלי ההקפאה — SQL דרך ה-Management API, ו-Storage דרך מפתח service-role.
// למה Management API ולא חיבור Postgres: במכונה אין pg_dump/psql/CLI, וב-.env.local אין
// סיסמת-מסד — יש רק SUPABASE_ACCESS_TOKEN. כל קריאה כאן היא טרנזקציה נפרדת משלה.
// 🔒 הטוקן ומפתח ה-service-role נשמרים בזיכרון בלבד: לא מודפסים, לא נכתבים לדיסק, ואינם
//    נכללים בהודעות-שגיאה (גוף-התשובה של השרת נחתך ל-400 תווים ואינו מכיל אותם).

import { loadEnvLocal } from '../seed-lib/db.mjs'

// המסד היחיד של הפרויקט (CLAUDE.md §2.2) — משרת גם את האתר החי.
export const PROJECT_REF = 'yfeovxppnfoafmfbdfvh'
const API = 'https://api.supabase.com/v1/projects'

function accessToken() {
  loadEnvLocal()
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error('חסר SUPABASE_ACCESS_TOKEN ב-.env.local')
  return token
}

// ניסיון חוזר רק על תקלות-רשת ו-429/5xx — שאילתה שנכשלה בגלל SQL שגוי לא תצליח בפעם השנייה.
// ✏️ 15/10/2026: הגיבוי האמיתי הראשון נפל על 429 ("ThrottlerException") אחרי ~80 טבלאות — ה-Management API
// מגביל קצב לדקה, ו-9 שניות המתנה בסך הכול (1.5/3/4.5) לא הספיקו לחלון להתאפס. עכשיו: Retry-After אם השרת
// שלח אותו, אחרת המתנה מכפילה 5→10→20→40→60 שניות; עד 7 ניסיונות (~2.5 דקות לפני שמוותרים).
async function withRetry(fn, attempts = 7) {
  let lastError
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (!error.retryable || i === attempts - 1) throw error
      const waitMs = error.retryAfterMs ?? Math.min(60_000, 5_000 * 2 ** i)
      await new Promise((r) => setTimeout(r, waitMs))
    }
  }
  throw lastError
}

export async function sql(query) {
  const token = accessToken()
  return withRetry(async () => {
    let res
    try {
      res = await fetch(`${API}/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
    } catch (cause) {
      const err = new Error(`תקלת-רשת מול ה-Management API: ${cause.message}`)
      err.retryable = true
      throw err
    }
    if (!res.ok) {
      const text = (await res.text()).slice(0, 400)
      const err = new Error(`SQL נכשל (${res.status}): ${text}`)
      err.retryable = res.status === 429 || res.status >= 500
      const retryAfterSec = Number(res.headers.get('retry-after'))
      if (retryAfterSec > 0) err.retryAfterMs = Math.min(120_000, retryAfterSec * 1000)
      throw err
    }
    return res.json()
  })
}

// מפתח service-role נשלף בזמן-ריצה ונשאר בזיכרון — עוקף RLS של Storage כדי להוריד/להעלות
// קבצים מדליים פרטיים (reports · finance).
export async function serviceRoleKey() {
  const token = accessToken()
  const res = await fetch(`${API}/${PROJECT_REF}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`שליפת מפתחות-API נכשלה (${res.status})`)
  const keys = await res.json()
  const key = keys.find((k) => k.name === 'service_role')?.api_key
  if (!key) throw new Error('לא נמצא מפתח service_role בתשובת ה-API')
  return key
}

function storageUrl(bucket, name) {
  loadEnvLocal()
  const base = process.env.VITE_SUPABASE_URL
  if (!base) throw new Error('חסר VITE_SUPABASE_URL ב-.env.local')
  const path = name.split('/').map(encodeURIComponent).join('/')
  return `${base}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`
}

export async function downloadObject(key, bucket, name) {
  const res = await fetch(storageUrl(bucket, name), {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  })
  if (!res.ok) throw new Error(`הורדת ${bucket}/${name} נכשלה (${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}

export async function uploadObject(key, bucket, name, body, contentType) {
  const res = await fetch(storageUrl(bucket, name), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': contentType || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body,
  })
  if (!res.ok) throw new Error(`העלאת ${bucket}/${name} נכשלה (${res.status})`)
}
