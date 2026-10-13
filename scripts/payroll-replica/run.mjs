// REG-IN · payroll replica runner (contract §6 + §9.1: PGlite, PostgreSQL 17.5, no Docker).
//
//   node scripts/payroll-replica/run.mjs <tests-dir> [<tests-dir> …] [--only <substring>]
//
// Builds one fresh in-memory database, in this order:
//   1. bootstrap.sql        — roles, default privileges, extensions, auth/storage stubs
//   2. live-schema.sql      — the live payroll-relevant tables (catalog export, 13.10.2026)
//   3. live-functions.sql   — live function bodies, triggers, policies, ACLs
//   4. reference-data.sql   — roles, modules, permissions, params
//   5. every supabase/migrations/*_module8_payroll_*.sql, in file-name order; B's migration 7
//      is replaced by stubs/…stub_review_tables.sql only while it is missing
//   6. stubs/assert_ready_locked.stub.sql — only if B's function is still missing
//   7. test-helpers.sql
// then snapshots that state and runs every *.sql test file on its own copy, so files never
// share state. Inside a file, each `-- test: <name>` block is its own transaction (see
// splitChecks). A check fails by raising (e.g. `assert`). Exit code 0 only if all pass.
//
// A test file may contain `-- @include-migration <file-name>`; the runner splices that
// migration's text in at that point (used to re-run a data-fix migration on a fixture).

import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '..', '..')
const migrationsDir = join(repo, 'supabase', 'migrations')

const read = (p) => readFileSync(p, 'utf8')

function payrollMigrations() {
  const files = readdirSync(migrationsDir)
    .filter((f) => /_module8_payroll_.*\.sql$/.test(f))
    .map((f) => join(migrationsDir, f))
  const hasReviewTables = files.some((f) => f.endsWith('_module8_payroll_review_tables.sql'))
  if (!hasReviewTables) files.push(join(here, 'stubs', '20261014000700_stub_review_tables.sql'))
  return files.sort((a, b) => basename(a).localeCompare(basename(b)))
}

function describe(error) {
  const parts = [error.message]
  if (error.detail) parts.push(`detail: ${error.detail}`)
  if (error.hint) parts.push(`hint: ${error.hint}`)
  if (error.where) parts.push(`where: ${error.where}`)
  return parts.join('\n    ')
}

async function execStep(db, label, sql) {
  try {
    await db.exec(sql)
  } catch (error) {
    throw new Error(`[replica] ${label} failed:\n    ${describe(error)}`, { cause: error })
  }
}

export async function buildReplica({ log = () => {} } = {}) {
  const db = new PGlite({ extensions: { pgcrypto } })
  await execStep(db, 'bootstrap.sql', read(join(here, 'bootstrap.sql')))
  await execStep(db, 'live-schema.sql', read(join(here, 'live-schema.sql')))
  await execStep(db, 'live-functions.sql', read(join(here, 'live-functions.sql')))
  await execStep(db, 'reference-data.sql', read(join(here, 'reference-data.sql')))
  for (const file of payrollMigrations()) {
    log(`  migration ${basename(file)}`)
    await execStep(db, basename(file), read(file))
  }
  const { rows } = await db.query(
    "select to_regprocedure('public._payroll_review_assert_ready_locked(bigint,text,uuid)') is null as missing",
  )
  if (rows[0].missing) {
    log('  stub _payroll_review_assert_ready_locked (B function not present)')
    await execStep(
      db,
      'assert_ready_locked.stub.sql',
      read(join(here, 'stubs', 'assert_ready_locked.stub.sql')),
    )
  }
  await execStep(db, 'test-helpers.sql', read(join(here, 'test-helpers.sql')))
  return db
}

function expandIncludes(sql) {
  return sql.replace(/^--\s*@include-migration\s+(\S+)\s*$/gm, (_, name) => {
    const path = join(migrationsDir, name)
    if (!existsSync(path)) throw new Error(`@include-migration: ${name} not found`)
    return read(path)
  })
}

// Each `-- test: <name>` line starts a check that runs as its own statement batch, i.e. its
// own transaction: transaction-local settings (role, JWT claims, the payroll writer flag)
// never leak from one check into the next, while committed fixture rows do carry over.
function splitChecks(sql) {
  const chunks = []
  let current = { name: '(setup)', lines: [] }
  for (const line of sql.split('\n')) {
    const m = line.match(/^--\s*test:\s*(.+)$/)
    if (m) {
      chunks.push(current)
      current = { name: m[1].trim(), lines: [] }
    }
    current.lines.push(line)
  }
  chunks.push(current)
  return chunks
    .map((c) => ({ name: c.name, sql: c.lines.join('\n') }))
    .filter((c) => c.sql.replace(/--.*$/gm, '').trim() !== '')
}

function collectTests(args) {
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
  const dirs = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--only')
  const files = []
  for (const d of dirs) {
    const abs = resolve(process.cwd(), d)
    if (statSync(abs).isFile()) files.push(abs)
    else for (const f of readdirSync(abs).sort()) if (f.endsWith('.sql')) files.push(join(abs, f))
  }
  return only ? files.filter((f) => basename(f).includes(only)) : files
}

async function main() {
  const args = process.argv.slice(2)
  const tests = collectTests(args)
  if (tests.length === 0) {
    console.error('usage: node scripts/payroll-replica/run.mjs <tests-dir> [--only <substring>]')
    process.exit(2)
  }
  const started = Date.now()
  console.log('building replica…')
  const base = await buildReplica({ log: (m) => console.log(m) })
  const image = await base.dumpDataDir('none')
  await base.close()
  console.log(`replica ready in ${((Date.now() - started) / 1000).toFixed(1)}s`)

  let failed = 0
  for (const file of tests) {
    const db = new PGlite({ extensions: { pgcrypto }, loadDataDir: image })
    const t0 = Date.now()
    const chunks = splitChecks(expandIncludes(read(file)))
    let current = '(setup)'
    try {
      for (const chunk of chunks) {
        current = chunk.name
        await db.exec(chunk.sql)
      }
      const n = chunks.filter((c) => c.name !== '(setup)').length
      console.log(`  ✔ ${basename(file)}  (${n} checks, ${Date.now() - t0} ms)`)
    } catch (error) {
      failed += 1
      console.log(`  ✘ ${basename(file)} — ${current}\n    ${describe(error)}`)
    } finally {
      await db.close()
    }
  }
  console.log(`\n${tests.length - failed}/${tests.length} test files passed`)
  process.exit(failed ? 1 : 0)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
