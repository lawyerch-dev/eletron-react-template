import path from 'node:path'
import { defineConfig } from 'vitest/config'

const repoRoot = path.resolve(import.meta.dirname, '../..')
const sharedSrc = path.join(repoRoot, 'packages/shared/src')
const pluginApiSrc = path.join(repoRoot, 'packages/plugin-api/src')

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@ert\/shared\/ipc$/, replacement: path.join(sharedSrc, 'ipc/index.ts') },
      { find: /^@ert\/shared\/types$/, replacement: path.join(sharedSrc, 'types/index.ts') },
      {
        find: /^@ert\/shared\/utils\/plugin$/,
        replacement: path.join(sharedSrc, 'utils/plugin.ts'),
      },
      {
        find: /^@ert\/shared\/capabilities$/,
        replacement: path.join(sharedSrc, 'capabilities/config.ts'),
      },
      { find: /^@ert\/shared$/, replacement: path.join(sharedSrc, 'index.ts') },
      { find: /^@ert\/plugin-api$/, replacement: path.join(pluginApiSrc, 'index.ts') },
      { find: '@', replacement: path.join(import.meta.dirname, 'src/renderer') },
    ],
  },
  test: {
    root: import.meta.dirname,
    include: ['test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['test/e2e/**'],
    passWithNoTests: true,
    testTimeout: 1000 * 29,
  },
})
