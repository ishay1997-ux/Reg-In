import fs from 'fs'
import path from 'path'

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim()
  }
}

async function executeSql(query) {
  const url = process.env.VITE_SUPABASE_URL
  const projectRef = url.match(/https:\/\/(.*?)\.supabase\.co/)[1]
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error('Missing SUPABASE_ACCESS_TOKEN in .env.local')

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
    throw new Error(`SQL Management API error (${res.status}): ${text}`)
  }
  return res.json()
}

async function main() {
  console.log('Applying migration 20260905004500_finance_written_off_demo_cases.sql...')
  const migrationPath = path.resolve(
    'supabase/migrations/20260905004500_finance_written_off_demo_cases.sql',
  )
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  const result = await executeSql(sql)
  console.log('Migration executed successfully:', result)

  // Verify
  const verifySql = `
    select p.project_id, p.event_name, p.payment_date, pf.written_off, pf.written_off_reason, pf.final_profit
      from public.projects p
      join public.project_finance pf on pf.project_id = p.project_id
     where p.project_id in (823, 1108);
  `
  const verified = await executeSql(verifySql)
  console.log('Verified database rows:\n', JSON.stringify(verified, null, 2))
}

main().catch((err) => {
  console.error('Execution failed:', err)
  process.exit(1)
})
