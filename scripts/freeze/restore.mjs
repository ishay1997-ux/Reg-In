// npm run freeze:restore -- --from=<dir>            (ברירת מחדל: --verify-only, בטוח על החי)
// npm run freeze:restore -- --from=<dir> --apply    (מחזיר את כל הנתונים — דורש משפט מוקלד)
//
// --verify-only: טוען את הצילום לסכמה זמנית freeze_restore_test (‏LIKE … INCLUDING ALL — בלי FK
//   ובלי טריגרים), מחשב md5 לכל טבלה ומשווה למניפסט. הסכמה נמחקת תמיד בסוף (finally).
//   הוכחה שהצילום ניתן לשחזור אחד-לאחד — בלי לגעת בטבלה חיה אחת.
//
// --apply: ‏replica (אף טריגר לא רץ — לא מיילים ולא יומן) ⇒ TRUNCATE של סט-המחיקה ⇒ הכנסה בנתחים
//   (identity נשמר, עמודות מחושבות מחושבות מחדש) ⇒ setval לרצפים ⇒ auth חסר (on conflict do nothing)
//   ⇒ העלאת קבצי-אחסון חסרים ⇒ אימות md5 מול המניפסט. כל אי-התאמה ⇒ יציאה בקוד שאינו 0.
//
// 🔴 אם --apply נכשל באמצע: כל קריאה ל-API היא טרנזקציה נפרדת, ולכן חלק מהטבלאות כבר מלאות וחלק
//   ריקות/חלקיות. התיקון: להריץ שוב את אותה פקודת --apply. היא אידמפוטנטית — היא מתחילה ב-TRUNCATE
//   של כל סט-המחיקה, כך שהריצה השנייה מתחילה מאפס ולא מכפילה שורות. auth ו-storage מוסיפים רק חסרים.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serviceRoleKey, sql, uploadObject } from './api.mjs'
import {
  listFks,
  listTables,
  readJsonLines,
  readManifest,
  requirePhrase,
  resolveDir,
  tableStats,
  verifyFiles,
} from './common.mjs'
import {
  KEEP,
  RESTORE_PHRASE,
  TEST_SCHEMA,
  buildInsertSql,
  chunkLines,
  compareStats,
  formatComparison,
  ident,
  lit,
  parseArgs,
  partitionTables,
  qualify,
  topoOrder,
} from './lib.mjs'

function splitKey(key) {
  const dot = key.indexOf('.')
  return [key.slice(0, dot), key.slice(dot + 1)]
}

async function liveColumns(schema) {
  return new Map((await listTables(schema)).map((t) => [t.table, t.columns]))
}

// עמודות להכנסה = עמודות הצילום ∩ עמודות החי, בלי מחושבות. identity לפי החי.
function insertColumns(snapshotCols, liveCols) {
  const live = new Map(liveCols.map((c) => [c.name, c]))
  const cols = snapshotCols
    .filter((c) => live.has(c.name) && !live.get(c.name).generated)
    .map((c) => c.name)
  return { cols, hasIdentity: liveCols.some((c) => c.identity) }
}

async function loadTable({ dir, entry, target, sourceType, liveCols, replica, onConflict }) {
  const lines = readJsonLines(dir, entry.file)
  const { cols, hasIdentity } = insertColumns(entry.columns, liveCols)
  for (const chunk of chunkLines(lines)) {
    await sql(
      buildInsertSql({
        target,
        sourceType,
        columns: cols,
        hasIdentity,
        jsonLines: chunk,
        onConflictDoNothing: onConflict,
        replica,
      }),
    )
  }
  return lines.length
}

function expectedOf(manifest, keys) {
  return Object.fromEntries(
    keys.map((k) => [k, { rows: manifest.tables[k].rows, md5: manifest.tables[k].md5 }]),
  )
}

