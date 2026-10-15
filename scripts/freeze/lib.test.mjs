import { describe, expect, it } from 'vitest'
import {
  KEEP,
  RESTORE_PHRASE,
  WIPE_PHRASE,
  buildInsertSql,
  canonicalStatsSql,
  checkConfirmation,
  chunkLines,
  compareStats,
  dollarTag,
  ident,
  lit,
  parseArgs,
  partitionTables,
  pickFreshSnapshot,
  snapshotStamp,
  storageRelPath,
  topoOrder,
} from './lib.mjs'

describe('checkConfirmation', () => {
  it('מקבל את המשפט המדויק, גם עם רווחים ו-BOM', () => {
    expect(checkConfirmation(WIPE_PHRASE, WIPE_PHRASE)).toBe(true)
    expect(checkConfirmation(`\uFEFF  ${WIPE_PHRASE}\r`, WIPE_PHRASE)).toBe(true)
  })
  it('דוחה משפט חלקי, משפט השחזור, וקלט ריק', () => {
    expect(checkConfirmation('מחק', WIPE_PHRASE)).toBe(false)
    expect(checkConfirmation(RESTORE_PHRASE, WIPE_PHRASE)).toBe(false)
    expect(checkConfirmation('', WIPE_PHRASE)).toBe(false)
    expect(checkConfirmation(undefined, WIPE_PHRASE)).toBe(false)
    expect(checkConfirmation('yes', WIPE_PHRASE)).toBe(false)
  })
})

describe('partitionTables', () => {
  it('מפריד לפי רשימת-השמירה ומדווח על שמירה שאין לה טבלה', () => {
    const r = partitionTables(['users', 'quotes', 'params', 'projects'], {
      users: 'x',
      params: 'y',
      ghost: 'z',
    })
    expect(r.wipe).toEqual(['projects', 'quotes'])
    expect(r.keep).toEqual(['params', 'users'])
    expect(r.missingKeep).toEqual(['ghost'])
  })
  it('כל שורה ברשימת-השמירה האמיתית נושאת סיבה', () => {
    for (const reason of Object.values(KEEP)) expect(reason.length).toBeGreaterThan(10)
    expect(KEEP.users).toBeTruthy()
    expect(KEEP.params).toBeTruthy()
  })
})

describe('topoOrder', () => {
  it('הורים לפני ילדים, ו-FK עצמי לא חוסם', () => {
    const order = topoOrder(
      ['assignments', 'projects', 'customers', 'quotes'],
      [
        { child: 'assignments', parent: 'projects' },
        { child: 'projects', parent: 'quotes' },
        { child: 'quotes', parent: 'customers' },
        { child: 'quotes', parent: 'quotes' },
        { child: 'projects', parent: 'users' }, // הורה מחוץ לסט — מתעלמים
      ],
    )
    expect(order).toEqual(['customers', 'quotes', 'projects', 'assignments'])
  })
  it('מעגל לא נתקע ולא מאבד טבלה', () => {
    const order = topoOrder(
      ['salary_reports', 'payroll_reviews', 'hostesses'],
      [
        { child: 'salary_reports', parent: 'payroll_reviews' },
        { child: 'payroll_reviews', parent: 'salary_reports' },
      ],
    )
    expect(order).toEqual(['hostesses', 'payroll_reviews', 'salary_reports'])
  })
})

describe('chunkLines', () => {
  it('מכבד תקרת שורות ותקרת בתים, ולא מאבד שורה', () => {
    const lines = Array.from({ length: 25 }, (_, i) => `{"id":${i}}`)
    const byRows = chunkLines(lines, { maxRows: 10, maxBytes: 1e9 })
    expect(byRows.map((c) => c.length)).toEqual([10, 10, 5])
    const byBytes = chunkLines(lines, { maxRows: 1e9, maxBytes: 40 })
    expect(byBytes.flat()).toEqual(lines)
    for (const c of byBytes) expect(c.join('\n').length).toBeLessThanOrEqual(40)
  })
  it('שורה גדולה מהתקרה עדיין נשלחת (לבד)', () => {
    expect(chunkLines(['x'.repeat(100)], { maxBytes: 10 })).toEqual([['x'.repeat(100)]])
  })
  it('קלט ריק ⇒ אין נתחים', () => {
    expect(chunkLines([])).toEqual([])
  })
})

