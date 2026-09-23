// apply-hints.mjs <copy file> <json map> [--ltr]
// Replaces the `guided` value of each key; fails loudly on a miss. With --ltr, isolate
// characters (U+2066 x U+2069) in the new text become ${ltr('x')} and the value is a template literal.
import fs from 'fs'
const [file, mapFile, flag] = process.argv.slice(2)
let src = fs.readFileSync(file, 'utf8')
const map = JSON.parse(fs.readFileSync(mapFile, 'utf8').replace(/^﻿/, ''))
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const LRI = '⁦'
const PDI = '⁩'
let n = 0
for (const [key, raw] of Object.entries(map)) {
  const visible = raw.split(LRI).join('').split(PDI).join('')
  if (visible.length > 220) throw new Error(`${key}: ${visible.length} > 220`)
  let text = raw
  let q = raw.includes("'") ? '"' : "'"
  if (flag === '--ltr' && raw.includes(LRI)) {
    text = raw.replace(new RegExp(`${LRI}([^${PDI}]*)${PDI}`, 'g'), (_, x) => `\${ltr('${x}')}`)
    q = '`'
  }
  const re = new RegExp(`('${esc(key)}': \\{\\s*guided:\\s*)(['"\`])((?:\\\\.|(?!\\2)[\\s\\S])*?)\\2,`)
  if (!re.test(src)) throw new Error(`key not found: ${key}`)
  src = src.replace(re, (_, head) => `${head}${q}${text}${q},`)
  n++
  console.log(key, visible.length)
}
fs.writeFileSync(file, src)
console.log('replaced', n)
