// npm run freeze:wipe [-- --dry-run] [-- --snapshots=<root>]
// מוחק (TRUNCATE) את הנתונים העסקיים ב-public. לא נוגע בסכמה, בפונקציות, ב-auth, ב-storage,
// ב-seed_snapshot, ולא בטבלאות שברשימת-השמירה (KEEP ב-lib.mjs — כל אחת עם סיבה).
//
// שומרים (כולם חייבים לעבור, אחרת אין מחיקה):
//   1. יש צילום מ-24 השעות האחרונות עם manifest.json, וכל קבציו קיימים ובאותו sha256.
//      תיקייה בלי מניפסט = צילום שנקטע ⇒ מתעלמים ממנה (מודפסת כ"נדחתה").
//   2. מספרי-השורות החיים של כל טבלאות public שווים למניפסט, וה-md5 של כל טבלה שתימחק שווה.
//      כלומר: שום דבר שנכתב אחרי הצילום לא יאבד.
//   3. כל טבלה שעומדת להימחק קיימת במניפסט (טבלה חדשה שלא צולמה ⇒ עצירה).
//   4. הקלדת המשפט המדויק "מחק את כל הנתונים".
// ‏--dry-run מדפיס מה היה נמחק, מה נשמר ולמה, ומה תוצאת השומרים — ולא משנה דבר.

import { sql } from './api.mjs'
import {
  defaultSnapshotRoot,
  listSnapshotCandidates,
  listTables,
  requirePhrase,
  resolveDir,
  tableStats,
} from './common.mjs'
import {
  KEEP,
  WIPE_PHRASE,
  compareStats,
  formatComparison,
  ident,
  parseArgs,
  partitionTables,
  pickFreshSnapshot,
  qualify,
} from './lib.mjs'

function printPlan(wipe, keep, missingKeep) {
  console.log(`\nיימחקו (TRUNCATE) — ${wipe.length} טבלאות:`)
  for (const t of wipe) console.log(`  - public.${t}`)
  console.log(`\nנשמרות — ${keep.length} טבלאות:`)
  for (const t of keep) console.log(`  + public.${t} — ${KEEP[t]}`)
  for (const t of missingKeep) console.warn(`  ⚠ ברשימת-השמירה אבל לא קיימת במסד: ${t}`)
  console.log('\nלא נגיעה בכלל: auth.*, storage.*, seed_snapshot.*, סכמה ופונקציות.')
}

// מחזיר רשימת סיבות-סירוב (ריקה = מותר למחוק).
async function checkGuards(root, publicTables, wipe) {
  const { chosen, rejected } = pickFreshSnapshot(listSnapshotCandidates(root), Date.now())
  for (const r of rejected) console.log(`  נדחה: ${r.dir} — ${r.reason}`)
  if (!chosen) return [`אין צילום תקף מ-24 השעות האחרונות ב-${root}`]
  console.log(`  צילום נבחר: ${chosen.dir} (${chosen.manifest.createdAt})`)

  const reasons = []
  const notInManifest = wipe.filter((t) => !chosen.manifest.tables[`public.${t}`])
  if (notInManifest.length) reasons.push(`טבלאות שלא צולמו: ${notInManifest.join(', ')}`)

  const keys = Object.fromEntries(publicTables.map((t) => [`public.${t}`, qualify('public', t)]))
  const live = await tableStats(keys)
  const expected = {}
  for (const t of publicTables) {
    const m = chosen.manifest.tables[`public.${t}`]
    // md5 נדרש רק לטבלאות שנמחקות; לשמורות — מספר-שורות (הן לא נמחקות, אז שינוי-ערך לא אובד).
    if (m) expected[`public.${t}`] = { rows: m.rows, md5: wipe.includes(t) ? m.md5 : null }
  }
  const bad = compareStats(expected, live).filter((r) => r.status !== 'OK')
  if (bad.length) {
    console.log(formatComparison(bad))
    reasons.push(`${bad.length} טבלאות השתנו מאז הצילום — צלמו מחדש`)
  }
  return reasons
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const root = args.snapshots ? resolveDir(args.snapshots) : defaultSnapshotRoot()
  const publicTables = (await listTables('public')).map((t) => t.table)
  const { wipe, keep, missingKeep } = partitionTables(publicTables, KEEP)
  printPlan(wipe, keep, missingKeep)

  console.log('\nבדיקת שומרים:')
  const reasons = await checkGuards(root, publicTables, wipe)
  for (const r of reasons) console.log(`  ✗ ${r}`)
  if (!reasons.length) console.log('  ✓ כל השומרים עברו')

  if (args['dry-run']) {
    console.log('\n(--dry-run) לא בוצע שום שינוי.')
    return
  }
  if (reasons.length) throw new Error('המחיקה סורבה — לא בוצע שום שינוי.')
  await requirePhrase(WIPE_PHRASE)

  // טרנזקציה אחת: replica כדי שאף טריגר TRUNCATE (יומן/מייל) לא ירוץ. בלי CASCADE בכוונה —
  // אם טבלה שמורה מצביעה על טבלה נמחקת, Postgres ייכשל ולא ימחק "בשקט" גם אותה.
  const list = wipe.map((t) => `public.${ident(t)}`).join(', ')
  await sql(`set local session_replication_role = replica;\ntruncate table ${list};`)

  const after = await tableStats(
    Object.fromEntries(wipe.map((t) => [`public.${t}`, qualify('public', t)])),
  )
  const left = Object.entries(after).filter(([, s]) => s.rows !== 0)
  if (left.length) throw new Error(`נשארו שורות ב: ${left.map(([k]) => k).join(', ')}`)
  console.log(
    `\n✓ נמחקו ${wipe.length} טבלאות. לשחזור: npm run freeze:restore -- --from=<dir> --apply`,
  )
}

main().catch((error) => {
  console.error(`✗ freeze:wipe נכשל: ${error.message}`)
  // exitCode ולא process.exit: ב-Node 24 על Windows, יציאה כפויה בזמן שחיבור fetch נסגר מפילה את
  // libuv ‏(UV_HANDLE_CLOSING) ומחזירה 127 במקום הקוד האמיתי (נמדד 15.10).
  process.exitCode = error.exitCode ?? 1
})
