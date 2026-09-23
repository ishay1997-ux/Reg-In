// ctx-live.mjs <fn> <needle> [before] [after] — like ctx.mjs, but on the LIVE body (bodies.mjs postL4),
// which is what a later text round must match byte for byte (trap 39 in the typography handoff).
import { postL6 as postL4 } from '../bodies.mjs'
const [fn, needle, before = 200, after = 300] = process.argv.slice(2)
const body = postL4(fn)
let i = body.indexOf(needle)
if (i < 0) console.log('NOT FOUND')
while (i >= 0) {
  console.log('>>>>' + body.slice(Math.max(0, i - before), i + needle.length + Number(after)) + '<<<<\n')
  i = body.indexOf(needle, i + 1)
}
