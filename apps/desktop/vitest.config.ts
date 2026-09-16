import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': `${import.meta.dirname}/src/shared`,
      '@': `${import.meta.dirname}/src/renderer`,
    },
  },
  test: {
    root: import.meta.dirname,
    include: ['test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['test/e2e/**'],
    passWithNoTests: true,
    testTimeout: 1000 * 29,
  },
})
