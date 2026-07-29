#!/usr/bin/env node
/**
 * check-context — בדיקת שלמות ארכיטקטורת-ההקשר.
 *
 * למה זה קיים (28/07/2026): פלאגינים מוגדרים פר-פרויקט ב-.claude/settings.json.
 * סקיל שמפעיל סוכן מפלאגין שכבוי **נכשל בשקט בזמן ריצה** — לא בזמן העריכה, אלא
 * חודש אחר כך כשמישהו יריץ אותו. זה קרה בפועל: 7 הפניות שבורות בבת-אחת.
 *
 * הבדיקה הייתה קודם פרוזה בתוך רוטינה, כלומר תלויה בכך שסשן יזכור להריץ אותה.
 * הדוקטרינה של Claude 5 אומרת: סקריפט דטרמיניסטי מנצח שיקול-דעת מילולי.
 * לכן — סקריפט. הוא שקט כשהכול תקין, ומדבר רק כשיש בעיה.
 *
 * שימוש:  npm run check:context      (יוצא 1 אם נמצאה בעיה)
 *          נקרא גם מה-SessionStart hook, שמדפיס רק אם משהו נשבר.
 *
 * קונבנציה שהבדיקה נשענת עליה: דיספאץ' **חי** נכתב `plugin-name:agent-name`.
 * הערה היסטורית על הפניה שהוסרה חייבת להימנע מצורת-הנקודתיים
 * (לכתוב "הסוכן `agent-name` של הפלאגין **plugin-name**") — אחרת פרוזה מתה
 * תיתפס כדיספאץ' שבור.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const problems = []
const notes = []

function read(p) {
  try {
    return readFileSync(join(ROOT, p), 'utf8')
  } catch {
    return null
  }
}

function walk(dir, out = []) {
  if (!existsSync(join(ROOT, dir))) return out
  for (const entry of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, entry)
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out)
    else if (entry.endsWith('.md')) out.push(rel)
  }
  return out
}

// ---------- קלט: מצב הפלאגינים ----------
const settingsRaw = read('.claude/settings.json')
if (!settingsRaw) {
  console.error('✖ .claude/settings.json לא נמצא — לא ניתן לבדוק.')
  process.exit(1)
}
let enabledPlugins
try {
  enabledPlugins = JSON.parse(settingsRaw).enabledPlugins ?? {}
} catch (e) {
  console.error(`✖ .claude/settings.json אינו JSON תקין: ${e.message}`)
  process.exit(1)
}
// "name@marketplace" → name
const pluginState = new Map(
  Object.entries(enabledPlugins).map(([k, v]) => [k.split('@')[0], v === true]),
)
if (pluginState.size === 0) {
  notes.push('אין enabledPlugins ב-.claude/settings.json — הפרויקט יורש את ההגדרה הגלובלית.')
}

// ---------- בדיקה 1: דיספאץ' לסוכן מפלאגין כבוי ----------
// חיפוש ממוקד לפי שמות-פלאגינים ידועים — לא regex גנרי, כדי לא לתפוס נקודתיים אקראיים.
const skillFiles = walk('.claude/skills')
for (const file of skillFiles) {
  const text = read(file)
  if (!text) continue
  for (const [plugin, enabled] of pluginState) {
    const re = new RegExp(
      `\\b${plugin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:([a-z][a-z0-9-]*)`,
      'g',
    )
    for (const m of text.matchAll(re)) {
      if (!enabled) {
        problems.push(
          `דיספאץ' שבור: ${relative('.', file)} מפעיל \`${plugin}:${m[1]}\` — הפלאגין ${plugin} כבוי ב-.claude/settings.json.\n` +
            `    ← או להדליק אותו, או להחליף את הדיספאץ' (ותיעוד היסטורי לא נכתב בצורת plugin:agent).`,
        )
      }
    }
  }
}

// ---------- בדיקה 2: docs/toolbox.md משקף את המצב בפועל ----------
const toolbox = read('docs/toolbox.md')
if (!toolbox) {
  problems.push('docs/toolbox.md חסר — הרשם של מה דלוק/כבוי ומתי להדליק.')
} else {
  const offIdx = toolbox.indexOf('כבויים ב-REG-IN')
  const endIdx = toolbox.indexOf('לא מושפעים')
  if (offIdx === -1) {
    notes.push('docs/toolbox.md: לא נמצאה כותרת "כבויים ב-REG-IN" — דילוג על בדיקת-הסנכרון.')
  } else {
    const onSection = toolbox.slice(0, offIdx)
    const offSection = toolbox.slice(offIdx, endIdx === -1 ? undefined : endIdx)
    for (const [plugin, enabled] of pluginState) {
      const inOn = onSection.includes(`\`${plugin}\``)
      const inOff = offSection.includes(`\`${plugin}\``)
      if (enabled && inOff && !inOn)
        problems.push(`toolbox.md מציג את ${plugin} כ**כבוי**, אבל הוא דלוק בפועל.`)
      if (!enabled && inOn && !inOff)
        problems.push(`toolbox.md מציג את ${plugin} כ**דלוק**, אבל הוא כבוי בפועל.`)
      if (!inOn && !inOff)
        notes.push(`${plugin} מוגדר ב-settings.json אך אינו מופיע ב-docs/toolbox.md.`)
    }
  }
}

// ---------- בדיקה 3: עץ ה-CLAUDE.md שלם ----------
// אלה הקבצים שמחזיקים את הפרוטוקולים המלאים. קובץ שנעלם = פרוטוקול שנעלם בשקט.
for (const f of ['CLAUDE.md', 'src/CLAUDE.md', 'docs/CLAUDE.md', 'supabase/migrations/CLAUDE.md']) {
  if (!existsSync(join(ROOT, f))) problems.push(`חסר בעץ ה-CLAUDE.md: ${f}`)
}
// שער ה-typed-echo הוא בלתי-הפיך — לוודא שהוא לא נעלם בעריכה
const dbProtocol = read('supabase/migrations/CLAUDE.md')
if (dbProtocol && !dbProtocol.includes('typed-echo')) {
  problems.push('שער ה-typed-echo נעלם מ-supabase/migrations/CLAUDE.md — זה שער בלתי-הפיך.')
}
// מודול בנוי בלי קובץ-מוקשים (module-close §4c מחייב)
if (existsSync(join(ROOT, 'src/modules'))) {
  for (const mod of readdirSync(join(ROOT, 'src/modules'))) {
    if (!statSync(join(ROOT, 'src/modules', mod)).isDirectory()) continue
    if (!existsSync(join(ROOT, 'src/modules', mod, 'CLAUDE.md')))
      problems.push(
        `src/modules/${mod}/ קיים בלי CLAUDE.md (מוקשי-המודול) — חובה לפי module-close §4c.`,
      )
  }
}

// ---------- פלט ----------
const quiet = process.argv.includes('--quiet')
if (problems.length === 0) {
  if (!quiet) {
    console.log('✓ ארכיטקטורת ההקשר תקינה.')
    console.log(
      `  ${[...pluginState.values()].filter(Boolean).length} פלאגינים דלוקים · ` +
        `${skillFiles.length} קובצי-סקיל נסרקו · עץ ה-CLAUDE.md שלם.`,
    )
    for (const n of notes) console.log(`  · ${n}`)
  }
  process.exit(0)
}

console.error('✖ בדיקת-ההקשר מצאה בעיות:')
for (const p of problems) console.error(`  • ${p}`)
for (const n of notes) console.error(`  · ${n}`)
console.error('  (הרצה ידנית: npm run check:context)')
process.exit(1)