async function verifyOnly(dir, manifest) {
  const keys = Object.keys(manifest.tables).sort()
  const live = {}
  for (const schema of new Set(keys.map((k) => splitKey(k)[0]))) {
    live[schema] = await liveColumns(schema)
  }
  const testKeys = {}
  await sql(
    `drop schema if exists ${ident(TEST_SCHEMA)} cascade; create schema ${ident(TEST_SCHEMA)};`,
  )
  try {
    let i = 0
    for (const key of keys) {
      const [schema, table] = splitKey(key)
      const liveCols = live[schema].get(table)
      if (!liveCols) {
        console.warn(`  ${key}: אין טבלה כזו במסד החי — לא ניתן לבדוק`)
        continue
      }
      i += 1
      const target = qualify(TEST_SCHEMA, `t${String(i).padStart(3, '0')}`)
      await sql(`create table ${target} (like ${qualify(schema, table)} including all);`)
      const sourceType = qualify(schema, table)
      await loadTable({ dir, entry: manifest.tables[key], target, sourceType, liveCols })
      testKeys[key] = target
    }
    const actual = await tableStats(testKeys)
    return compareStats(expectedOf(manifest, keys), actual)
  } finally {
    await sql(`drop schema if exists ${ident(TEST_SCHEMA)} cascade;`)
    const [{ n }] = await sql(
      `select count(*)::int as n from pg_namespace where nspname = ${lit(TEST_SCHEMA)}`,
    )
    console.log(`  סכמת-הבדיקה ${TEST_SCHEMA} ${n === 0 ? 'נמחקה ✓' : 'עדיין קיימת ✗'}`)
  }
}

async function restoreSequences(manifest) {
  for (const s of manifest.sequences.filter((x) => x.schema === 'public')) {
    const seq = lit(qualify(s.schema, s.name))
    const q =
      s.last_value === null
        ? `select setval(${seq}, ${Number(s.start_value)}, false)`
        : `select setval(${seq}, ${Number(s.last_value)}, true)`
    await sql(q)
  }
}

async function restoreAuth(dir, manifest) {
  const live = await liveColumns('auth')
  for (const table of ['users', 'identities']) {
    const entry = manifest.tables[`auth.${table}`]
    if (!entry) continue
    const target = qualify('auth', table)
    await loadTable({
      dir,
      entry,
      target,
      sourceType: target,
      liveCols: live.get(table),
      replica: true,
      onConflict: true,
    })
  }
}

async function restoreStorage(dir, manifest) {
  if (!manifest.storage?.length) return 0
  const existing = new Set(
    (await sql(`select bucket_id || '/' || name as k from storage.objects`)).map((r) => r.k),
  )
  const missing = manifest.storage.filter((o) => !existing.has(`${o.bucket}/${o.name}`))
  if (!missing.length) return 0
  const key = await serviceRoleKey()
  for (const o of missing) {
    await uploadObject(key, o.bucket, o.name, readFileSync(join(dir, o.file)), o.mimetype)
  }
  return missing.length
}

async function checkSchemaVersion(manifest, allowDrift) {
  const [row] = await sql(
    `select version, name from supabase_migrations.schema_migrations order by version desc limit 1`,
  )
  const live = row ? `${row.version} ${row.name ?? ''}`.trim() : null
  if (manifest.schemaVersion && live !== manifest.schemaVersion) {
    const msg = `גרסת-הסכמה השתנתה: צילום ${manifest.schemaVersion} ⇐ חי ${live}`
    if (!allowDrift) throw new Error(`${msg}. בדקו התאמה, ואז הוסיפו --allow-schema-drift.`)
    console.warn(`⚠ ${msg} — ממשיכים (--allow-schema-drift)`)
  }
}

