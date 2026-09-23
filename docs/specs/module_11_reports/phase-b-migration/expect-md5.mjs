// expect-md5.mjs — the md5(prosrc) each function MUST have after a text migration is applied,
// computed from the migration FILE itself (its own replace pairs) on top of the live base.
// usage: node expect-md5.mjs l1   → pre-L1 base + L1 file
//        node expect-md5.mjs l2   → post-L1 base + L2 file
// After applying, compare with: select proname, md5(prosrc) from pg_proc … where proname like 'report_m%'.
// A mismatch means the text that reached the DB is not the file (e.g. a transcription slip).
import path from 'path'
import { FILES } from './ops.mjs'
import { preL1, postL1, postL2, postL3, postL4, postL5, applyMigrationFile, L1_FILE, L4_FILE, md5 } from './bodies.mjs'

const MIGS = 'C:/Users/ishay/Reg-In-dash-wt/supabase/migrations/'
const ROUNDS = {
  l1: { file: L1_FILE, base: preL1 },
  l2: { file: path.join(MIGS, '20260923200000_module11_l2_tile_copy.sql'), base: postL1 },
  l3: { file: path.join(MIGS, '20260923210000_module11_l3_compare_notes.sql'), base: postL2 },
  l4: { file: L4_FILE, base: postL3 },
  l5: { file: path.join(MIGS, '20260923230000_module11_l5_card_standard_copy.sql'), base: postL4 },
  l6: { file: path.join(MIGS, '20260923233000_module11_l6_card_lines.sql'), base: postL5 },
}
const round = ROUNDS[process.argv[2] ?? 'l2']
for (const fn of Object.keys(FILES)) {
  const before = round.base(fn)
  const after = applyMigrationFile(round.file, fn, before)
  console.log(fn, md5(after), after === before ? '(unchanged)' : '')
}
