import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

/** TS 解析器通用配置 */
const tsParserOptions = {
  parser: tsparser,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
}

export default [
  {
    ignores: [
      '**/dist/**',
      '**/dist-electron/**',
      'out/**',
      '**/out/**',
      'release/**',
      '**/node_modules/**',
      '参考项目/**',
      '**/plugins/**',
      '**/tests/e2e/**',
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

  // ── 跨层边界（进程 / 包隔离）────────────────────────────────
  // main / preload 禁止 import 渲染层
  {
    files: ['src/main/**/*.{ts,tsx}', 'src/preload/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/*', '@/'],
              message: '主进程/preload 禁止 import 渲染层别名 @/（src/renderer）',
            },
            {
              group: ['**/src/renderer/**', '../renderer/**', '../../renderer/**'],
              message: '主进程/preload 禁止 import 渲染层源码',
            },
          ],
        },
      ],
    },
  },

  // 渲染层禁止 import 主进程源码
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/src/main/**', '../../main/**', '../../../main/**'],
              message: '渲染层禁止 import 主进程源码；跨进程类型放 @ert/shared',
            },
          ],
        },
      ],
    },
  },

  // @ert/shared：跨进程原语，禁止 electron / react / 业务层
  {
    files: ['packages/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'electron',
              message: '@ert/shared 不得依赖 electron（跨进程原语层）',
            },
            {
              name: 'react',
              message: '@ert/shared 不得依赖 react',
            },
            {
              name: 'react-dom',
              message: '@ert/shared 不得依赖 react-dom',
            },
          ],
          patterns: [
            {
              group: ['@/*', '**/src/main/**', '**/src/renderer/**'],
              message: '@ert/shared 不得 import 应用进程代码',
            },
          ],
        },
      ],
    },
  },

  // @ert/plugin-api：插件契约，禁止依赖宿主实现
  {
    files: ['packages/plugin-api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'electron',
              message: '@ert/plugin-api 不得直接依赖 electron',
            },
            {
              name: 'react',
              message: '@ert/plugin-api 不得依赖 react',
            },
          ],
          patterns: [
            {
              group: [
                '@/',
                '**/src/main/**',
                '**/src/renderer/**',
                '../../src/main/**',
                '../../src/renderer/**',
              ],
              message: '@ert/plugin-api 不得 import 宿主进程代码',
            },
          ],
        },
      ],
    },
  },

  // ── 渲染进程（浏览器环境）────────────────────────────────
  {
    files: ['src/renderer/**/*.{ts,tsx}', 'test/**/*.ts'],
    languageOptions: {
      ...tsParserOptions,
      parserOptions: {
        ...tsParserOptions.parserOptions,
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
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off',
      // 宿主渲染层禁止直接碰 preload 底层桥：一律走 @/services 或 @/ipc
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'ipcRenderer',
          message: '使用 @/ipc 的 ipcApi，禁止 window.ipcRenderer',
        },
        {
          object: 'window',
          property: 'plugin',
          message: '使用 @/services 的 pluginService，禁止 window.plugin',
        },
        {
          object: 'window',
          property: 'logEvents',
          message: '使用 @/services 的 logsService，禁止 window.logEvents',
        },
        {
          object: 'app',
          property: 'getPath',
          message: '主进程路径走 @main/app/paths 的 paths.*',
        },
      ],
    },
  },

  // ── packages/shared：同构 TS（无 React 规则）────────────
  {
    files: ['packages/shared/**/*.{ts,tsx}'],
    languageOptions: {
      ...tsParserOptions,
      globals: {
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off',
    },
  },

  // ── Node.js 脚本 ────────────────────────────────────────
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

  // ── Electron 主进程 / preload ───────────────────────────
  {
    files: [
      'src/main/**/*.ts',
      'src/preload/**/*.ts',
      'packages/plugin-api/**/*.ts',
    ],
    languageOptions: {
      ...tsParserOptions,
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
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
      // 主进程业务路径应走 paths 注册（paths.ts 自身与插件 passthrough 除外）
      'no-restricted-properties': [
        'error',
        {
          object: 'app',
          property: 'getPath',
          message: '使用 src/main/app/paths.ts 的 paths.*，勿直接 app.getPath',
        },
      ],
    },
  },

  // paths.ts 自身与插件 API 透传允许 app.getPath
  {
    files: [
      'src/main/app/paths.ts',
      'src/main/features/plugin-host/api/services.ts',
      'src/main/features/plugin-host/api/dialog.ts',
    ],
    rules: {
      'no-restricted-properties': 'off',
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
