#!/usr/bin/env node
/**
 * check:docs-structure — כותרות-פרק כפולות או מחוץ-לסדר במסמכי-העבודה.
 *
 * למה זה קיים: קובץ שהגיע ל-15 פרקים במספור `0·1·2·…·4א·4ב·…·8·8·6` הוא מקור
 * שאי-אפשר להפנות אליו — ומצביע ל-§8 כשיש שניים הוא מצביע מת. הכשל הזה נתפס
 * חמש פעמים ב-06/08/2026, בכל הפעמים על-ידי ישי ואף פעם על-ידי בדיקה.
 *
 * 🔴 ולמה הוא סקריפט ולא קטע-בקובץ: הגרסה הראשונה חיה כבלוק ```bash בתוך
 * `discovery_lessons.md` — ולכן לא רצה מעולם. "הכלל נכתב" אינו "הכלל מוחל".
 *
 * ⚠️ ומלכודת שהפילה את הגרסה הראשונה: היא לא אִפסה מצב בין קבצים והחזירה
 * 12 ממצאי-שווא. לכן `seen` נבנה מחדש לכל קובץ, וזו בדיוק הבדיקה בסוף הקובץ.
 *
 * ריק = תקין. יציאה 1 = יש ממצאים.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SCAN = ['docs/guides', 'docs/specs']
const HEADING = /^## (\d+)(?=[\s·.)]|$)/

async function collectMarkdown(dir) {
  let entries
  try {
    entries = await readdir(join(ROOT, dir), { withFileTypes: true })
  } catch {
    return [] // תיקייה שאינה קיימת אינה שגיאה — פרויקט יכול לא להחזיק אותה
  }
  const files = []
  for (const entry of entries) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) files.push(...(await collectMarkdown(path)))
    else if (entry.name.endsWith('.md')) files.push(path)
  }
  return files
}

function auditFile(path, text) {
  const findings = []
  const seen = new Map() // ← נבנה מחדש לכל קובץ. זו המלכודת שהפילה את הגרסה הראשונה.
  let previous = -1

  text.split(/\r?\n/).forEach((line, index) => {
    const match = HEADING.exec(line)
    if (!match) return
    const chapter = Number(match[1])
    const lineNumber = index + 1

    if (seen.has(chapter)) {
      findings.push(`${path}:${lineNumber} — כותרת כפולה §${chapter} (הראשונה בשורה ${seen.get(chapter)})`)
    } else {
      seen.set(chapter, lineNumber)
    }
    if (chapter < previous) {
      findings.push(`${path}:${lineNumber} — §${chapter} מופיע אחרי §${previous}`)
    }
    previous = chapter
  })

  return findings
}

const files = (await Promise.all(SCAN.map(collectMarkdown))).flat()
const findings = (
  await Promise.all(
    files.map(async (path) => auditFile(relative(ROOT, path).replaceAll('\\', '/'), await readFile(join(ROOT, path), 'utf8')))
  )
).flat()

if (findings.length === 0) {
  console.log(`check:docs-structure ✅ ${files.length} קבצים נסרקו, אפס ממצאים`)
  process.exit(0)
}

console.error(`check:docs-structure ❌ ${findings.length} ממצאים ב-${files.length} קבצים:`)
for (const finding of findings) console.error(`  · ${finding}`)
process.exit(1)
