import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  {
    ignores: [
      '**/dist/**',
      '**/dist-electron/**',
      'release/**',
      '**/node_modules/**',
      'ZTools/**',
      '**/plugins/**',
      '**/test/e2e/**',
      '**/src/main/features/plugin-host/plugin-preload.js',
      '**/resources/**',
      '**/build/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
      '.claude/**',
      '.trae/**',
      '.vscode/**',
      '.github/**',
      'dev_docs/**',
      'docs/**',
      '**/*.md',
      '**/*.json',
      '**/*.svg',
      '**/*.css',
      '.npmrc',
      '.prettierrc',
      '.prettierignore',
      'pnpm-lock.yaml',
    ],
  },

  js.configs.recommended,

  // 渲染进程（浏览器环境）
  {
    files: ['apps/desktop/src/renderer/**/*.{ts,tsx}', 'apps/desktop/src/shared/**/*.{ts,tsx}', 'apps/desktop/test/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        postMessage: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off', // TypeScript 类型系统已覆盖
    },
  },

  // Node.js 脚本
  {
    files: ['**/scripts/**/*.{mjs,js,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Electron 主进程（Node.js 环境）
  {
    files: ['apps/desktop/src/main/**/*.ts', 'apps/desktop/src/preload/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },

  // Prettier（最后）
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'warn',
    },
  },

  prettierConfig,
]
