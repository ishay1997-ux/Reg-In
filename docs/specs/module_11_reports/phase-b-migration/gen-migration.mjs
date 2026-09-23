// gen-migration.mjs — builds the phase-B text migration from ops.mjs.
// For every op it locates the EXACT span in the latest function body in the migration files
// (so the SQL `replace()` matches the live pg_get_functiondef text byte for byte), prints it for
// review, and emits: (1) the migration, (2) a read-only verify query that counts each span in
// the LIVE function. Usage: node gen-migration.mjs <out.sql> <verify.sql> [--show]
import fs from 'fs'
import path from 'path'
import { OPS, FILES } from './ops.mjs'

const REPO = 'C:/Users/ishay/Reg-In-copy-wt/supabase/migrations/'
const [outFile, verifyFile, show] = process.argv.slice(2)

function bodyOf(fn) {
  const src = fs.readFileSync(path.join(REPO, FILES[fn]), 'utf8').replace(/\r\n/g, '\n')
  const start = src.lastIndexOf(`create or replace function public.${fn}(`)
  if (start < 0) throw new Error(`no body for ${fn}`)
  const open = src.indexOf('$function$', start)
  const close = src.indexOf('$function$', open + 10)
  return src.slice(open + 10, close)
}

const count = (hay, needle) => hay.split(needle).length - 1

function resolve(body, op) {
  // op: { find } exact string · or { from, to, back? } span (to inclusive, first after from)
  if (op.find != null) {
    const n = count(body, op.find)
    if (op.all ? n < 1 : n !== 1) throw new Error(`find x${n}: ${op.find.slice(0, 80)}`)
    return op.find
  }
  let s = body.indexOf(op.from)
  if (op.all && s >= 0) {
    const span = body.slice(s, body.indexOf(op.to, s) + op.to.length)
    if (!span.endsWith(op.to)) throw new Error(`to not found (all): ${op.to}`)
    return span
  }
  if (s < 0 || body.indexOf(op.from, s + 1) >= 0)
    throw new Error(`from not unique/missing (${count(body, op.from)}): ${op.from.slice(0, 80)}`)
  if (op.back) {
    const b = body.lastIndexOf(op.back, s)
    if (b < 0) throw new Error(`back not found: ${op.back}`)
    s = b
  }
  const e = body.indexOf(op.to, s + (op.back ? 0 : op.from.length))
  if (e < 0) throw new Error(`to not found after from: ${op.to.slice(0, 80)}`)
  const span = body.slice(s, e + op.to.length)
  if (count(body, span) !== 1) throw new Error(`span not unique: ${span.slice(0, 80)}`)
  return span
}

const tag = (i, k) => `$${k}${i}$`
let sql = ''
let verify = []
const errors = []
for (const [fn, ops] of Object.entries(OPS)) {
  let body = bodyOf(fn)
  sql += `\n-- ═══ ${fn} — ${ops.length} replacements ═══\ndo $m11$\ndeclare\n  v_oid oid;\n  v_def text;\nbegin\n`
  sql += `  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace\n   where n.nspname = 'public' and p.proname = '${fn}';\n  v_def := pg_get_functiondef(v_oid);\n`
  ops.forEach((op, i) => {
    let old
    try {
      old = resolve(body, op)
    } catch (err) {
      errors.push(`${fn} #${i} (${op.why}): ${err.message}`)
      return
    }
    const neu = op.with
    if (show) console.log(`\n### ${fn} #${i} ${op.why ?? ''}\n--- OLD ---\n${old}\n+++ NEW +++\n${neu}`)
    const o = tag(i, 'o')
    const n = tag(i, 'n')
    if (old.includes(o) || neu.includes(n)) throw new Error('tag collision')
    const guard = op.all
      ? `  if position(${o}${old}${o} in v_def) = 0 then raise exception 'm11 text ${fn} #${i} not found'; end if;\n`
      : `  if (length(v_def) - length(replace(v_def, ${o}${old}${o}, ''))) <> length(${o}${old}${o}) then\n    raise exception 'm11 text ${fn} #${i}: not exactly once'; end if;\n`
    sql += guard + `  v_def := replace(v_def, ${o}${old}${o}, ${n}${neu}${n});\n`
    verify.push(
      `select '${fn}' as fn, ${i} as op, (length(d) - length(replace(d, ${o}${old}${o}, ''))) / length(${o}${old}${o}) as hits from (select pg_get_functiondef(p.oid) d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = '${fn}') x`,
    )
    // apply locally too, so later ops see earlier edits (same as in the DB)
    body = op.all ? body.split(old).join(neu) : body.replace(old, () => neu)
  })
  sql += `  execute v_def;\nend $m11$;\n`
}
if (errors.length) { console.log(errors.join('\n')); process.exit(1) }
fs.writeFileSync(outFile, sql)
fs.writeFileSync(verifyFile, verify.join('\nunion all\n') + '\norder by 1, 2;\n')
console.log(`ok: ${Object.keys(OPS).length} functions, ${verify.length} replacements`)
