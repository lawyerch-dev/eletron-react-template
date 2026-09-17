import { rmSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { electronSimple } from 'vite-plugin-electron/multi-env'
import { notBundle } from 'vite-plugin-electron/plugin'
import pkg from './package.json' with { type: 'json' }

const repoRoot = import.meta.dirname
const rendererDir = path.join(repoRoot, 'src/renderer')
const sharedSrc = path.join(repoRoot, 'packages/shared/src')
const pluginApiSrc = path.join(repoRoot, 'packages/plugin-api/src')

const deps = 'dependencies' in pkg ? (pkg.dependencies as Record<string, string>) : {}
// workspace 源码包需要打进 bundle，不能当 external
const external = Object.keys(deps).filter((name) => !name.startsWith('@ert/'))

/** dev 时 index.html 不在 root：用 302 跳到真实路径，保证相对资源（./app/main.tsx）可解析 */
function serveRendererHtml(): Plugin {
  return {
    name: 'serve-renderer-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          res.statusCode = 302
          res.setHeader('Location', '/src/renderer/index.html')
          res.end()
          return
        }
        next()
      })
    },
  }
}

// https://vitejs.dev/config/
// ⚠️ root 必须是仓库根：vite-plugin-electron 以 config.root 作为 Electron cwd
//    与 package.json 查找根。设成 src/renderer 会导致
//    "Unable to find Electron app at .../src/renderer"。
export default defineConfig(({ command }) => {
  rmSync(path.join(repoRoot, 'out'), { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    root: repoRoot,
    publicDir: path.join(rendererDir, 'public'),
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
        {
          find: /^@ert\/shared\/mcp\/presets$/,
          replacement: path.join(sharedSrc, 'mcp/presets.ts'),
        },
        { find: /^@ert\/shared$/, replacement: path.join(sharedSrc, 'index.ts') },
        { find: /^@ert\/plugin-api$/, replacement: path.join(pluginApiSrc, 'index.ts') },
        { find: '@', replacement: rendererDir },
      ],
    },
    plugins: [
      react(),
      tailwindcss(),
      electronSimple({
        main: {
          input: path.join(repoRoot, 'src/main/main.ts'),
          plugins: [notBundle()],
          options: {
            publicDir: false,
            build: {
              sourcemap,
              minify: isBuild,
              outDir: path.join(repoRoot, 'out/electron/main'),
              rolldownOptions: {
                external,
              },
            },
          },
        },
        preload: {
          input: path.join(repoRoot, 'src/preload/index.ts'),
          // 不用 notBundle：它会把 electron 外部化成 require()，
          // 在 package.json "type":"module" 下 .mjs 预加载会报 require is not defined。
          options: {
            publicDir: false,
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: path.join(repoRoot, 'out/electron/preload'),
              rolldownOptions: {
                external: ['electron'],
                output: {
                  format: 'cjs',
                  entryFileNames: 'index.cjs',
                },
              },
            },
          },
        },
        // Polyfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        // renderer: {},
      }),
      serveRendererHtml(),
    ],
    optimizeDeps: {
      // 排除第三方插件中未安装的依赖，避免预打包扫描失败
      exclude: ['psd', '@emotion/is-prop-valid'],
    },
    clearScreen: false,
    build: {
      outDir: path.join(repoRoot, 'out/renderer'),
      emptyOutDir: true,
      rollupOptions: {
        input: path.join(rendererDir, 'index.html'),
      },
    },
  }
})
