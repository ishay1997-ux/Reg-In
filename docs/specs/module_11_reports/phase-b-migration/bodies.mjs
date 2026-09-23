// bodies.mjs — the function body (prosrc) exactly as it is in the DB, rebuilt from the repo.
// preL1(fn)  = the latest j-file body + K1's patches (proven == live before L1 by md5check.mjs).
// postL1(fn) = preL1 + every `replace` pair of the applied L1 migration file, in order
//              (proven == live after L1: md5 13/13, 23/09/2026 — see db_roadmap §10ב).
// A later text round (L2…) builds on postL1, so its guards match the live text byte for byte.
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { FILES } from './ops.mjs'

const MIGS = 'C:/Users/ishay/Reg-In-copy-wt/supabase/migrations/'
export const L1_FILE = path.join(MIGS, '20260923180000_module11_l1_report_copy.sql')

// K1 patches — the same table as md5check.mjs (K1 edited these bodies after the j-files).
const K1 = {
  report_m02_exec_overview: [['order by revenue desc, project_id limit 8) t', 'order by revenue desc, project_id limit p_page_size offset (p_page - 1) * p_page_size) t']],
  report_m19_customers_overview: [
    ['v_out        jsonb;\nbegin', 'v_out        jsonb;\n  v_rank_total integer;\nbegin'],
    ['limit 8) t;', "limit p_page_size offset (p_page - 1) * p_page_size) t;\n\n  select count(distinct p.customer_id)::integer into v_rank_total\n    from public.projects p\n   where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')\n     and p.customer_id is not null\n     and p.final_event_date >= v_y_from\n     and p.final_event_date <= v_today\n     and (p_customer_id is null or p.customer_id = p_customer_id);"],
    ["'frozen_count', null,\n      'notes', v_notes,", "'frozen_count', null,\n      'row_total', v_rank_total,\n      'notes', v_notes,"],
  ],
  report_m07_finance_overview: [
    ['jsonb_array_elements(v_rows) e limit 4) s);', 'jsonb_array_elements(v_rows) e limit p_page_size offset (p_page - 1) * p_page_size) s);'],
    ["'open_invoice_count', v_open_n,\n      'asof', v_asof,", "'open_invoice_count', v_open_n,\n      'row_total', v_open_n,\n      'asof', v_asof,"],
  ],
}

export function preL1(fn) {
  const src = fs.readFileSync(path.join(MIGS, FILES[fn]), 'utf8').replace(/\r\n/g, '\n')
  const start = src.lastIndexOf(`create or replace function public.${fn}(`)
  if (start < 0) throw new Error(`no body for ${fn}`)
  const open = src.indexOf('$function$', start)
  let body = src.slice(open + 10, src.indexOf('$function$', open + 10))
  for (const [a, b] of K1[fn] ?? []) body = body.replace(a, () => b)
  return body
}

/** Apply every `v_def := replace(v_def, $oN$…$oN$, $nN$…$nN$)` of `fn`'s DO block in a migration file. */
export function applyMigrationFile(file, fn, body) {
  const mig = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const block = mig.match(new RegExp(`-- ═══ ${fn} — \\d+ replacements ═══\\n([\\s\\S]*?)\\nend \\$m11\\$;`))
  if (!block) return body
  const re = /v_def := replace\(v_def, \$o(\d+)\$([\s\S]*?)\$o\1\$, \$n\1\$([\s\S]*?)\$n\1\$\);/g
  for (const m of block[1].matchAll(re)) {
    if (!body.includes(m[2])) throw new Error(`${fn} #${m[1]}: old span not in body`)
    body = body.split(m[2]).join(m[3])
  }
  return body
}

export const postL1 = (fn) => applyMigrationFile(L1_FILE, fn, preL1(fn))
// ✏️ 23/09/2026 — L2 applied (md5 16/16 == `expect-md5.mjs l2`); a third round builds on this.
export const L2_FILE = path.join(MIGS, '20260923200000_module11_l2_tile_copy.sql')
export const postL2 = (fn) => applyMigrationFile(L2_FILE, fn, postL1(fn))
export const md5 = (s) => crypto.createHash('md5').update(s, 'utf8').digest('hex')
