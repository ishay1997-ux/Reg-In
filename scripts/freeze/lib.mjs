// לוגיקה טהורה של כלי ההקפאה — בלי רשת ובלי דיסק, כדי שכל החלטה מסוכנת (מה נמחק, באיזה
// סדר, האם צילום תקף, האם המשפט הוקלד נכון) תיבדק ב-Vitest ולא רק "בהרצה על החי".

import { createHash, randomBytes } from 'node:crypto'

export const WIPE_PHRASE = 'מחק את כל הנתונים'
export const RESTORE_PHRASE = 'החזר את כל הנתונים'
export const TEST_SCHEMA = 'freeze_restore_test'
export const SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000

// רשימת-השמירה: טבלאות public שהמחיקה לא נוגעת בהן. כל שורה — סיבה אחת.
// הכלל: נשאר רק מה שבלעדיו המנכ"ל לא יכול להיכנס ולראות מערכת עובדת, או מה שהוא הגדרה
// ולא "נתון שנוצר בעבודה". כל השאר — לקוחות, דיילות, הצעות, פרויקטים, שכר, יומנים — נמחק.
export const KEEP = {
  users: 'ממפה כל משתמש-התחברות (auth) לתפקיד — בלעדיה המנכ"ל נכנס ולא רואה כלום',
  roles: 'הגדרת התפקידים; users.role_id מצביע עליה',
  modules: 'רשימת המודולים שעליה נבנות ההרשאות והתפריט',
  permissions: 'מטריצת תפקיד×מודול — קובעת מה כל תפקיד רואה',
  notification_preferences: 'העדפות אישיות של משתמשים (כולל מצב-הדרכה) — הגדרה, לא נתון עסקי',
  params: 'פרמטרי-המערכת (תעריפים, ספים) — קונפיגורציה',
  payroll_config: 'שורת-הגדרות יחידה של השכר (מתגים, תקופות נעולות) — קונפיגורציה',
  products: 'קטלוג המוצרים/השירותים — בלעדיו אי אפשר לבנות הצעת-מחיר חדשה',
  product_costs: 'עלות לכל מוצר בקטלוג — חלק מהקטלוג',
  price_tiers: 'מדרגות-מחיר לכל מוצר בקטלוג — חלק מהקטלוג',
}

// ציטוט מזהה SQL — שם טבלה מהמסד עובר דרך כאן תמיד, גם אם נראה "בטוח".
export function ident(name) {
  return `"${String(name).replaceAll('"', '""')}"`
}

