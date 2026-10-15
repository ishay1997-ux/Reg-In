// קוד משותף לשלושת הסקריפטים — קטלוג המסד, סטטיסטיקות md5, קריאת צילום מהדיסק, ואישור-מוקלד.
// מופרד מ-lib.mjs כי כאן יש רשת ודיסק; שם — לוגיקה טהורה בלבד.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { sql } from './api.mjs'
import { canonicalStatsSql, checkConfirmation, lit, sha256 } from './lib.mjs'

export function defaultSnapshotRoot() {
  const oneDrive = process.env.OneDrive || 'C:\\Users\\ishay\\OneDrive'
  return join(oneDrive, 'REGIN', 'freeze-snapshots')
}

// טבלאות-בסיס בסכמה, עם מטא-דאטה של עמודות (מחושבת? זהות?). מחיצות-בת אינן נספרות פעמיים.
export async function listTables(schema) {
  const rows = await sql(`
    select c.relname as table,
           json_agg(json_build_object('name', a.attname,
                                      'generated', a.attgenerated <> '',
                                      'identity', a.attidentity <> '')
                    order by a.attnum) as columns
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    where n.nspname = ${lit(schema)} and c.relkind in ('r', 'p') and not c.relispartition
    group by c.relname
    order by c.relname`)
  return rows.map((r) => ({
    table: r.table,
    columns: typeof r.columns === 'string' ? JSON.parse(r.columns) : r.columns,
  }))
}

export async function listFks(schema) {
  return sql(`
    select cr.relname as child, pr.relname as parent
    from pg_constraint k
    join pg_class cr on cr.oid = k.conrelid
    join pg_class pr on pr.oid = k.confrelid
    where k.contype = 'f' and k.connamespace = ${lit(schema)}::regnamespace`)
}

// count+md5 לכמה טבלאות בקריאה אחת. keys: { 'public.x': '"public"."x"' }.
export async function tableStats(keys) {
  const entries = Object.entries(keys)
  const out = {}
  // 15 טבלאות לקריאה — md5 על ‎15MB‎ בבת אחת מתקרב לתקרת-הזמן של ה-API.
  for (let i = 0; i < entries.length; i += 15) {
    const part = entries.slice(i, i + 15)
    const query = part
      .map(([key, q]) => `select ${lit(key)} as k, s.n, s.h from (${canonicalStatsSql(q)}) s`)
      .join('\nunion all\n')
    for (const r of await sql(query)) out[r.k] = { rows: Number(r.n), md5: r.h }
  }
  return out
}

export function readManifest(dir) {
  const file = join(dir, 'manifest.json')
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf-8'))
}

// כל קובץ שהמניפסט מונה — קיים, ובאותו sha256. מחזיר את רשימת הבעיות (ריקה = תקין).
export function verifyFiles(dir, manifest) {
  const problems = []
  const files = [
    ...Object.values(manifest.tables ?? {}).map((t) => ({ file: t.file, sha256: t.sha256 })),
    ...(manifest.storage ?? []).map((o) => ({ file: o.file, sha256: o.sha256 })),
  ]
  for (const f of files) {
    const p = join(dir, f.file)
    if (!existsSync(p)) problems.push(`${f.file} (חסר)`)
    else if (sha256(readFileSync(p)) !== f.sha256) problems.push(`${f.file} (תוכן שונה)`)
  }
  return problems
}

export function listSnapshotCandidates(root) {
  if (!existsSync(root)) return []
  return readdirSync(root)
    .map((name) => join(root, name))
    .filter((dir) => statSync(dir).isDirectory())
    .map((dir) => {
      const manifest = readManifest(dir)
      return { dir, manifest, missingFiles: manifest ? verifyFiles(dir, manifest) : null }
    })
}

export function readJsonLines(dir, file) {
  const text = readFileSync(join(dir, file), 'utf-8')
  return text.split('\n').filter((l) => l.length > 0)
}

export function resolveDir(p) {
  return resolve(String(p))
}

// קורא שורה אחת מ-stdin (מקלדת או צינור) ומשווה למשפט. כל דבר אחר — יציאה בלי לגעת במסד.
export async function requirePhrase(phrase) {
  console.log(`\nכדי להמשיך, הקלד/י בדיוק: ${phrase}`)
  const rl = createInterface({ input: process.stdin })
  const line = await new Promise((res) => {
    rl.once('line', res)
    rl.once('close', () => res(''))
  })
  rl.close()
  if (!checkConfirmation(line, phrase)) {
    const err = new Error('המשפט לא תאם — לא בוצע שום שינוי.')
    err.exitCode = 2
    throw err
  }
}
