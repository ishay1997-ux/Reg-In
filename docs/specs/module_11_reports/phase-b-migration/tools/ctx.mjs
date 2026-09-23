// ctx.mjs <fn> <needle> [before] [after] — prints the latest body text around each occurrence.
import fs from 'fs'
import path from 'path'
import { FILES } from './ops.mjs'
const [fn, needle, before = 300, after = 300] = process.argv.slice(2)
const src = fs
  .readFileSync(path.join('C:/Users/ishay/Reg-In-dash-wt/supabase/migrations/', FILES[fn]), 'utf8')
  .replace(/\r\n/g, '\n')
const start = src.lastIndexOf(`create or replace function public.${fn}(`)
const body = src.slice(start, src.indexOf('$function$;', start))
let i = body.indexOf(needle)
while (i >= 0) {
  console.log('>>>>' + body.slice(Math.max(0, i - before), i + needle.length + Number(after)) + '<<<<\n')
  i = body.indexOf(needle, i + 1)
}