async function apply(dir, manifest, args) {
  await checkSchemaVersion(manifest, Boolean(args['allow-schema-drift']))
  const publicLive = await liveColumns('public')
  const { wipe } = partitionTables([...publicLive.keys()], KEEP)
  const restoreSet = wipe.filter((t) => manifest.tables[`public.${t}`])
  const notInSnapshot = wipe.filter((t) => !manifest.tables[`public.${t}`])
  if (notInSnapshot.length) console.warn(`⚠ לא בצילום, לא ישוחזרו: ${notInSnapshot.join(', ')}`)

  await requirePhrase(RESTORE_PHRASE)

  const list = restoreSet.map((t) => `public.${ident(t)}`).join(', ')
  await sql(`set local session_replication_role = replica;\ntruncate table ${list};`)
  for (const table of topoOrder(restoreSet, await listFks('public'))) {
    const target = qualify('public', table)
    const n = await loadTable({
      dir,
      entry: manifest.tables[`public.${table}`],
      target,
      sourceType: target,
      liveCols: publicLive.get(table),
      replica: true,
    })
    console.log(`  public.${table.padEnd(40)} ${String(n).padStart(6)}`)
  }
  await restoreSequences(manifest)
  await restoreAuth(dir, manifest)
  console.log(`  קבצי-אחסון שהועלו מחדש: ${await restoreStorage(dir, manifest)}`)

  // אימות: סט-המחיקה חייב להיות זהה. שמורות + seed_snapshot — לא שוחזרו, ולכן סטייה בהן היא
  // "השתנה מאז הצילום" ומדווחת בנפרד (קוד 3), לא כשל-שחזור (קוד 1).
  const keys = Object.keys(manifest.tables).filter((k) => !k.startsWith('auth.'))
  const actual = await tableStats(Object.fromEntries(keys.map((k) => [k, qualify(...splitKey(k))])))
  const rows = compareStats(expectedOf(manifest, keys), actual)
  console.log(formatComparison(rows))
  const restoredKeys = new Set(restoreSet.map((t) => `public.${t}`))
  const failed = rows.filter((r) => r.status !== 'OK' && restoredKeys.has(r.table))
  const drift = rows.filter((r) => r.status !== 'OK' && !restoredKeys.has(r.table))
  const users = await sql(`select count(*)::int as n from auth.users`)
  console.log(`  auth.users חי: ${users[0].n} (בצילום: ${manifest.tables['auth.users']?.rows})`)
  if (failed.length) return 1
  return drift.length ? 3 : 0
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.from || args.from === true) throw new Error('חסר --from=<תיקיית צילום>')
  const dir = resolveDir(args.from)
  const manifest = readManifest(dir)
  if (!manifest) throw new Error(`אין manifest.json ב-${dir} — צילום לא שלם, אין ממה לשחזר.`)
  const problems = verifyFiles(dir, manifest)
  if (problems.length) throw new Error(`קבצי הצילום פגומים: ${problems.join(', ')}`)

  if (args.apply) {
    const code = await apply(dir, manifest, args)
    console.log(
      code === 0
        ? '\n✓ השחזור הושלם וכל הטבלאות תואמות למניפסט.'
        : code === 3
          ? '\n⚠ השחזור הושלם; טבלאות שלא שוחזרו (שמורות/seed_snapshot) השתנו מאז הצילום.'
          : '\n✗ אי-התאמה אחרי השחזור — הריצו שוב את אותה פקודה (אידמפוטנטית).',
    )
    process.exitCode = code
    return
  }

  console.log(`בדיקת שחזור (verify-only) מול ${dir}`)
  const rows = await verifyOnly(dir, manifest)
  console.log(formatComparison(rows))
  const bad = rows.filter((r) => r.status !== 'OK')
  console.log(
    bad.length
      ? `\n✗ ${bad.length} טבלאות לא תואמות.`
      : `\n✓ כל ${rows.length} הטבלאות תואמות (md5 + מספר שורות).`,
  )
  process.exitCode = bad.length ? 1 : 0
}

main().catch((error) => {
  console.error(`✗ freeze:restore נכשל: ${error.message}`)
  process.exitCode = error.exitCode ?? 1
})
