/**
 * 插件运行时全局 API 类型。
 * 宿主在 plugin-preload.js 中挂载为 `window.host`。
 */

export interface HostPluginEnterParams {
  type?: string
  code?: string
  payload?: unknown
  [key: string]: unknown
}

export interface HostThemeInfo {
  isDark?: boolean
  primaryColor?: string
  customColor?: string
  windowMaterial?: string
  [key: string]: unknown
}

export interface HostDbDoc {
  _id?: string
  _rev?: string
  [key: string]: unknown
}

export interface HostDbAttachment {
  type?: string
  data?: unknown
  [key: string]: unknown
}

export interface HostDbApi {
  put(doc: HostDbDoc): unknown
  get(id: string): unknown
  remove(docOrId: string | HostDbDoc): unknown
  bulkDocs(docs: HostDbDoc[]): unknown
  allDocs(key?: string | Record<string, unknown>): unknown
  postAttachment(id: string, attachment: HostDbAttachment, type?: string): unknown
  getAttachment(id: string): unknown
  getAttachmentType(id: string): unknown
  promises: {
    put(doc: HostDbDoc): Promise<unknown>
    get(id: string): Promise<unknown>
    remove(docOrId: string | HostDbDoc): Promise<unknown>
    bulkDocs(docs: HostDbDoc[]): Promise<unknown>
    allDocs(key?: string | Record<string, unknown>): Promise<unknown>
    postAttachment(id: string, attachment: HostDbAttachment, type?: string): Promise<unknown>
    getAttachment(id: string): Promise<unknown>
    getAttachmentType(id: string): Promise<unknown>
  }
}

export interface HostDbStorageApi {
  setItem(key: string, value: unknown): unknown
  getItem(key: string): unknown
  removeItem(key: string): unknown
}

export interface HostApi {
  // 应用 / 平台
  getAppName(): string
  getAppVersion(): string
  getPlatform(): string
  isMacOs(): boolean
  isMacOS(): boolean
  isWindows(): boolean
  isLinux(): boolean
  isDev(): boolean
  getNativeId(): string
  getWindowType(): string
  isDarkColors(): boolean
  getUser(): unknown
  getUserTempToken(): Promise<unknown>
  getPath(name: string): string
  getPathForFile(file: File): string

  // 主题
  getThemeInfo(): HostThemeInfo
  onThemeChange(callback: (theme: HostThemeInfo) => void): void

  // 生命周期
  onPluginEnter(callback: (params: HostPluginEnterParams) => void): void | Promise<void>
  onPluginOut(callback: (payload?: unknown) => void): void | Promise<void>
  onPluginDetach(callback: (payload?: unknown) => void): void | Promise<void>
  onPluginReady(callback: (params: HostPluginEnterParams) => void): void | Promise<void>
  onMainPush(callback: (payload: unknown) => void, selectCallback?: (item: unknown) => void): void

  // UI
  showNotification(body: string | Record<string, unknown>): Promise<unknown> | unknown
  showToast(
    message: string,
    options?: { duration?: number; type?: string; [key: string]: unknown },
  ): Promise<unknown>
  setExpendHeight(height: number): Promise<unknown>
  setSubInput(
    onChange: ((value: string) => void) | null,
    placeholder?: string,
    isFocus?: boolean,
  ): Promise<unknown>
  removeSubInput(): Promise<unknown>
  setSubInputValue(text: string): Promise<unknown>
  subInputFocus(): unknown
  subInputBlur(): unknown
  subInputSelect(): unknown

  // 存储
  db: HostDbApi
  dbStorage: HostDbStorageApi

  // 剪贴板 / 文件 / Shell（部分 API 由 preload 扩展）
  copyText?(text: string): unknown
  copyImage?(base64Url: string): unknown
  copyFile?(path: string): unknown
  shellOpenExternal?(url: string): unknown
  shellOpenPath?(path: string): unknown
  shellShowItemInFolder?(path: string): unknown
  showOpenDialog?(options: Record<string, unknown>): Promise<unknown> | unknown
  showSaveDialog?(options: Record<string, unknown>): Promise<unknown> | unknown
  createBrowserWindow?(url: string, options?: Record<string, unknown>): unknown
  outPlugin?(kill?: boolean): unknown

  // 服务 Provider（如 OCR）
  registerProvider?(
    type: string,
    handler: (input: Record<string, unknown>) => Promise<unknown> | unknown,
  ): void
  providers?: {
    invokeProvider(type: string, input: Record<string, unknown>): Promise<unknown>
    getProviders(type?: string): Promise<unknown[]>
  }

  [key: string]: unknown
}

declare global {
  interface Window {
    /** 宿主插件 API（plugin-preload 注入） */
    host?: HostApi
  }
}

export {}
