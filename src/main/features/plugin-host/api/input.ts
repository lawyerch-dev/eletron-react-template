import { ipcMain, clipboard, nativeImage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 输入事件API - 插件专用
 */
export class PluginInputAPI {
  private foundInPageListeners = new WeakSet<Electron.WebContents>()

  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    ipcMain.handle('send-input-event', async () => {
      return { success: false, error: '需要原生模块支持' }
    })

    ipcMain.on('simulate-keyboard-tap', (_event, _key: string, _modifiers: string[]) => {
      _event.returnValue = false
    })

    ipcMain.on('simulate-mouse-move', (_event, _x: number, _y: number) => {
      _event.returnValue = false
    })

    ipcMain.on('simulate-mouse-click', (_event, _x: number, _y: number) => {
      _event.returnValue = false
    })

    ipcMain.on('simulate-mouse-double-click', (_event, _x: number, _y: number) => {
      _event.returnValue = false
    })

    ipcMain.on('simulate-mouse-right-click', (_event, _x: number, _y: number) => {
      _event.returnValue = false
    })

    ipcMain.on('is-dev', (event) => {
      event.returnValue = process.env.NODE_ENV === 'development'
    })

    ipcMain.on('get-web-contents-id', (event) => {
      event.returnValue = event.sender.id
    })

    ipcMain.handle('find-in-page', (event, text: string, options?: Electron.FindInPageOptions) => {
      try {
        const wc = event.sender
        if (wc.isDestroyed()) return { success: false, error: '页面已销毁' }
        const requestId = wc.findInPage(text, options)
        // 转发查找结果到插件
        if (!this.foundInPageListeners.has(wc)) {
          this.foundInPageListeners.add(wc)
          wc.on('found-in-page', (_e, result) => {
            if (!wc.isDestroyed()) wc.send('found-in-page-result', result)
          })
        }
        return { success: true, requestId }
      } catch {
        return { success: false, error: '查找失败' }
      }
    })

    ipcMain.handle(
      'stop-find-in-page',
      (event, action: 'clearSelection' | 'keepSelection' | 'activateSelection') => {
        try {
          event.sender.stopFindInPage(action)
          return { success: true }
        } catch {
          return { success: false }
        }
      },
    )

    ipcMain.on('hide-main-window-paste-text', (event, text: string) => {
      if (typeof text !== 'string') {
        event.returnValue = false
        return
      }
      clipboard.writeText(String(text))
      event.returnValue = true
    })

    ipcMain.on('hide-main-window-paste-image', (event, img: string | Uint8Array) => {
      if (!img) {
        event.returnValue = false
        return
      }
      let nativeImg: Electron.NativeImage | undefined
      if (typeof img === 'string') {
        if (/^data:image\//.test(img)) {
          nativeImg = nativeImage.createFromDataURL(img)
        } else if (path.basename(img) !== img && fs.existsSync(img)) {
          nativeImg = nativeImage.createFromPath(img)
        }
      } else if (img instanceof Uint8Array) {
        nativeImg = nativeImage.createFromBuffer(Buffer.from(img))
      }
      if (nativeImg && !nativeImg.isEmpty()) {
        clipboard.writeImage(nativeImg)
        event.returnValue = true
      } else {
        event.returnValue = false
      }
    })

    ipcMain.on('hide-main-window-paste-file', (event, filePaths: string | string[]) => {
      if (!filePaths) {
        event.returnValue = false
        return
      }
      let files = Array.isArray(filePaths) ? filePaths : [filePaths]
      files = files.filter((f) => fs.existsSync(f))
      if (files.length === 0) {
        event.returnValue = false
        return
      }
      clipboard.writeBuffer('public.file-url', Buffer.from(files.join('\n')))
      event.returnValue = true
    })

    ipcMain.on('hide-main-window-type-string', (event, text: string) => {
      if (typeof text !== 'string') {
        event.returnValue = false
        return
      }
      // 写入剪贴板而非模拟键入（缺少原生模块时唯一可行的方案）
      clipboard.writeText(text)
      event.returnValue = true
    })
  }
}

export default new PluginInputAPI()
