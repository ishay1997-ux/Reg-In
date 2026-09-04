/**
 * scripts/enrich-feedback-reasons.mjs
 *
 * העשרת נתוני המשוב בטגלים ומגמת שביעות רצון רב-שנתית (2024–2026)
 * מבוסס על מודל שיפור מתמשך אקדמי (Operational Learning Curve) ועונתיות אירועים.
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

const NEGATIVE_POOL = ['איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר']

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
  if (n.includes('מוקדם') || n.includes('בזמן') || n.includes('האורחים'))
    matches.push('עמידה בזמנים')
  if (
    n.includes('דיילות') ||
    n.includes('מקצועי') ||
    n.includes('אדיב') ||
    n.includes('צוות') ||
    n.includes('הרישום')
  ) {
    matches.push('מקצועיות הדיילות')
  }
  if (n.includes('תגים') || n.includes('ציוד') || n.includes('סרטים'))
    matches.push('איכות תגים וציוד')
  if (
    n.includes('שירות') ||
    n.includes('תקשורת') ||
    n.includes('מענה') ||
    n.includes('נשמח לעבוד')
  ) {
    matches.push('ניהול ותקשורת')
  }
  return matches
}

function matchNegativeFromNotes(notes) {
  if (!notes) return []
  const matches = []
  const n = notes.toLowerCase()
  if (n.includes('איחרו') || n.includes('איחור') || n.includes('התעכבה') || n.includes('עיכוב'))
    matches.push('איחור דיילות')
  if (n.includes('תגים') || n.includes('מוזמנים') || n.includes('טעות') || n.includes('שמות'))
    matches.push('איכות תגים')
  if (n.includes('ניהל') || n.includes('מנהל') || n.includes('בלגן')) matches.push('ניהול לקוי')
  if (n.includes('תפקוד') || n.includes('יחס') || n.includes('צוות') || n.includes('התנהגות'))
    matches.push('תפקוד דיילות')
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
  console.log('--- התחלת עדכון מגמת שביעות רצון והעשרת תגיות (Academic Trend) ---')

  // 1. קריאת כל הפרויקטים שהושלם בהם משוב
  const selectQuery = `
    SELECT project_id, customer_id, final_event_date, feedback_score, feedback_notes, negative_feedback_reason, negative_feedback_reasons, positive_feedback_reason, positive_feedback_reasons
    FROM public.projects
    WHERE feedback_status = 'completed' AND final_event_date IS NOT NULL
    ORDER BY final_event_date ASC;
  `
  const projects = await executeSql(selectQuery)
  console.log(`נטענו ${projects.length} פרויקטים עם משוב שהושלם.`)

  // זיהוי לקוח lowFeedback לצורך שימור עוגן 'טעון בירור'
  const customerScores = {}
  for (const p of projects) {
    if (!customerScores[p.customer_id]) customerScores[p.customer_id] = []
    customerScores[p.customer_id].push(p.feedback_score)
  }
  let lowFeedbackCustomerId = null
  for (const [cid, scs] of Object.entries(customerScores)) {
    const avg = scs.reduce((a, b) => a + b, 0) / scs.length
    if (avg < 3.5 && scs.length >= 3) {
      lowFeedbackCustomerId = Number(cid)
      break
    }
  }

  const updates = []
  const yearlyStats = {
    2024: { total: 0, sum: 0, scores: [], csat: 0 },
    2025: { total: 0, sum: 0, scores: [], csat: 0 },
    2026: { total: 0, sum: 0, scores: [], csat: 0 },
  }
  const monthlyStats = {}
  const reasonsStats = {
    pos: {},
    neg: {},
    negByYear: { 2024: {}, 2025: {}, 2026: {} },
  }

  for (const p of projects) {
    const d = p.final_event_date
    const y = d.slice(0, 4)
    const m = d.slice(0, 7)
    const monthNum = parseInt(d.slice(5, 7), 10)
    const rng = createRng(hashSeed(`trend-${p.project_id}`))

    let score
    if (p.customer_id === lowFeedbackCustomerId) {
      score = rng.pick([1, 2, 2, 3])
    } else {
      const isPeakMonth = [5, 6, 10, 11].includes(monthNum)
      let weights
      if (y === '2024') {
        weights = isPeakMonth
          ? [
              { weight: 2.8, value: 5 },
              { weight: 4.8, value: 4 },
              { weight: 1.8, value: 3 },
              { weight: 0.5, value: 2 },
              { weight: 0.1, value: 1 },
            ]
          : [
              { weight: 3.5, value: 5 },
              { weight: 4.8, value: 4 },
              { weight: 1.4, value: 3 },
              { weight: 0.25, value: 2 },
              { weight: 0.05, value: 1 },
            ]
      } else if (y === '2025') {
        weights = isPeakMonth
          ? [
              { weight: 4.2, value: 5 },
              { weight: 4.2, value: 4 },
              { weight: 1.2, value: 3 },
              { weight: 0.35, value: 2 },
              { weight: 0.05, value: 1 },
            ]
          : [
              { weight: 5.0, value: 5 },
              { weight: 3.8, value: 4 },
              { weight: 1.0, value: 3 },
              { weight: 0.18, value: 2 },
              { weight: 0.02, value: 1 },
            ]
      } else {
        // 2026: בשלות מלאה
        weights = isPeakMonth
          ? [
              { weight: 5.6, value: 5 },
              { weight: 3.6, value: 4 },
              { weight: 0.65, value: 3 },
              { weight: 0.12, value: 2 },
              { weight: 0.01, value: 1 },
            ]
          : [
              { weight: 6.6, value: 5 },
              { weight: 2.8, value: 4 },
              { weight: 0.5, value: 3 },
              { weight: 0.08, value: 2 },
              { weight: 0.01, value: 1 },
            ]
      }
      score = rng.weighted(weights)
    }

    if (!yearlyStats[y]) yearlyStats[y] = { total: 0, sum: 0, scores: [] }
    yearlyStats[y].total++
    yearlyStats[y].sum += score
    yearlyStats[y].scores.push(score)

    if (!monthlyStats[m]) monthlyStats[m] = { total: 0, sum: 0, scores: [] }
    monthlyStats[m].total++
    monthlyStats[m].sum += score
    monthlyStats[m].scores.push(score)

    let finalPos = []
    let finalNeg = []

    if (score >= 4) {
      const noteMatches = matchPositiveFromNotes(p.feedback_notes)
      let targetCount = 0
      if (score === 5) {
        targetCount = rng.weighted([
          { weight: noteMatches.length > 0 ? 0.05 : 0.15, value: 0 },
          { weight: 0.35, value: 1 },
          { weight: 0.35, value: 2 },
          { weight: 0.15, value: 3 },
        ])
      } else {
        targetCount = rng.weighted([
          { weight: noteMatches.length > 0 ? 0.1 : 0.25, value: 0 },
          { weight: 0.6, value: 1 },
          { weight: 0.15, value: 2 },
        ])
      }

      if (targetCount > 0) {
        const picked = new Set(noteMatches.slice(0, targetCount))
        // התפתחות חיובית לאורך השנים: ניהול ותקשורת ועמידה בזמנים גדלים
        const weightedPool = [
          { weight: 35, value: 'מקצועיות הדיילות' },
          { weight: y === '2026' ? 35 : 25, value: 'עמידה בזמנים' },
          { weight: y === '2024' ? 10 : 20, value: 'איכות תגים וציוד' },
          { weight: y === '2026' ? 25 : 15, value: 'ניהול ותקשורת' },
          { weight: 5, value: 'אחר' },
        ]

        while (picked.size < targetCount) {
          picked.add(rng.weighted(weightedPool))
        }
        finalPos = Array.from(picked)
      }

      for (const r of finalPos) reasonsStats.pos[r] = (reasonsStats.pos[r] || 0) + 1
    } else {
      // score <= 3
      const noteMatches = matchNegativeFromNotes(p.feedback_notes)
      const existing = p.negative_feedback_reason || p.negative_feedback_reasons?.[0]
      const initial = new Set()
      if (existing && NEGATIVE_POOL.includes(existing)) initial.add(existing)
      for (const item of noteMatches) initial.add(item)

      const targetCount = rng.weighted([
        { weight: 0.6, value: 1 },
        { weight: 0.3, value: 2 },
        { weight: 0.1, value: 3 },
      ])

      // התפתחות שלילית לאורך השנים: איכות תגים הייתה 40% ב-2024 וצונחת ב-2026
      const weightedNegPool = [
        { weight: 35, value: 'איחור דיילות' },
        { weight: 25, value: 'תפקוד דיילות' },
        { weight: y === '2024' ? 40 : y === '2025' ? 20 : 8, value: 'איכות תגים' },
        { weight: y === '2026' ? 20 : 12, value: 'ניהול לקוי' },
        { weight: 5, value: 'אחר' },
      ]

      while (initial.size < Math.max(1, targetCount)) {
        initial.add(rng.weighted(weightedNegPool))
      }

      finalNeg = Array.from(initial).slice(0, Math.max(1, targetCount))
      for (const r of finalNeg) {
        reasonsStats.neg[r] = (reasonsStats.neg[r] || 0) + 1
        if (reasonsStats.negByYear[y]) {
          reasonsStats.negByYear[y][r] = (reasonsStats.negByYear[y][r] || 0) + 1
        }
      }
    }

    updates.push({
      id: p.project_id,
      score,
      posReasons: finalPos,
      posReason: finalPos[0] || null,
      negReasons: finalNeg,
      negReason: finalNeg[0] || null,
    })
  }

  console.log(`מבצע עדכון במסד ל-${updates.length} פרויקטים...`)
  const BATCH_SIZE = 100
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    const sqlStatements = batch
      .map(
        (u) => `
      UPDATE public.projects
         SET feedback_score = ${u.score},
             positive_feedback_reasons = ${escapeSqlArray(u.posReasons)},
             positive_feedback_reason = ${escapeSqlString(u.posReason)},
             negative_feedback_reasons = ${escapeSqlArray(u.negReasons)},
             negative_feedback_reason = ${escapeSqlString(u.negReason)}
       WHERE project_id = ${u.id};
    `,
      )
      .join('\n')

    await executeSql(`BEGIN;\n${sqlStatements}\nCOMMIT;`)
    console.log(
      `✓ עודכנה קבוצה ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(updates.length / BATCH_SIZE)}`,
    )
  }

  console.log('\n=============================================================')
  console.log('       דוח סיכום אקדמי: מגמת שביעות רצון לאורך השנים         ')
  console.log('=============================================================')
  for (const [yr, stat] of Object.entries(yearlyStats)) {
    const avg = (stat.sum / stat.total).toFixed(2)
    const csat = ((stat.scores.filter((s) => s >= 4).length / stat.total) * 100).toFixed(1) + '%'
    console.log(`שנת ${yr}: ${stat.total} פרויקטים | ממוצע: ${avg} מתוך 5.0 | CSAT: ${csat}`)
  }

  console.log('\nשינוי שכיחות תקלות תגים וציוד לאורך השנים (אפקט מודול לוגיסטיקה):')
  for (const yr of ['2024', '2025', '2026']) {
    const badgeIssues = reasonsStats.negByYear[yr]?.['איכות תגים'] || 0
    console.log(`  - שנת ${yr}: ${badgeIssues} מקרים`)
  }
  console.log('=============================================================\n')
}

main().catch((err) => {
  console.error('שגיאה בהרצה:', err)
  process.exit(1)
})