describe('buildInsertSql', () => {
  it('replica + overriding + on conflict, עם תג שאינו בנתונים', () => {
    const q = buildInsertSql({
      target: '"public"."quotes"',
      sourceType: '"public"."quotes"',
      columns: ['quote_id', 'name'],
      hasIdentity: true,
      jsonLines: ['{"quote_id":1,"name":"a$b"}'],
      onConflictDoNothing: true,
      replica: true,
    })
    expect(q.startsWith('set local session_replication_role = replica;')).toBe(true)
    expect(q).toContain('("quote_id", "name") overriding system value')
    expect(q).toContain('json_populate_recordset(null::"public"."quotes"')
    expect(q.trim().endsWith('on conflict do nothing;')).toBe(true)
  })
  it('בלי identity ובלי replica — אין overriding ואין set local', () => {
    const q = buildInsertSql({
      target: 't',
      sourceType: 's',
      columns: ['a'],
      hasIdentity: false,
      jsonLines: ['{"a":1}'],
    })
    expect(q).not.toContain('overriding')
    expect(q).not.toContain('set local')
  })
})

describe('dollarTag', () => {
  it('מדלג על תג שמופיע בנתונים', () => {
    const seq = ['aaa', 'bbb']
    expect(dollarTag('x $fzaaa$ y', () => seq.shift())).toBe('$fzbbb$')
  })
  it('נכשל בקול כשאין תג פנוי', () => {
    expect(() => dollarTag('$fzaaa$', () => 'aaa')).toThrow()
  })
})

describe('compareStats', () => {
  it('מסווג OK / ROWS / MD5 / MISSING / EXTRA', () => {
    const rows = compareStats(
      {
        a: { rows: 1, md5: 'x' },
        b: { rows: 2, md5: 'y' },
        c: { rows: 3, md5: 'z' },
        d: { rows: 1 },
      },
      {
        a: { rows: 1, md5: 'x' },
        b: { rows: 3, md5: 'y' },
        c: { rows: 3, md5: 'Z' },
        e: { rows: 0 },
      },
    )
    expect(Object.fromEntries(rows.map((r) => [r.table, r.status]))).toEqual({
      a: 'OK',
      b: 'ROWS',
      c: 'MD5',
      d: 'MISSING',
      e: 'EXTRA',
    })
  })
  it('md5 null בצד המצופה = בדיקת מספר-שורות בלבד', () => {
    const [r] = compareStats({ a: { rows: 5, md5: null } }, { a: { rows: 5, md5: 'q' } })
    expect(r.status).toBe('OK')
  })
})

describe('pickFreshSnapshot', () => {
  const now = Date.parse('2026-10-15T12:00:00Z')
  const m = (iso) => ({ createdAt: iso, tables: {} })
  it('בוחר את הטרי ביותר התקף, ודוחה חלקי / ישן / פגום', () => {
    const { chosen, rejected } = pickFreshSnapshot(
      [
        { dir: 'partial', manifest: null },
        { dir: 'old', manifest: m('2026-10-14T11:00:00Z'), missingFiles: [] },
        { dir: 'broken', manifest: m('2026-10-15T11:30:00Z'), missingFiles: ['tables/x (חסר)'] },
        { dir: 'good-early', manifest: m('2026-10-15T08:00:00Z'), missingFiles: [] },
        { dir: 'good-late', manifest: m('2026-10-15T10:00:00Z'), missingFiles: [] },
      ],
      now,
    )
    expect(chosen.dir).toBe('good-late')
    expect(rejected.map((r) => r.dir)).toEqual(['partial', 'old', 'broken'])
  })
  it('תאריך בעתיד או לא-תקין — נדחה', () => {
    const { chosen } = pickFreshSnapshot(
      [
        { dir: 'future', manifest: m('2026-10-16T12:00:00Z'), missingFiles: [] },
        { dir: 'garbage', manifest: m('not a date'), missingFiles: [] },
      ],
      now,
    )
    expect(chosen).toBeNull()
  })
})

describe('storageRelPath', () => {
  it('ממפה שם עם תיקיות', () => {
    expect(storageRelPath('finance', 'payroll/2026-07/a.xlsx')).toBe(
      'storage/finance/payroll/2026-07/a.xlsx',
    )
  })
  it('דוחה ניסיון לצאת מהתיקייה', () => {
    expect(() => storageRelPath('finance', '../../evil')).toThrow()
    expect(() => storageRelPath('finance', 'a//b')).toThrow()
    expect(() => storageRelPath('finance', 'C:\\x')).toThrow()
  })
})

describe('שונות', () => {
  it('ident/lit מכפילים מרכאות', () => {
    expect(ident('a"b')).toBe('"a""b"')
    expect(lit("o'neil")).toBe("'o''neil'")
  })
  it('canonicalStatsSql — מיון לפי t::text', () => {
    expect(canonicalStatsSql('"public"."x"')).toContain('order by t::text')
  })
  it('snapshotStamp לפי שעון מקומי', () => {
    expect(snapshotStamp(new Date(2026, 9, 5, 7, 3))).toBe('20261005-0703')
  })
  it('parseArgs', () => {
    expect(parseArgs(['--dry-run', '--from=C:\\x\\y', 'junk'])).toEqual({
      'dry-run': true,
      from: 'C:\\x\\y',
    })
  })
})
