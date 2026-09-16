import { ipcMain, clipboard, nativeImage } from 'electron'
import os from 'os'

/**
 * 剪贴板基础操作API - 插件专用
 */
export class PluginClipboardAPI {
  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    ipcMain.on('copy-text', (event, text: string) => {
      try {
        clipboard.writeText(text)
        event.returnValue = true
      } catch {
        event.returnValue = false
      }
    })

    ipcMain.on('copy-image', (event, image: string | Buffer | Uint8Array) => {
      try {
        let nativeImg: Electron.NativeImage | undefined
        if (typeof image === 'string') {
          if (image.startsWith('data:image/')) {
            nativeImg = nativeImage.createFromDataURL(image)
          } else {
            nativeImg = nativeImage.createFromPath(image)
          }
        } else if (Buffer.isBuffer(image)) {
          nativeImg = nativeImage.createFromBuffer(image)
        } else if (image instanceof Uint8Array) {
          nativeImg = nativeImage.createFromBuffer(Buffer.from(image))
        } else {
          throw new Error('不支持的图片类型')
        }
        if (nativeImg && !nativeImg.isEmpty()) {
          clipboard.writeImage(nativeImg)
          event.returnValue = true
        } else {
          throw new Error('图片为空或无效')
        }
      } catch {
        event.returnValue = false
      }
    })

    ipcMain.on('copy-file', (event, filePath: string | string[]) => {
      try {
        const files = Array.isArray(filePath) ? filePath : [filePath]
        if (os.platform() === 'win32' || os.platform() === 'darwin') {
          clipboard.writeBuffer('public.file-url', Buffer.from(files.join('\n')))
        }
        event.returnValue = true
      } catch {
        event.returnValue = false
      }
    })

    ipcMain.on('get-copyed-files', (event) => {
      try {
        const raw = clipboard.readBuffer('public.file-url')
        const files = raw ? raw.toString('utf-8').split('\n').filter(Boolean) : []
        event.returnValue = files.map((f: string) => ({
          path: f,
          isDirectory: false,
          isFile: true,
          name: f.split(/[/\\]/).pop() || '',
        }))
      } catch {
        event.returnValue = []
      }
    })
  }
}

export default new PluginClipboardAPI()
