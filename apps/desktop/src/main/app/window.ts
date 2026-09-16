import { BrowserWindow, shell } from 'electron'
import path from 'node:path'
import log from 'electron-log/main'
import { update } from '../services/update'
import { getWindowState, saveWindowState, WINDOW_MIN_SIZE } from '../services/window-state'

export function getAppRoot(): string {
  return process.env.APP_ROOT || process.cwd()
}

export function getMainDist(): string {
  return path.join(getAppRoot(), 'dist-electron')
}

export function getRendererDist(): string {
  return path.join(getAppRoot(), 'dist')
}

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

export function getPreloadPath(): string {
  return path.join(getMainDist(), 'preload/index.mjs')
}

export function getIndexHtmlPath(): string {
  return path.join(getRendererDist(), 'index.html')
}

export async function createMainWindow(): Promise<BrowserWindow> {
  const windowState = getWindowState()
  const rendererDist = getRendererDist()

  const win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC || rendererDist, 'favicon.ico'),
    width: windowState.width,
    height: windowState.height,
    ...(windowState.x !== undefined && { x: windowState.x }),
    ...(windowState.y !== undefined && { y: windowState.y }),
    minWidth: WINDOW_MIN_SIZE.width,
    minHeight: WINDOW_MIN_SIZE.height,
    webPreferences: {
      preload: getPreloadPath(),
    },
  })

  if (windowState.isMaximized) {
    win.maximize()
  }

  win.on('close', () => {
    saveWindowState(win)
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(getIndexHtmlPath())
  }

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('main-process-message', new Date().toLocaleString())
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  update(win)

  log.info('Window created')
  return win
}
