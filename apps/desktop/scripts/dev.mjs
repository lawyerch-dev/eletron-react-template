import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
// vite 8 的 exports 未导出 ./bin/vite.js，改为通过导出的 package.json 定位包目录再拼接 bin 路径
const viteBin = path.join(
  path.dirname(require.resolve('vite/package.json')),
  'bin/vite.js',
)
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const vite = spawn(process.execPath, [viteBin, ...process.argv.slice(2)], {
  env,
  stdio: 'inherit',
})

vite.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 1)
  }
})

vite.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
