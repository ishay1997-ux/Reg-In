// שכבת-המסד של הגנרטור — חיבור כמנכ"ל דרך המפתח הציבורי (RLS חל כמו על משתמש), ועטיפות
// שצועקות במקום לשתוק. 🔴 `src/CLAUDE.md §RLS`: כתיבה שנחסמה מחזירה `{data:null, error:null}`
// ⇒ כל insert/update כאן דורש `.select()` ובודק מספר-שורות; אפס = כשל, לא הצלחה.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// טעינת .env.local לתוך process.env — אותה תבנית כמו playwright.config.js. 🔒 הסודות לעולם
// אינם מודפסים; רק שמות-משתנים חסרים נאמרים בקול.
export function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim()
  }
}

export async function connectAsCeo() {
  loadEnvLocal()
  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, E2E_CEO_EMAIL, E2E_CEO_PASSWORD } = process.env
  const missing = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'E2E_CEO_EMAIL',
    'E2E_CEO_PASSWORD',
  ].filter((k) => !process.env[k])
  if (missing.length) throw new Error(`חסרים ב-.env.local: ${missing.join(', ')}`)
  const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: true },
  })
  const { error } = await supabase.auth.signInWithPassword({
    email: E2E_CEO_EMAIL,
    password: E2E_CEO_PASSWORD,
  })
  if (error) throw new Error('ההתחברות כמנכ"ל נכשלה.')
  return supabase
}

export class SeedDb {
  constructor(supabase, { batch, onError } = {}) {
    this.supabase = supabase
    this.batch = batch
    this.calls = 0
    this.onError = onError ?? (() => {})
  }

  fail(context, error) {
    const err = new Error(`${context}: ${error?.message ?? error}`)
    err.code = error?.code
    this.onError(err)
    throw err
  }

  async rpc(name, args) {
    this.calls += 1
    const { data, error } = await this.supabase.rpc(name, args)
    if (error) this.fail(`rpc ${name}(${JSON.stringify(args).slice(0, 120)})`, error)
    return data
  }

  async insert(table, rows) {
    this.calls += 1
    const list = Array.isArray(rows) ? rows : [rows]
    const { data, error } = await this.supabase.from(table).insert(list).select()
    if (error) this.fail(`insert ${table}`, error)
    if ((data?.length ?? 0) !== list.length) {
      this.fail(
        `insert ${table}`,
        new Error(`נכתבו ${data?.length ?? 0} מתוך ${list.length} — חסימת RLS?`),
      )
    }
    return data
  }

  // match = { column: value } — שוויון בלבד; מחזיר את מספר-השורות שעודכנו ודורש ≥ 1.
  async update(table, patch, match, { expect = null } = {}) {
    this.calls += 1
    let query = this.supabase.from(table).update(patch)
    for (const [col, value] of Object.entries(match)) query = query.eq(col, value)
    const { data, error } = await query.select()
    if (error) this.fail(`update ${table}`, error)
    const n = data?.length ?? 0
    if (n === 0 || (expect !== null && n !== expect)) {
      this.fail(
        `update ${table} ${JSON.stringify(match)}`,
        new Error(`עודכנו ${n} שורות (צפוי ${expect ?? '≥1'}) — חסימת RLS?`),
      )
    }
    return data
  }

  async select(table, columns, filters = []) {
    this.calls += 1
    let query = this.supabase.from(table).select(columns)
    for (const [op, col, value] of filters) query = query[op](col, value)
    const { data, error } = await query
    if (error) this.fail(`select ${table}`, error)
    return data ?? []
  }

  // רישום במרשם-הזריעה — הפונקציה הגדורה למנכ"ל מהמיגרציה `seed_registry_and_helpers`.
  async register(entity, ids) {
    const list = ids.filter((id) => id !== null && id !== undefined)
    if (!list.length) return 0
    return this.rpc('seed_register', { p_batch: this.batch, p_entity: entity, p_ids: list })
  }
}

// עובדים מקבילים על רשימה — סדר לא נדרש (ההתנגשויות נפתרו במתכנן), אבל התקרה קטנה כדי
// שהמסד לא יראה עשרות טרנזקציות במקביל על אותן טבלאות.
export async function runPool(items, worker, { concurrency = 3, onProgress = () => {} } = {}) {
  let index = 0
  let done = 0
  const failures = []
  const next = async () => {
    for (;;) {
      const i = index
      index += 1
      if (i >= items.length) return
      try {
        await worker(items[i], i)
      } catch (error) {
        failures.push({ item: items[i], error })
        if (failures.length >= 3) return
      }
      done += 1
      onProgress(done, items.length)
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, next))
  return failures
}
