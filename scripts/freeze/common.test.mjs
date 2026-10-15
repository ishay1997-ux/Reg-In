// בדיקות לשכבה שנוגעת ברשת ובדיסק — הרשת ממוקה (vi.mock), הדיסק הוא תיקייה זמנית אמיתית.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./api.mjs', () => ({ sql: vi.fn() }))

const { sql } = await import('./api.mjs')
const { listSnapshotCandidates, readManifest, tableStats, verifyFiles } =
  await import('./common.mjs')
const { sha256 } = await import('./lib.mjs')

describe('tableStats', () => {
  beforeEach(() => {
    sql.mockReset()
  })
  it('מאחד טבלאות לקריאות של 15, וממפה n/h לשורות/md5', async () => {
    const keys = Object.fromEntries(
      Array.from({ length: 17 }, (_, i) => [`public.t${i}`, `"public"."t${i}"`]),
    )
    sql.mockImplementation(async (q) =>
      [...q.matchAll(/select '([^']+)' as k/g)].map((m) => ({ k: m[1], n: '4', h: 'abc' })),
    )
    const out = await tableStats(keys)
    expect(sql).toHaveBeenCalledTimes(2)
    expect(Object.keys(out)).toHaveLength(17)
    expect(out['public.t16']).toEqual({ rows: 4, md5: 'abc' })
  })
})

describe('צילומים על הדיסק', () => {
  let root
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'freeze-test-'))
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  function writeSnapshot(name, { withManifest = true, corrupt = false } = {}) {
    const dir = join(root, name)
    mkdirSync(join(dir, 'tables'), { recursive: true })
    const body = Buffer.from('{"a":1}\n')
    writeFileSync(join(dir, 'tables/public.x.jsonl'), corrupt ? 'changed' : body)
    if (withManifest) {
      const manifest = {
        createdAt: new Date().toISOString(),
        tables: { 'public.x': { file: 'tables/public.x.jsonl', sha256: sha256(body), rows: 1 } },
        storage: [],
      }
      writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest))
    }
    return dir
  }

  it('צילום שנקטע (בלי מניפסט) מזוהה כחסר-מניפסט; פגום — מזוהה בקבצים', () => {
    writeSnapshot('ok')
    writeSnapshot('partial', { withManifest: false })
    writeSnapshot('corrupt', { corrupt: true })
    const byName = Object.fromEntries(
      listSnapshotCandidates(root).map((c) => [c.dir.split(/[\\/]/).pop(), c]),
    )
    expect(byName.ok.missingFiles).toEqual([])
    expect(byName.partial.manifest).toBeNull()
    expect(byName.corrupt.missingFiles[0]).toContain('תוכן שונה')
  })

  it('verifyFiles מדווח על קובץ חסר', () => {
    const dir = writeSnapshot('gone')
    rmSync(join(dir, 'tables/public.x.jsonl'))
    expect(verifyFiles(dir, readManifest(dir))[0]).toContain('חסר')
  })

  it('תיקיית-שורש שאינה קיימת ⇒ אין מועמדים', () => {
    expect(listSnapshotCandidates(join(root, 'nope'))).toEqual([])
  })
})
