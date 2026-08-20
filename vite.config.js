import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    // e2e/ הוא Playwright (runner נפרד, npm run test:e2e) - לא בדיקות Vitest.
    // .claude/** — worktrees של סוכני-רקע מכילים עותק מלא של הריפו; בלי ההחרגה vitest
    // סורק גם אותם, סופר כל בדיקה פעמיים ומריץ ספקי-Playwright כ-Vitest (נצפה 19/08/2026:
    // worktree יתום הפיל את test:run עם 17 כשלי-קובץ שאינם של הריפו עצמו).
    exclude: ['node_modules/**', 'e2e/**', '.claude/**'],
  },
})
