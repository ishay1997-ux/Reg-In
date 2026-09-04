/**
 * scripts/enrich-feedback-reasons.mjs
 *
 * העשרת נתוני המשוב בטגלים ריאליסטיים עבור הפרויקטים הקיימים במסד.
 * מתבסס על מודל התפלגות אקדמי (CSAT / Root Cause Analysis) וסנכרון חכם להערות מלל.
 */

import dotenv from 'dotenv'
import { createRng, hashSeed } from './seed-lib/prng.mjs'

dotenv.config({ path: '.env.local' })

const POSITIVE_POOL = [
  'מקצועיות הדיילות',
  'עמידה בזמנים',
  'איכות תגים וציוד',
  'ניהול ותקשורת',
  'אחר',
]

const NEGATIVE_POOL = [
  'איחור דיילות',
  'תפקוד דיילות',
  'איכות תגים',
  'ניהול לקוי',
  'אחר',
]

async function executeSql(query) {
  const url = process.env.VITE_SUPABASE_URL
  const projectRef = url.match(/https:\/\/(.*?)\.supabase\.co/)[1]
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error('חסר SUPABASE_ACCESS_TOKEN ב-.env.local')

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`שגיאת SQL Management API (${res.status}): ${text}`)
  }
  return res.json()
}

function matchPositiveFromNotes(notes) {
  if (!notes) return []
  const matches = []
  const n = notes.toLowerCase()
  if (n.includes('מוקדם') || n.includes('בזמן') || n.includes('האורחים')) matches.push('עמידה בזמנים')
  if (n.includes('דיילות') || n.includes('מקצועי') || n.includes('אדיב') || n.includes('צוות') || n.includes('הרישום')) {
    matches.push('מקצועיות הדיילות')
  }
  if (n.includes('תגים') || n.includes('ציוד') || n.includes('סרטים')) matches.push('איכות תגים וציוד')
  if (n.includes('שירות') || n.includes('תקשורת') || n.includes('מענה') || n.includes('נשמח לעבוד')) {
    matches.push('ניהול ותקשורת')
  }
  return matches
}

function matchNegativeFromNotes(notes) {
  if (!notes) return []
  const matches = []
  const n = notes.toLowerCase()
  if (n.includes('איחרו') || n.includes('איחור') || n.includes('התעכבה') || n.includes('עיכוב')) matches.push('איחור דיילות')
  if (n.includes('תגים') || n.includes('מוזמנים') || n.includes('טעות') || n.includes('שמות')) matches.push('איכות תגים')
  if (n.includes('ניהל') || n.includes('מנהל') || n.includes('בלגן')) matches.push('ניהול לקוי')
  if (n.includes('תפקוד') || n.includes('יחס') || n.includes('צוות') || n.includes('התנהגות')) matches.push('תפקוד דיילות')
  return matches
}

function escapeSqlArray(arr) {
  if (!arr || arr.length === 0) return "'{}'::text[]"
  const escaped = arr.map((item) => `'${item.replace(/'/g, "''")}'`).join(', ')
  return `ARRAY[${escaped}]::text[]`
}

function escapeSqlString(str) {
  if (!str) return 'null'
  return `'${str.replace(/'/g, "''")}'`
}

