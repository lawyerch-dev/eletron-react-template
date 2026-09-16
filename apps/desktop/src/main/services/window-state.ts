import { BrowserWindow } from 'electron'
import Store from 'electron-store'

export interface WindowBounds {
  x?: number
  y?: number
  width?: number
  height?: number
  isMaximized?: boolean
}

const windowStore = new Store({ name: 'window-state' })
const DEFAULT_WIDTH = 1200
const DEFAULT_HEIGHT = 800
const MIN_WIDTH = 800
const MIN_HEIGHT = 600

export function getWindowState(): WindowBounds {
  const state = windowStore.get('bounds', null) as WindowBounds | null
  if (!state) return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  return {
    x: state.x,
    y: state.y,
    width: Math.max(state.width || DEFAULT_WIDTH, MIN_WIDTH),
    height: Math.max(state.height || DEFAULT_HEIGHT, MIN_HEIGHT),
    isMaximized: state.isMaximized,
  }
}

export function saveWindowState(win: BrowserWindow): void {
  if (win.isMaximized()) {
    windowStore.set('bounds.isMaximized', true)
  } else {
    const bounds = win.getBounds()
    windowStore.set('bounds', { ...bounds, isMaximized: false })
  }
}

export const WINDOW_MIN_SIZE = { width: MIN_WIDTH, height: MIN_HEIGHT }
