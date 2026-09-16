import { ipcMain, shell, app, nativeTheme } from 'electron'
import fs from 'node:fs'
import { isSafeExternalUrl } from '../security'

/**
 * Shell 操作API - 插件专用
 */
export class PluginShellAPI {
  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    ipcMain.on('shell-open-external', (event, url: string) => {
      // 仅允许 http/https/mailto，防止 file:// 或自定义协议被滥用
      if (typeof url === 'string' && isSafeExternalUrl(url)) {
        shell.openExternal(url)
        event.returnValue = true
        return
      }
      event.returnValue = false
    })

    ipcMain.on('shell-open-path', (event, p: string) => {
      if (typeof p === 'string' && p && !p.includes('\0')) {
        shell.openPath(p)
      }
      event.returnValue = true
    })

    ipcMain.on('shell-show-item-in-folder', (event, p: string) => {
      if (typeof p === 'string' && p && !p.includes('\0')) {
        shell.showItemInFolder(p)
      }
      event.returnValue = true
    })

    ipcMain.on('shell-beep', () => {
      shell.beep()
    })

    ipcMain.handle('shell-trash-item', async (_event, fullPath: string) => {
      try {
        if (typeof fullPath === 'string') {
          await shell.trashItem(fullPath)
          return { success: true }
        }
        return { success: false, error: '无效路径' }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        return { success: false, error: e.message }
      }
    })

    ipcMain.handle('get-file-icon', async (_event, filePath: string) => {
      try {
        if (typeof filePath === 'string' && fs.existsSync(filePath)) {
          const icon = await app.getFileIcon(filePath)
          return icon.toDataURL()
        }
        return ''
      } catch {
        return ''
      }
    })

    ipcMain.on('get-os-type', (event) => {
      event.returnValue = process.platform
    })
    ipcMain.handle('get-os-type', async () => process.platform)

    // 窗口类型和主题
    ipcMain.on('get-window-type', (event) => {
      event.returnValue = 'plugin'
    })
    ipcMain.on('is-dark-colors', (event) => {
      event.returnValue = nativeTheme.shouldUseDarkColors
    })

    // 读取当前文件夹路径 / 浏览器 URL（stub，需要原生模块）
    ipcMain.handle('plugin:read-current-folder-path', async () => null)
    ipcMain.handle('plugin:read-current-browser-url', async () => null)
  }
}

export default new PluginShellAPI()
