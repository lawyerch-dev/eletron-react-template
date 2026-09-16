import { ipcMain, screen, desktopCapturer, BrowserWindow } from 'electron'
import { screenCapture } from './screenCapture'

/**
 * 屏幕和坐标相关API - 插件专用
 */
export class PluginScreenAPI {
  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    ipcMain.handle('screen-capture', async () => {
      return screenCapture()
    })

    ipcMain.on('get-primary-display', (event) => {
      event.returnValue = screen.getPrimaryDisplay()
    })

    ipcMain.on('get-all-displays', (event) => {
      event.returnValue = screen.getAllDisplays()
    })

    ipcMain.on('get-cursor-screen-point', (event) => {
      event.returnValue = screen.getCursorScreenPoint()
    })

    ipcMain.on('get-display-nearest-point', (event, point: Electron.Point) => {
      event.returnValue = screen.getDisplayNearestPoint(point)
    })

    ipcMain.on('dip-to-screen-point', (event, point: Electron.Point) => {
      event.returnValue = screen.dipToScreenPoint(point)
    })

    ipcMain.on(
      'dip-to-screen-rect',
      (event, rect: { x: number; y: number; width: number; height: number }) => {
        if (process.platform === 'darwin') {
          event.returnValue = rect
          return
        }
        const win = BrowserWindow.fromWebContents(event.sender)
        event.returnValue = win ? screen.dipToScreenRect(win, rect) : rect
      },
    )

    ipcMain.on('screen-to-dip-point', (event, point: Electron.Point) => {
      event.returnValue = screen.screenToDipPoint(point)
    })

    ipcMain.handle('desktop-capture-sources', async (_event, options: Electron.SourcesOptions) => {
      try {
        return await desktopCapturer.getSources(options)
      } catch {
        return []
      }
    })

    ipcMain.handle('screen-color-pick', async () => {
      return { success: false, hex: null, rgb: null }
    })
  }
}

export default new PluginScreenAPI()
