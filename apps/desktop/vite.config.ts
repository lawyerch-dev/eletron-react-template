import { rmSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { electronSimple } from 'vite-plugin-electron/multi-env'
import { notBundle } from 'vite-plugin-electron/plugin'
import pkg from './package.json' with { type: 'json' }

const external = Object.keys(
  'dependencies' in pkg ? (pkg.dependencies as Record<string, string>) : {},
)

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    resolve: {
      alias: {
        '@': path.join(import.meta.dirname, 'src'),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      electronSimple({
        main: {
          input: 'electron/main/index.ts',
          plugins: [notBundle()],
          options: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/main',
              rolldownOptions: {
                external,
              },
            },
          },
        },
        preload: {
          input: 'electron/preload/index.ts',
          plugins: [notBundle()],
          options: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rolldownOptions: {
                external,
              },
            },
          },
        },
        // Polyfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        // renderer: {},
      }),
    ],
    optimizeDeps: {
      // 排除第三方插件中未安装的依赖，避免预打包扫描失败
      exclude: ['psd', '@emotion/is-prop-valid'],
    },
    clearScreen: false,
  }
})
