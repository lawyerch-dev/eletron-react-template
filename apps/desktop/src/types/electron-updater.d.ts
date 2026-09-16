interface VersionInfo {
  update: boolean
  version: string
  newVersion?: string
}

interface ErrorType {
  message: string
  error: Error
}

interface Window {
  ipcRenderer: {
    on(
      channel: string,
      listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void,
    ): void
    off(channel: string, ...args: unknown[]): void
    send(channel: string, ...args: unknown[]): void
    invoke(channel: string, ...args: unknown[]): Promise<unknown>
  }
}