async function main() {
  console.log('--- התחלת העשרת נתוני משוב (Feedback Reasons Enrichment) ---')

  // 1. קריאת כל הפרויקטים שהושלם בהם משוב
  const selectQuery = `
    SELECT project_id, feedback_score, feedback_notes, negative_feedback_reason, negative_feedback_reasons, positive_feedback_reason, positive_feedback_reasons
    FROM public.projects
    WHERE feedback_status = 'completed'
    ORDER BY project_id ASC;
  `
  const projects = await executeSql(selectQuery)
  console.log(`נטענו ${projects.length} פרויקטים עם משוב שהושלם.`)

  const updates = []
  const stats = {
    total: projects.length,
    byScore: {},
    posCounts: { '0': 0, '1': 0, '2': 0, '3+': 0 },
    negCounts: { '1': 0, '2': 0, '3+': 0 },
    posReasonsFreq: {},
    negReasonsFreq: {},
  }

  for (const p of projects) {
    const score = p.feedback_score
    stats.byScore[score] = (stats.byScore[score] || 0) + 1
    const rng = createRng(hashSeed(`enrich-feedback-${p.project_id}`))

    let finalPos = []
    let finalNeg = []

    if (score >= 4) {
      // הדגשים לשימור
      const noteMatches = matchPositiveFromNotes(p.feedback_notes)
      let targetCount = 0

      if (score === 5) {
        // מודל ציון 5: 15% ללא תגיות, 50% תגית 1-2, 35% תגיות 2-3
        targetCount = rng.weighted([
          { weight: noteMatches.length > 0 ? 0.05 : 0.15, value: 0 },
          { weight: 0.35, value: 1 },
          { weight: 0.35, value: 2 },
          { weight: 0.15, value: 3 },
        ])
      } else {
        // מודל ציון 4: 25% ללא תגיות, 60% תגית 1, 15% תגית 2
        targetCount = rng.weighted([
          { weight: noteMatches.length > 0 ? 0.1 : 0.25, value: 0 },
          { weight: 0.6, value: 1 },
          { weight: 0.15, value: 2 },
        ])
      }

      if (targetCount > 0) {
        const picked = new Set(noteMatches.slice(0, targetCount))
        // שילוב משוקלל מהפול
        const weightedPool = [
          { weight: 35, value: 'מקצועיות הדיילות' },
          { weight: 30, value: 'עמידה בזמנים' },
          { weight: 15, value: 'איכות תגים וציוד' },
          { weight: 15, value: 'ניהול ותקשורת' },
          { weight: 5, value: 'אחר' },
        ]

        while (picked.size < targetCount) {
          const item = rng.weighted(weightedPool)
          picked.add(item)
        }
        finalPos = Array.from(picked)
      }

      const countKey = finalPos.length >= 3 ? '3+' : String(finalPos.length)
      stats.posCounts[countKey] = (stats.posCounts[countKey] || 0) + 1
      for (const r of finalPos) {
        stats.posReasonsFreq[r] = (stats.posReasonsFreq[r] || 0) + 1
      }
    } else if (score !== null && score <= 3) {
      // סיבות לבירור — שער נעילה: חובה לפחות סיבה אחת!
      const noteMatches = matchNegativeFromNotes(p.feedback_notes)
      const existing = p.negative_feedback_reason || p.negative_feedback_reasons?.[0]
      const initial = new Set()
      if (existing && NEGATIVE_POOL.includes(existing)) initial.add(existing)
      for (const m of noteMatches) initial.add(m)

      const targetCount = rng.weighted([
        { weight: 0.6, value: 1 },
        { weight: 0.3, value: 2 },
        { weight: 0.1, value: 3 },
      ])

      const weightedNegPool = [
        { weight: 35, value: 'איחור דיילות' },
        { weight: 25, value: 'תפקוד דיילות' },
        { weight: 20, value: 'איכות תגים' },
        { weight: 15, value: 'ניהול לקוי' },
        { weight: 5, value: 'אחר' },
      ]

      while (initial.size < Math.max(1, targetCount)) {
        const item = rng.weighted(weightedNegPool)
        initial.add(item)
      }

      finalNeg = Array.from(initial).slice(0, Math.max(1, targetCount))
      const countKey = finalNeg.length >= 3 ? '3+' : String(finalNeg.length)
      stats.negCounts[countKey] = (stats.negCounts[countKey] || 0) + 1
      for (const r of finalNeg) {
        stats.negReasonsFreq[r] = (stats.negReasonsFreq[r] || 0) + 1
      }
    }

    updates.push({
      id: p.project_id,
      posReasons: finalPos,
      posReason: finalPos[0] || null,
      negReasons: finalNeg,
      negReason: finalNeg[0] || null,
    })
  }

  console.log(`מבצע עדכון במסד ל-${updates.length} פרויקטים...`)

  // ביצוע עדכונים בקבוצות (Batches) בתוך טרנזקציה
  const BATCH_SIZE = 100
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    const sqlStatements = batch
      .map(
        (u) => `
      UPDATE public.projects
         SET positive_feedback_reasons = ${escapeSqlArray(u.posReasons)},
             positive_feedback_reason = ${escapeSqlString(u.posReason)},
             negative_feedback_reasons = ${escapeSqlArray(u.negReasons)},
             negative_feedback_reason = ${escapeSqlString(u.negReason)}
       WHERE project_id = ${u.id};
    `,
      )
      .join('\n')

    await executeSql(`BEGIN;\n${sqlStatements}\nCOMMIT;`)
    console.log(`✓ עודכנה קבוצה ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(updates.length / BATCH_SIZE)}`)
  }

  console.log('\n========================================')
  console.log('       דוח סיכום אקדמי - העשרת נתונים    ')
  console.log('========================================')
  console.log(`סה"כ פרויקטים שעודכנו: ${stats.total}`)
  console.log('פילוח לפי ציונים:', stats.byScore)
  console.log('\nהדגשים חיוביים (ציונים 4–5):')
  console.log('התפלגות כמויות תגיות למשיב:', stats.posCounts)
  console.log('שכיחות תגיות חיוביות שנבחרו:', stats.posReasonsFreq)
  console.log('\nסיבות לבירור (ציונים 1–3):')
  console.log('התפלגות כמויות תגיות למשיב:', stats.negCounts)
  console.log('שכיחות תגיות שליליות שנבחרו:', stats.negReasonsFreq)
  console.log('========================================\n')
}

main().catch((err) => {
  console.error('שגיאה בהרצת סקריפט ההעשרה:', err)
  process.exit(1)
})