export function lit(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

export function qualify(schema, table) {
  return `${ident(schema)}.${ident(table)}`
}

// ה-md5 הקנוני: אותה נוסחה בצילום, בבדיקת-המחיקה ובשחזור — אחרת "שווה" אינו אומר דבר.
// מיון לפי t::text הופך את התוצאה לבלתי-תלויה בסדר הפיזי של השורות.
export function canonicalStatsSql(qualifiedName) {
  return (
    `select count(*)::bigint as n, ` +
    `md5(coalesce(string_agg(t::text, E'\\n' order by t::text), '')) as h ` +
    `from ${qualifiedName} t`
  )
}

export function checkConfirmation(input, phrase) {
  const clean = (s) =>
    String(s ?? '')
      .replace(/^﻿/, '')
      .normalize('NFC')
      .trim()
  return clean(input) === clean(phrase)
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function snapshotStamp(date) {
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}-` +
    `${pad2(date.getHours())}${pad2(date.getMinutes())}`
  )
}

// מיון טופולוגי — הורים לפני ילדים. FK עצמי מתעלם; מעגל (salary_reports ⇄ payroll_reviews)
// נשלח לסוף בסדר אלפביתי — השחזור רץ ב-replica ולכן FK לא נאכף בהכנסה, והסדר הוא ניקיון בלבד.
export function topoOrder(tables, fks) {
  const set = new Set(tables)
  const parents = new Map(tables.map((t) => [t, new Set()]))
  for (const { child, parent } of fks) {
    if (child !== parent && set.has(child) && set.has(parent)) parents.get(child).add(parent)
  }
  const done = []
  const placed = new Set()
  let progress = true
  while (progress) {
    progress = false
    for (const t of [...tables].sort()) {
      if (placed.has(t)) continue
      if ([...parents.get(t)].every((p) => placed.has(p))) {
        done.push(t)
        placed.add(t)
        progress = true
      }
    }
  }
  const cyclic = tables.filter((t) => !placed.has(t)).sort()
  return [...done, ...cyclic]
}

export function partitionTables(publicTables, keep = KEEP) {
  const keepSet = new Set(Object.keys(keep))
  return {
    wipe: publicTables.filter((t) => !keepSet.has(t)).sort(),
    keep: publicTables.filter((t) => keepSet.has(t)).sort(),
    // שם ברשימת-השמירה שאין לו טבלה — כנראה שינוי-סכמה; מדווחים במקום לשתוק.
    missingKeep: [...keepSet].filter((t) => !publicTables.includes(t)).sort(),
  }
}

// חלוקה לנתחים לפי בתים ושורות — גוף בקשה ענק נדחה ע"י ה-API, ונתח קטן מדי מאט פי עשרות.
export function chunkLines(lines, { maxBytes = 1_500_000, maxRows = 2000 } = {}) {
  const chunks = []
  let current = []
  let bytes = 0
  for (const line of lines) {
    const size = Buffer.byteLength(line) + 1
    if (current.length && (bytes + size > maxBytes || current.length >= maxRows)) {
      chunks.push(current)
      current = []
      bytes = 0
    }
    current.push(line)
    bytes += size
  }
  if (current.length) chunks.push(current)
  return chunks
}

// תג dollar-quote אקראי, ואימות שהנתונים לא מכילים אותו — אחרת הנתון "סוגר" את המחרוזת.
export function dollarTag(text, rand = () => randomBytes(6).toString('hex')) {
  for (let i = 0; i < 5; i += 1) {
    const tag = `$fz${rand()}$`
    if (!text.includes(tag)) return tag
  }
  throw new Error('לא נמצא תג dollar-quote פנוי')
}

// הכנסת נתח JSON לטבלה. עמודות מחושבות (generated) מושמטות — Postgres מחשב אותן מחדש;
// עמודות זהות (identity ALWAYS) דורשות overriding system value כדי לשמור את המזהה המקורי.
export function buildInsertSql({
  target,
  sourceType,
  columns,
  hasIdentity,
  jsonLines,
  onConflictDoNothing = false,
  replica = false,
}) {
  const json = `[${jsonLines.join(',')}]`
  const tag = dollarTag(json)
  const cols = columns.map(ident).join(', ')
  return (
    (replica ? 'set local session_replication_role = replica;\n' : '') +
    `insert into ${target} (${cols})${hasIdentity ? ' overriding system value' : ''}\n` +
    `select ${cols} from json_populate_recordset(null::${sourceType}, ${tag}${json}${tag}::json)` +
    (onConflictDoNothing ? '\non conflict do nothing' : '') +
    ';'
  )
}

// השוואת מניפסט מול מצב בפועל — שורה לכל טבלה במניפסט ולכל טבלה שקיימת רק בפועל.
export function compareStats(expected, actual) {
  const names = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort()
  return names.map((name) => {
    const e = expected[name]
    const a = actual[name]
    let status = 'OK'
    if (!e) status = 'EXTRA'
    else if (!a) status = 'MISSING'
    else if (Number(e.rows) !== Number(a.rows)) status = 'ROWS'
    else if (e.md5 && a.md5 && e.md5 !== a.md5) status = 'MD5'
    return { table: name, expRows: e?.rows ?? null, actRows: a?.rows ?? null, status }
  })
}

export function formatComparison(rows) {
  const width = Math.max(10, ...rows.map((r) => r.table.length))
  const lines = rows.map(
    (r) =>
      `${r.table.padEnd(width)}  ${String(r.expRows ?? '-').padStart(7)}  ` +
      `${String(r.actRows ?? '-').padStart(7)}  ${r.status}`,
  )
  return [`${'table'.padEnd(width)}  ${'manifest'.padStart(7)}  ${'actual'.padStart(7)}  status`]
    .concat(lines)
    .join('\n')
}

// מועמד = תיקייה שיש בה manifest.json. תיקייה בלי מניפסט היא צילום שנקטע באמצע (המניפסט נכתב
// אחרון), ולכן היא לעולם לא נחשבת גיבוי. מחזיר את הטרי ביותר בטווח, ואת הסיבות לדחיית האחרים.
export function pickFreshSnapshot(candidates, now, maxAgeMs = SNAPSHOT_MAX_AGE_MS) {
  const rejected = []
  const valid = []
  for (const c of candidates) {
    if (!c.manifest) {
      rejected.push({ dir: c.dir, reason: 'אין manifest.json — צילום שלא הושלם' })
      continue
    }
    const age = now - Date.parse(c.manifest.createdAt)
    if (!(age >= 0 && age <= maxAgeMs)) {
      rejected.push({ dir: c.dir, reason: 'ישן מ-24 שעות (או תאריך לא תקין)' })
      continue
    }
    if (c.missingFiles?.length) {
      rejected.push({ dir: c.dir, reason: `חסרים/שונים קבצים: ${c.missingFiles.join(', ')}` })
      continue
    }
    valid.push(c)
  }
  valid.sort((a, b) => Date.parse(b.manifest.createdAt) - Date.parse(a.manifest.createdAt))
  return { chosen: valid[0] ?? null, rejected }
}

// נתיב קובץ-אחסון בתוך תיקיית הצילום — שם אובייקט עם '..' או נתיב מוחלט נדחה, כדי ששם זדוני
// במסד לא יכתוב מחוץ לתיקייה.
export function storageRelPath(bucket, name) {
  const parts = [bucket, ...String(name).split('/')]
  if (parts.some((p) => p === '' || p === '.' || p === '..' || /[\\:]/.test(p))) {
    throw new Error(`שם אובייקט לא בטוח: ${bucket}/${name}`)
  }
  return ['storage', ...parts].join('/')
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

export function parseArgs(argv) {
  const out = {}
  for (const arg of argv) {
    const m = /^--([a-z-]+)(?:=(.*))?$/.exec(arg)
    if (m) out[m[1]] = m[2] ?? true
  }
  return out
}
