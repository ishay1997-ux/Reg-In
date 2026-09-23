// md5check.mjs — does the file body (prosrc) equal the live one? K1 patches applied locally for m02/m07/m19.
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { FILES } from './ops.mjs'
const LIVE = {
  report_m02_exec_overview: 'ed80dd3215b3be0c8c1a97978b59971e',
  report_m07_finance_overview: 'fdc1dd946be27a50532db35679348372',
  report_m08_profitability: 'b085053262bdf121a53cd4e63b2ff3cf',
  report_m09_aging: 'e1f296d8b450fc16b663ae724479b587',
  report_m12_equipment: '3d91d4180b6daa7b5b3c3a6f122f38cf',
  report_m14_hostess_overview: '03938d09833d57faee24cb5e9f4ec424',
  report_m15_reliability: 'eaff4bacfc2ab9e428a96f7b6e37c7a7',
  report_m16_quality_cost: '98448331baba42cb58c2eb5abd8f701f',
  report_m17_fairness: '035c10c16c126fc400a1f601457e81a1',
  report_m19_customers_overview: 'c3f780e293e7b985950dc141dc30de95',
  report_m20_satisfaction: '9d9414572c71343c448213b5e24582cb',
  report_m21_drifting: 'daed420b9b58ee3ee22677bd5192d4c7',
  report_m22_notes: 'bea5231289d128d3bc80465033e7d80a',
}
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
for (const [fn, file] of Object.entries(FILES)) {
  const src = fs.readFileSync(path.join('C:/Users/ishay/Reg-In-copy-wt/supabase/migrations/', file), 'utf8').replace(/\r\n/g, '\n')
  const start = src.lastIndexOf(`create or replace function public.${fn}(`)
  const open = src.indexOf('$function$', start)
  let body = src.slice(open + 10, src.indexOf('$function$', open + 10))
  for (const [a, b] of K1[fn] ?? []) body = body.replace(a, () => b)
  const md5 = crypto.createHash('md5').update(body, 'utf8').digest('hex')
  console.log(md5 === LIVE[fn] ? 'SAME' : 'DIFF', fn, body.length)
}
