import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
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
  // חייב להיות אחרון: מכבה כללי-עיצוב של ESLint שמתנגשים עם Prettier.
  prettier,
])
