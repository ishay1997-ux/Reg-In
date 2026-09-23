// grep-live.mjs — search the LIVE (post-L1) body of report functions and print context.
// usage: node grep-live.mjs <fn|all> <needle> [linesAfter=4]
// Also prints md5 of each searched body, to compare against `select md5(prosrc)` from the DB.
import { postL1, md5 } from '../bodies.mjs'
import { FILES } from '../ops.mjs'

const [target, needle, after = '4'] = process.argv.slice(2)
const fns = target === 'all' ? Object.keys(FILES) : [target]
for (const fn of fns) {
  const body = postL1(fn)
  const lines = body.split('\n')
  lines.forEach((line, i) => {
    if (!needle || !line.includes(needle)) return
    console.log(`--- ${fn}:${i + 1}`)
    for (let k = Math.max(0, i - 1); k <= Math.min(lines.length - 1, i + Number(after)); k++) console.log(`${k + 1}| ${lines[k]}`)
  })
  if (!needle) console.log(fn, md5(body))
}
