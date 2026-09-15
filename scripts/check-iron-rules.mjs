#!/usr/bin/env node
/**
 * check-iron-rules — every "iron rule N" the repo cites must resolve to a row
 * in the root CLAUDE.md index.
 *
 * WHY THIS EXISTS (15/09/2026). The iron rules are an interface: 400+ call sites
 * across the skills, the guides and the micro-guides address them by ORDINAL
 * ("iron rule 10", "כלל ברזל 13"). Nothing checked that the ordinal still landed
 * on anything. It failed exactly the way an unchecked pointer fails — silently:
 * a documentation rewrite replaced CLAUDE.md with a leaner tree, every rule
 * number stopped resolving, the build stayed green, and the breakage was found
 * by hand during a merge. A session that cannot find "iron rule 10" does not
 * error; it improvises, which is the one outcome the rules exist to prevent.
 *
 * The check is deliberately dumb: it does not judge whether a rule is good, only
 * whether the number a caller quotes can be looked up. That is the property the
 * 400 call sites actually depend on.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const INDEX_FILE = 'CLAUDE.md'

// Where callers live. docs/archive is history — a dead pointer there is a record
// of what was true then, not a defect now.
const SEARCH_DIRS = ['.claude/skills', 'docs', 'src', 'e2e', 'scripts']
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'archive', 'delete', 'coverage'])

const CITATION = /(?:iron rule|כלל[ ‑-]ברזל|כלל ברזל)\s*(\d{1,2})/gi
const INDEX_ROW = /^\|\s*\*\*(\d{1,2})\*\*\s*\|/gm

function walk(dir, out = []) {
  const abs = join(ROOT, dir)
  if (!existsSync(abs)) return out
  for (const entry of readdirSync(abs)) {
    if (SKIP_DIRS.has(entry)) continue
    const rel = join(dir, entry)
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out)
    else if (/\.(md|mjs|js|jsx|sh)$/.test(entry)) out.push(rel)
  }
  return out
}

const indexText = readFileSync(join(ROOT, INDEX_FILE), 'utf8')
const defined = new Set([...indexText.matchAll(INDEX_ROW)].map((m) => Number(m[1])))

if (defined.size === 0) {
  console.error(
    `check:iron-rules ❌ ${INDEX_FILE} carries no rules index at all.\n` +
      `   Expected rows shaped "| **N** | ... |". Without them every "iron rule N" in the repo is a dead pointer.`,
  )
  process.exit(1)
}

const missing = new Map() // rule number -> Set of citing files
for (const file of SEARCH_DIRS.flatMap((d) => walk(d))) {
  const text = readFileSync(join(ROOT, file), 'utf8')
  for (const m of text.matchAll(CITATION)) {
    const n = Number(m[1])
    if (defined.has(n)) continue
    if (!missing.has(n)) missing.set(n, new Set())
    missing.get(n).add(relative(ROOT, join(ROOT, file)).replaceAll('\\', '/'))
  }
}

if (missing.size > 0) {
  console.error(
    `check:iron-rules ❌ ${missing.size} rule number(s) are cited but not in the ${INDEX_FILE} index:\n`,
  )
  for (const [n, files] of [...missing].sort((a, b) => a[0] - b[0])) {
    const shown = [...files].slice(0, 4)
    console.error(
      `   כלל ${n} — cited in ${files.size} file(s): ${shown.join(' · ')}${files.size > shown.length ? ' …' : ''}`,
    )
  }
  console.error(
    `\n   Fix: add a row "| **N** | <name> | <where it lives> |" to ${INDEX_FILE}, or stop citing that number.\n` +
      `   A number with no row does not fail loudly at runtime — the session simply invents the rule.`,
  )
  process.exit(1)
}

console.log(
  `check:iron-rules ✅ ${defined.size} כללים באינדקס, וכל מספר שמצוטט בריפו נפתר (${[...defined].sort((a, b) => a - b).join(' · ')})`,
)
