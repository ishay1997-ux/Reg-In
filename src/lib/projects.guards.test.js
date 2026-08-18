// שלושת מבחני-האכיפה של מודול 6 — בדיקות-יחידה ולא סקריפטי-סורק, בכוונה:
// ‏CI מריץ רק את שבעת ה-npm scripts שלו, ו-`gate` (שבו הסורקים) אינו אחד מהם.
// ‏`test:run` הוא השער היחיד שנורה מעצמו. התבנית: אנלייזר טהור על מחרוזת-מקור,
// הקובץ האמיתי דרך fs, מקרה-אדום סינתטי שמוכיח שהשומר באמת נושך (דרישת-ישי 29/07),
// ו-throw אם המבנה שהשומר נשען עליו נעלם.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { PROJECT_STATUS_LABELS, resolveProjectTone } from '@/lib/projects'

// ── עזרי-סריקה טהורים (מיוצאים לוגית — נבדקים גם על מקור סינתטי) ──

// מוצא שורות שנושאות מחרוזת אסורה, בדילוג על שורות-הערה — הערה שמתעדת את האיסור
// אינה הפרה של האיסור.
export function findForbiddenLiteral(source, literal) {
  const violations = []
  source.split('\n').forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return
    if (line.includes(literal)) violations.push(i + 1)
  })
  return violations
}

function walkSourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkSourceFiles(full, out)
    } else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const SRC_ROOT = path.resolve(process.cwd(), 'src')

describe('שומר ① — תווית לא-ממופה מדוּוחת, לא נצבעת בשקט', () => {
  it('כל שמונה התוויות פותרות טון', () => {
    for (const label of Object.values(PROJECT_STATUS_LABELS)) {
      expect(() => resolveProjectTone(label)).not.toThrow()
    }
  })

  it('🔴 המקרה האדום: תווית זרה זורקת — כי StatusTag נופל ל-muted בלי שגיאה, וזה בלתי-נראה על המסך', () => {
    expect(() => resolveProjectTone('תווית שאינה קיימת')).toThrow(/תווית/)
  })
})

describe('שומר ② — המחרוזת "אירוע הסתיים" אסורה בקוד מודול 6 (⑲)', () => {
  const FORBIDDEN = 'אירוע הסתיים'

  it('המקרה האדום: האנלייזר תופס מקור סינתטי שמפר', () => {
    const bad = `const label = '${FORBIDDEN}'\n`
    expect(findForbiddenLiteral(bad, FORBIDDEN)).toEqual([1])
  })

  it('שורת-הערה שמתעדת את האיסור אינה נתפסת', () => {
    const ok = `// אסור לכתוב ${FORBIDDEN} בשום מקום\nconst x = 1\n`
    expect(findForbiddenLiteral(ok, FORBIDDEN)).toEqual([])
  })

  it('הקוד האמיתי נקי: src/lib/projects.js + src/modules/06_projects/** אם קיים', () => {
    // המבנה שהשומר נשען עליו: projects.js חייב להתקיים — אם נעלם, השומר חסר-משמעות.
    const libFile = path.join(SRC_ROOT, 'lib', 'projects.js')
    if (!fs.existsSync(libFile))
      throw new Error('src/lib/projects.js אינו קיים — השומר איבד את מושאו')

    const targets = [libFile]
    const moduleDir = path.join(SRC_ROOT, 'modules', '06_projects')
    if (fs.existsSync(moduleDir)) targets.push(...walkSourceFiles(moduleDir))

    const violations = targets.flatMap((file) =>
      findForbiddenLiteral(fs.readFileSync(file, 'utf8'), FORBIDDEN).map(
        (line) => `${path.relative(SRC_ROOT, file)}:${line}`,
      ),
    )
    expect(violations).toEqual([])
  })
})

describe('שומר ③ — OPEN_PROJECT_STATUSES לא ישרוד כהגדרה כפולה (⑫ · צעד 2.6)', () => {
  const IDENTIFIER = 'OPEN_PROJECT_STATUSES'
  // עד צעד 2.6 ההגדרה הישנה חיה כדין במודול 4; צעד 2.6 מרוקן את הרשימה הזאת —
  // ואז כל הישרדות של המזהה ב-src/ מפילה את הבדיקה.
  const ALLOWED_UNTIL_STEP_2_6 = new Set([path.join('modules', '04_hostesses', 'api.js')])

  it('המקרה האדום: האנלייזר תופס מקור סינתטי שמפר', () => {
    expect(findForbiddenLiteral(`const ${IDENTIFIER} = []\n`, IDENTIFIER)).toEqual([1])
  })

  it('אין מופע של המזהה מחוץ לרשימת-ההיתר', () => {
    if (!fs.existsSync(SRC_ROOT)) throw new Error('src/ אינו קיים — מבנה הפרויקט השתנה')

    const violations = walkSourceFiles(SRC_ROOT)
      .filter((file) => !ALLOWED_UNTIL_STEP_2_6.has(path.relative(SRC_ROOT, file)))
      .flatMap((file) =>
        findForbiddenLiteral(fs.readFileSync(file, 'utf8'), IDENTIFIER).map(
          (line) => `${path.relative(SRC_ROOT, file)}:${line}`,
        ),
      )
    expect(violations).toEqual([])
  })
})
