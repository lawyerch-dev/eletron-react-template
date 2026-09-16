import { ipcMain, dialog, app } from 'electron'

/**
 * 对话框API - 插件专用
 */
export class PluginDialogAPI {
  public init(): void {
    this.setupIPC()
  }

  private setupIPC(): void {
    ipcMain.on('get-path', (event, name: string) => {
      try {
        let result = ''
        switch (name) {
          case 'home':
          case 'appData':
          case 'userData':
          case 'temp':
          case 'exe':
          case 'desktop':
          case 'documents':
          case 'downloads':
          case 'music':
          case 'pictures':
          case 'videos':
          case 'logs':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = app.getPath(name as any)
            break
          default:
            result = ''
        }
        event.returnValue = result
      } catch {
        event.returnValue = ''
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcMain.on('show-save-dialog', (event, options: any) => {
      try {
        const result = dialog.showSaveDialogSync(options)
        event.returnValue = result || undefined
      } catch {
        event.returnValue = undefined
      }
    })

    ipcMain.on('show-open-dialog', (event, options: Electron.OpenDialogSyncOptions) => {
      try {
        const result = dialog.showOpenDialogSync(options)
        event.returnValue = result || []
      } catch {
        event.returnValue = []
      }
    })
  }
}

export default new PluginDialogAPI()
