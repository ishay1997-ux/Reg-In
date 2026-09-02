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
    // 🔴 **תקרת-עובדים — נוספה 02/09/2026 אחרי שכשל-המכונה נראה כמו כשל-קוד שלוש פעמים ביום אחד.**
    // ‏vitest פותח כברירת-מחדל עובד לכל ליבה. מכונת-הפיתוח כאן היא **12 ליבות מול 16GB**, שמתוכם
    // ‏~2.5GB פנויים בפועל (‏IDE + דפדפנים + סשני-Claude). ⇒ ‏12 תהליכי-Node, כל אחד עם ערימה
    // משלו, **לא נפתחים** — והפלט אינו "אין זיכרון" אלא
    // `[vitest-pool]: Failed to start forks worker … Timeout waiting for worker to respond`.
    // 🩸 **ולמה זה מסוכן ולא רק מעצבן: הריצה מסתיימת ב-exit 1 עם פחות קבצים, ונראית כמו רגרסיה.**
    // נמדד היום: ‏`54/1,447` עם כשל, מול **`65/1,819` ו-exit 0** באותו עץ בדיוק עם `--maxWorkers=3`.
    // מי שלא יקרא את שורות ה-Unhandled יחפש באג שאינו קיים. *(וזה קרה גם לבודק בלתי-תלוי,
    // בסביבה אחרת, באותו יום — כלומר לא ייחודי למכונה הזו.)*
    // ⚖️ **ולמה 3 ולא "מספר הליבות פחות משהו":** רץ-ה-CI של GitHub נושא 2–4 ליבות ממילא, כך
    // שהתקרה **אינה עולה לו דבר**; והמחיר המקומי הוא זמן-קיר בלבד (~150 שניות לסוויטה המלאה).
    // **ריצה איטית שאומרת אמת שווה יותר מריצה מהירה שמשקרת.**
    maxWorkers: 3,
  },
})
