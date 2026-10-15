// npm run freeze:snapshot [-- --out=<dir>]
// צילום מלא של נתוני המערכת אל מחוץ ל-Supabase (ברירת מחדל: OneDrive\REGIN\freeze-snapshots).
// קריאה בלבד מול המסד. 🔒 התיקייה מכילה hash-סיסמאות ופרטי-בנק של הדגמה — לעולם לא לתוך הריפו.
//
// 🔑 המניפסט נכתב אחרון, ובכתיבה אטומית (קובץ זמני ← rename). צילום שנקטע באמצע (למשל בהורדת
//    קובץ-אחסון) משאיר תיקייה בלי manifest.json — ו-freeze:wipe ו-freeze:restore מתייחסים
//    לתיקייה כזו כאילו אין צילום בכלל. אין "חצי גיבוי" שנראה כמו גיבוי.

import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { PROJECT_REF, downloadObject, serviceRoleKey, sql } from './api.mjs'
import { defaultSnapshotRoot, listTables, resolveDir, tableStats } from './common.mjs'
import {
  KEEP,
  parseArgs,
  partitionTables,
  qualify,
  sha256,
  snapshotStamp,
  storageRelPath,
} from './lib.mjs'

const PAGE = 2000
const SCOPES = [
  { schema: 'public' },
  { schema: 'seed_snapshot' },
  { schema: 'auth', only: ['users', 'identities'] },
]

// שליפת טבלה בעמודים, כשכל שורה נשמרת כטקסט ה-JSON שה-SQL הפיק — בלי JSON.parse ב-Node,
// כי numeric כמו 12.30 היה הופך ל-12.3 ומשנה את ה-md5. מאחר שכל עמוד הוא טרנזקציה נפרדת,
// סופרים לפני ואחרי: אם הטבלה השתנתה באמצע — מנסים שוב (עד 3 פעמים).
async function fetchTable(key, q) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const before = (await tableStats({ [key]: q }))[key]
    const lines = []
    for (let offset = 0; offset < before.rows; offset += PAGE) {
      const page = await sql(
        `select row_to_json(t)::text as j from ${q} t order by t::text limit ${PAGE} offset ${offset}`,
      )
      for (const r of page) lines.push(r.j)
    }
    const after = (await tableStats({ [key]: q }))[key]
    if (after.md5 === before.md5 && lines.length === before.rows) return { lines, stats: before }
    console.warn(`  ${key} השתנתה בזמן הקריאה — ניסיון ${attempt + 1}`)
  }
  throw new Error(`${key} ממשיכה להשתנות — הצילום נעצר. הריצו שוב כשהאתר שקט.`)
}

async function snapshotTables(outDir) {
  const tables = {}
  for (const scope of SCOPES) {
    const list = (await listTables(scope.schema)).filter(
      (t) => !scope.only || scope.only.includes(t.table),
    )
    for (const { table, columns } of list) {
      const key = `${scope.schema}.${table}`
      const { lines, stats } = await fetchTable(key, qualify(scope.schema, table))
      const file = `tables/${key}.jsonl`
      const body = Buffer.from(lines.map((l) => `${l}\n`).join(''), 'utf-8')
      writeFileSync(join(outDir, file), body)
      tables[key] = { ...stats, file, bytes: body.length, sha256: sha256(body), columns }
      console.log(`  ${key.padEnd(55)} ${String(stats.rows).padStart(6)}`)
    }
  }
  return tables
}

async function snapshotSequences() {
  return sql(`
    select schemaname as schema, sequencename as name, last_value, start_value
    from pg_sequences where schemaname in ('public', 'seed_snapshot')
    order by 1, 2`)
}

async function snapshotStorage(outDir) {
  const objects = await sql(`
    select bucket_id as bucket, name, metadata->>'mimetype' as mimetype
    from storage.objects order by bucket_id, name`)
  if (!objects.length) return []
  const key = await serviceRoleKey()
  const out = []
  for (const o of objects) {
    const file = storageRelPath(o.bucket, o.name)
    const body = await downloadObject(key, o.bucket, o.name)
    mkdirSync(dirname(join(outDir, file)), { recursive: true })
    writeFileSync(join(outDir, file), body)
    out.push({ ...o, file, bytes: body.length, sha256: sha256(body) })
    console.log(`  storage ${o.bucket}/${o.name} (${body.length} B)`)
  }
  return out
}

async function schemaVersion() {
  try {
    const [row] = await sql(
      `select version, name from supabase_migrations.schema_migrations order by version desc limit 1`,
    )
    return row ? `${row.version} ${row.name ?? ''}`.trim() : null
  } catch {
    // הטבלה אינה חובה בכל פרויקט; גרסה חסרה נרשמת כ-null ולא מפילה צילום שלם.
    return null
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const createdAt = new Date()
  const outDir = args.out
    ? resolveDir(args.out)
    : join(defaultSnapshotRoot(), snapshotStamp(createdAt))
  // תיקייה שכבר יש בה מניפסט — לא דורסים: צילום שנקטע היה משאיר מניפסט ישן מעל קבצים חדשים.
  if (existsSync(join(outDir, 'manifest.json'))) {
    throw new Error(`ב-${outDir} כבר יש צילום. בחרו --out אחר.`)
  }
  mkdirSync(join(outDir, 'tables'), { recursive: true })
  console.log(`צילום אל: ${outDir}`)

  const version = await schemaVersion()
  const tables = await snapshotTables(outDir)
  const sequences = await snapshotSequences()
  const storage = await snapshotStorage(outDir)
  const publicTables = Object.keys(tables)
    .filter((k) => k.startsWith('public.'))
    .map((k) => k.slice('public.'.length))
  const { wipe, keep } = partitionTables(publicTables, KEEP)

  const manifest = {
    format: 1,
    project: PROJECT_REF,
    createdAt: createdAt.toISOString(),
    schemaVersion: version,
    tables,
    sequences,
    storage,
    wipeSet: wipe,
    keepSet: keep,
  }
  const tmp = join(outDir, 'manifest.json.tmp')
  writeFileSync(tmp, `${JSON.stringify(manifest, null, 2)}\n`)
  renameSync(tmp, join(outDir, 'manifest.json'))

  const totalRows = Object.values(tables).reduce((s, t) => s + t.rows, 0)
  console.log(
    `\n✓ הצילום הושלם: ${Object.keys(tables).length} טבלאות, ${totalRows} שורות, ` +
      `${sequences.length} רצפים, ${storage.length} קבצי-אחסון.\n  ${outDir}`,
  )
}

main().catch((error) => {
  console.error(
    `✗ הצילום נכשל: ${error.message}\n  התיקייה נשארה בלי manifest.json ולכן אינה גיבוי תקף.`,
  )
  process.exitCode = 1
})
