import { defineConfig, devices } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Vite טוען .env.local אוטומטית לאפליקציה, אבל Playwright/Node לא - טוענים ידנית
// (בלי תלות dotenv נוספת) כדי ש-process.env.E2E_* יהיו זמינים ל-specs.
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

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  // DB בדיקה משותף (Supabase free tier) + זרימות Auth אמיתיות - ריצה טורית מונעת מרוץ
  // בין ניסיונות-התחברות מקבילים ומקטינה עומס-רשת שגורם ל-timeout מקרי.
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
