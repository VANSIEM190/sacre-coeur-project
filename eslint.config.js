import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const forbidden = patterns => ['error', { patterns }]

export default defineConfig([
  globalIgnores(['**/dist/**', 'node_modules/**', '.tmp/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  { files: ['apps/**/*.{ts,tsx}'], extends: [reactRefresh.configs.vite] },
  { files: ['scripts/**/*.mjs', '**/*.test.mjs'], extends: [js.configs.recommended], languageOptions: { globals: globals.node } },
  { files: ['config/**/*.ts', 'apps/*/vite.config.ts'], languageOptions: { globals: globals.node } },
  { files: ['supabase/functions/**/*.ts'], languageOptions: { globals: { ...globals.node, Deno: 'readonly' } } },
  { files: ['packages/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': forbidden(['@/*', '**/apps/**']) } },
  { files: ['packages/domain/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': forbidden(['@/*', '@sacre-coeur/*', 'react', 'react-dom', '@supabase/*', '@tanstack/*', '**/apps/**']) } },
  { files: ['packages/ui/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': forbidden(['@/*', '@sacre-coeur/domain/*', '@sacre-coeur/data-access/*', '@sacre-coeur/auth/*', '@sacre-coeur/school-features/*', '@supabase/*', '**/apps/**']) } },
  { files: ['packages/data-access/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': forbidden(['@/*', '@sacre-coeur/ui/*', '@sacre-coeur/auth/*', '@sacre-coeur/school-features/*', 'sonner', '**/apps/**']) } },
])

