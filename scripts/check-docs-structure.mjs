#!/usr/bin/env node
/**
 * check:docs-structure — שתי בדיקות-מבנה על מסמכי-העבודה:
 *   (א) כותרות-פרק כפולות או מחוץ-לסדר.
 *   (ב) ספירת-משטחים בכותב שני (ר' ההערה שליד SURFACE_COUNT למטה).
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
// ⚠️ `\.(?!\d)` ולא `.` סתם — נקודה מותרת רק כשהיא סוף-מספר-פרק (`## 3. שם`), לא כשהיא מפרידה
// תת-סעיף (`## 3.1`). עד 07/08/2026 הנקודה הייתה בתוך [\s·.)] והבודק חילץ `3` גם מ-`## 3.1` וגם
// מ-`## 3.2` ⇒ דיווח "כותרת כפולה §3" על שני תת-סעיפים תקינים לגמרי (נמדד על discovery-log.md).
// 🔑 אותה מחלקת-שווא בדיוק שכבר תועדה כאן ב-1.6 של תוכנית-השבועיים: "בדיקה שמייצרת ממצאי-שווא
// היא בדיקה שמכבים — וזה גרוע מלא לבנות אותה, כי אחרי הכיבוי נשאר הרושם שהיא קיימת".
const HEADING = /^## (\d+)(?=[\s·)]|\.(?!\d)|$)/

/**
 * (ב) ספירת-המשטחים של ה-Discovery — כותב אחד בלבד.
 *
 * למה זה קיים: `N מתוך 8 סגורים` חי ב-06/08/2026 בשלושה קבצים **וכבר סתר את עצמו** —
 * `discovery_lessons.md` אמר "3 סגורים" בעוד `screens-approved.md` אמר "4 מתוך 8".
 * הספירה חיה מעכשיו בטבלה אחת, וכל השאר מקשר אליה.
 *
 * 🔴 ולמה הבדיקה דורשת גם מילת-סגירה באותה שורה, ולא רק את צורת-המספר: `מסך 4 מתוך 8`
 * הוא **סידורי** ("מסך מספר 4 מתוך שמונה") ולא ספירת-התקדמות — אותה צורה בדיוק, משמעות
 * הפוכה. נמדד: הניסוח בלי מילת-הסגירה החזיר **14 ממצאים שמתוכם 4 אמיתיים** — הוא נפל על
 * `8/8 ירוק` (בדיקות E2E), על `6/8` ו-`2/3/8` (זוגות מספרי-מודול), ועל שתי שורות-העצירה
 * שבכרטיסים המאושרים. בדיקה עם 71% ממצאי-שווא היא בדיקה שמכבים.
 */
// 🔴 חודד 26/08/2026: `(?<!מ)` חוסם את **תג-המודול** (`מ3/8` = "מודולים 3 ו-8"), שאינו
// ספירת-משטחים. ההערה למעלה כבר תיעדה שזוגות-מספרי-מודול הם מחלקת-שווא ידועה — ומילת-הסגירה
// לבדה לא סגרה אותה: תגית-סטטוס בדיסקברי נראית `סגור·לוגיקה·מ3/8`, כלומר גם זוג-מודולים וגם
// המילה "סגור" באותה שורה. נמדד באותו יום: **3 ממצאים בקבצים הנסרקים, ו-3 מהם שווא (100%)** —
// בדיוק המצב שההערה למעלה מגדירה כ"בדיקה שמכבים". 🔑 והחידוד אינו מחליש: `8/8` (השורה
// שהבדיקה נולדה בגללה), `4 מתוך 8` ו-`3/8 נסגרו` ממשיכים להיתפס — נבדקו אחד-אחד.
const SURFACE_COUNT = /(?<!מ)(?<!מודול )(?<!מודולים )\d+\s*(?:מתוך|מ-|\/)\s*8\b/
const CLOSED_WORD = /סגור|נסגר/
const COUNT_SSOT_FILE = 'docs/specs/module_04_hostesses/screens-approved.md'
const COUNT_SSOT_SECTION = 'מצב'
const ANY_HEADING = /^##\s+(.+?)\s*$/
// סימני-כיווניות (RLM/LRM/embedding) אינם רווח ולכן שורדים trim — ומזייפים אי-התאמה בשם-פרק.
const BIDI_MARKS = /[‎‏‪-‮⁦-⁩]/g

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
  let section = '' // שם-הפרק הנוכחי, לצורך היתר-ה-SSOT של ספירת-המשטחים

  text.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1

    const headingMatch = ANY_HEADING.exec(line)
    if (headingMatch) section = headingMatch[1].replace(BIDI_MARKS, '').trim()

    // (ב) ספירת-משטחים — רצה על כל שורה, ולכן לפני היציאה-המוקדמת של בדיקת-הפרקים.
    if (SURFACE_COUNT.test(line) && CLOSED_WORD.test(line)) {
      const isSsot = path === COUNT_SSOT_FILE && section === COUNT_SSOT_SECTION
      if (!isSsot) {
        findings.push(
          `${path}:${lineNumber} — ספירת-משטחים בכותב שני. ה-SSOT היחיד הוא טבלת "## ${COUNT_SSOT_SECTION}" ב-${COUNT_SSOT_FILE} — כאן צריך מצביע, לא מספר`,
        )
      }
    }

    const match = HEADING.exec(line)
    if (!match) return
    const chapter = Number(match[1])

    if (seen.has(chapter)) {
      findings.push(
        `${path}:${lineNumber} — כותרת כפולה §${chapter} (הראשונה בשורה ${seen.get(chapter)})`,
      )
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
    files.map(async (path) =>
      auditFile(
        relative(ROOT, path).replaceAll('\\', '/'),
        await readFile(join(ROOT, path), 'utf8'),
      ),
    ),
  )
).flat()

if (findings.length === 0) {
  console.log(`check:docs-structure ✅ ${files.length} קבצים נסרקו, אפס ממצאים`)
  process.exit(0)
}

console.error(`check:docs-structure ❌ ${findings.length} ממצאים ב-${files.length} קבצים:`)
for (const finding of findings) console.error(`  · ${finding}`)
process.exit(1)
