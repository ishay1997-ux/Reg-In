import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import sonarjs from 'eslint-plugin-sonarjs'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // קבצי קונפיג רצים בסביבת Node (Vite bundle-ר את vite.config עם __dirname).
  {
    files: ['**/*.config.{js,jsx}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // קבצי בדיקה — גלובלים של Vitest (describe/it/expect) + jsdom.
  {
    files: ['**/*.{test,spec}.{js,jsx}', 'src/test/**'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },
  // רכיבי shadcn/ui הם קוד vendored שנוצר אוטומטית: מייבאים `React` לתאימות
  // ומייצאים variants לצד הרכיב. מרפים את שני הכללים כאן בלבד כדי לא לערוך קוד ספרייה.
  {
    files: ['src/components/ui/**'],
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
      'react-refresh/only-export-components': 'off',
    },
  },
  // בקרת-איכות (sonarjs): זיהוי כפילויות ומורכבות-יתר לאורך כל הפיתוח, כדי שהקוד
  // יעמוד בסקירה של מהנדס-תוכנה. כרגע ברמת 'warn' בלבד — לא חוסם build/CI —
  // ומוקשה לשער-חוסם ('error') אחרי סגירת מודול 3 (החלטת-ישי 23/07/2026, כדי לא
  // לחסום קוד-מ3 קיים באמצע העבודה). לא חל על src/components/ui/ (shadcn vendored)
  // ולא על קבצי-בדיקה (מורכבות בטסטים לגיטימית). הסט מובחר במכוון — no-duplicate-string
  // הרועש הושמט. חבר לסקיל quality-audit (סקירה עמוקה יזומה) ולכלי jscpd (כפילות בין-קבצים).
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/components/ui/**', 'src/**/*.{test,spec}.{js,jsx}', 'src/test/**'],
    plugins: { sonarjs },
    rules: {
      'sonarjs/no-identical-functions': 'warn', // ← הכי רלוונטי לשאלה: שתי פונקציות זהות
      'sonarjs/no-identical-expressions': 'warn',
      'sonarjs/no-duplicated-branches': 'warn',
      'sonarjs/cognitive-complexity': ['warn', 20], // ← גלאי-ספגטי (מורכבות פר-פונקציה)
      'sonarjs/no-collapsible-if': 'warn',
      'sonarjs/no-redundant-boolean': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',
      'sonarjs/no-nested-template-literals': 'warn',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/no-inverted-boolean-check': 'warn',
    },
  },
  // חייב להיות אחרון: מכבה כללי-עיצוב של ESLint שמתנגשים עם Prettier.
  prettier,
])
