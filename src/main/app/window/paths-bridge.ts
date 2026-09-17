/** 从 paths / 旧 window 模块桥接，避免 WindowManager 与 paths 循环依赖 */
import { paths } from '../paths'

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

export function getPreloadPath(): string {
  return paths.hostPreload()
}

export function getIndexHtmlPath(): string {
  return paths.rendererIndexHtml()
}
