// 🔍 **בדיקת-חוזה לשלושת דוחות-ההחלטה — קוראת את קובצי-המיגרציה מהדיסק** (התוכנית §4ב, 24/09/2026).
//
// 🔑 **למה בדיקה על ה-SQL:** המחרוזות של דוח-מ11 (שורת-ה"אז מה", תוויות, הגדרות) נכתבות בתוך
// הפונקציה במסד, ואף שער לא קרא אותן עד היום — `check:report-copy` בודק רק את קובץ-הרמזים. כך כלל-ניסוח
// שנשען על זיכרון נכשל בשקט. כאן כל כלל נופל לבד: לשון-זכר, מספר לא-מבודד בתוך משפט עברי, שדה-שכר,
// שער-הרשאה שנשמט, סף-n שזז, או מדרגי-הנחה שסטו מהכרעה 39.
// הדפוס: `src/lib/exportSensitiveColumns.test.js` (סריקת מיגרציות מהדיסק).
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const DIR = path.resolve(process.cwd(), 'supabase/migrations')
const REPORTS = Object.freeze({
  'ה1 · סגירת הצעות': '20260924000000_module11_h1_quote_closing.sql',
  'ה2 · הנחה מול סגירה': '20260924002000_module11_h2_discount_vs_closing.sql',
  'ה3 · איכות אירועים': '20260924003000_module11_h3_event_quality.sql',
})

// הגוף של הפונקציה בלבד (בין שני ה-$function$) — הכותרת היא הערות, לא טקסט-מסך.
const bodyOf = (file) => {
  const sql = fs.readFileSync(path.join(DIR, file), 'utf8')
  const start = sql.indexOf('$function$')
  return sql.slice(start, sql.indexOf('$function$', start + 10))
}

// בלוק שורת-ההחלטה: מ-`v_so_what := case` עד ה-`end;` שסוגר אותו.
const soWhatOf = (body) => {
  const start = body.indexOf('v_so_what := case')
  return body.slice(start, body.indexOf('  end;', start))
}

// ליטרלים עבריים בתוך בלוק — מה שהמשתמשת קוראת.
const literals = (block) => [...block.matchAll(/'([^']*[א-ת][^']*)'/g)].map((m) => m[1])

// 🔤 ציווי/פנייה בזכר — `design-contract.md §3.6` (כל המשתמשות נשים) ו-`ui-copy-styleguide.md §1`.
const MASCULINE = /(^|\s)(שים|בדוק|פתח|התקשר|גבה|תן|שבץ|טפל|המשך|הרחב)(\s|$)/

describe.each(Object.entries(REPORTS))('%s — חוזה ה-SQL', (name, file) => {
  const body = bodyOf(file)
  const soWhat = soWhatOf(body)

  it('הקובץ והגוף נמצאו — אחרת הבדיקה עוברת על ריק', () => {
    expect(body.length).toBeGreaterThan(1000)
    expect(soWhat).toContain('when')
  })

  it('שער-ההרשאה נשמר (`כספים`, edit/view) ו-anon חסום במפורש', () => {
    expect(body).toContain("assert_module_permission('כספים', array['edit', 'view'])")
    const sql = fs.readFileSync(path.join(DIR, file), 'utf8')
    expect(sql).toMatch(
      /revoke execute on function public\.report_m0[346]_[a-z]+\([^)]*\) from public, anon;/,
    )
  })

  it('סף-n אחד לכל שלושת הדוחות: 20 (הכרעת שלב 1)', () => {
    expect(body).toContain('v_min_n constant integer := 20;')
  })

  it('שורת-ההחלטה נפתחת בשם-פועל, בלי לשון-זכר', () => {
    // פתיחת-משפט = הליטרל הראשון בכל ענף **עליון** של ה-case (הזחה של 4) — ענפים פנימיים
    // (' פגה' / ' פגו') הם אמצע-משפט.
    const openings = [...soWhat.matchAll(/\n {4}(?:when [^\n]*then|else)\s*'([^']+)'/g)].map(
      (m) => m[1],
    )
    expect(openings.length).toBeGreaterThan(1)
    for (const text of literals(soWhat)) expect(text, `לשון-זכר: ${text}`).not.toMatch(MASCULINE)
    for (const text of openings) {
      expect(text, `לא נפתח בשם-פועל: ${text}`).toMatch(/^(ל|אין )/)
      expect(text, `לשון-זכר: ${text}`).not.toMatch(MASCULINE)
    }
  })

  it('כל מספר שנשזר במשפט עברי מבודד (LRI…PDI) — אחרת הוא מתהפך בפסקת-RTL', () => {
    const numbersInSentence = [
      ...soWhat.matchAll(/(\|\|\s*)(to_char\(|v_[a-z_]+_n\b|v_[a-z_]*count\b)/g),
    ]
    for (const match of numbersInSentence) {
      const before = soWhat.slice(Math.max(0, match.index - 12), match.index + match[0].length)
      expect(before, `מספר לא-מבודד: ${before}`).toMatch(/v_lri\s*\|\|\s*(to_char\(|v_)/)
    }
  })
})

describe('🔒 ה3 — אגרגטים בלבד', () => {
  const body = bodyOf(REPORTS['ה3 · איכות אירועים'])

  it('אין בגוף שם-דיילת, טבלת-דיילות או תעריף', () => {
    expect(body).not.toMatch(/hourly_rate|public\.hostesses|first_name|last_name|hostess_name/)
  })
})

describe('ה2 — מדרגי-ההנחה הם בדיוק הכרעה 39', () => {
  const body = bodyOf(REPORTS['ה2 · הנחה מול סגירה'])

  it('0 · 1–5 · 6–10 · 10+, והגבול העליון שייך למדרג הנמוך (`<=`)', () => {
    expect(body).toContain("array['0', '1-5', '6-10', '10+']")
    expect(body).toContain(
      "case when d = 0 then '0' when d <= 5 then '1-5' when d <= 10 then '6-10' else '10+' end",
    )
  })

  it('חברות-הפקה מופרדות — שורת-ההחלטה נשענת על הלקוחות הישירים בלבד', () => {
    expect(body).toContain(
      "case when customer_type = 'production_company' then 'production' else 'direct' end",
    )
    expect(body).toMatch(/filter \(where grp = 'direct' and band = '10\+'\)/)
  })
})
