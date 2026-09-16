import { BrowserWindow, shell } from 'electron'
import path from 'node:path'
import Store from 'electron-store'
import log from 'electron-log/main'
import { update } from '../update'

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

const windowStore = new Store({ name: 'window-state' })
const DEFAULT_WIDTH = 1200
const DEFAULT_HEIGHT = 800
const MIN_WIDTH = 800
const MIN_HEIGHT = 600

function getWindowState() {
  const state = windowStore.get('bounds', null) as {
    x?: number
    y?: number
    width?: number
    height?: number
    isMaximized?: boolean
  } | null
  if (!state) return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  return {
    x: state.x,
    y: state.y,
    width: Math.max(state.width || DEFAULT_WIDTH, MIN_WIDTH),
    height: Math.max(state.height || DEFAULT_HEIGHT, MIN_HEIGHT),
    isMaximized: state.isMaximized,
  }
}

function saveWindowState(win: BrowserWindow) {
  if (win.isMaximized()) {
    windowStore.set('bounds.isMaximized', true)
  } else {
    const bounds = win.getBounds()
    windowStore.set('bounds', { ...bounds, isMaximized: false })
  }
}

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
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
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
