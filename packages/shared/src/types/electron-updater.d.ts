/**
 * @deprecated 全局 Window.ipcRenderer 声明已移除。
 * 渲染层只应使用 window.api.ipcApi（见 HostApi）。
 * VersionInfo / ErrorType 仍供 update 功能局部使用，优先改为从 @ert/shared/types 引入。
 */
interface VersionInfo {
  update: boolean
  version: string
  newVersion?: string
}

interface ErrorType {
  message: string
  error?: { message: string }
}
