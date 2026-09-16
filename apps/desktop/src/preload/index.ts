import { ipcRenderer, contextBridge } from 'electron'
import { IpcChannel } from '@shared/ipc'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// --------- 日志事件监听 ---------
contextBridge.exposeInMainWorld('logEvents', {
  onLogEntry: (cb: (entry: unknown) => void) => {
    const handler = (_e: unknown, entry: unknown) => cb(entry)
    ipcRenderer.on(IpcChannel.LogEntry, handler)
    return () => ipcRenderer.removeListener(IpcChannel.LogEntry, handler)
  },
  sendLog: (entry: unknown) => ipcRenderer.invoke(IpcChannel.LogFromRenderer, entry),
})

// --------- 插件市场 / 插件管理 API ---------
contextBridge.exposeInMainWorld('plugin', {
  marketList: () => ipcRenderer.invoke(IpcChannel.PluginMarketList),
  marketRecommendations: (limit?: number) =>
    ipcRenderer.invoke(IpcChannel.PluginMarketRecommendations, limit),
  marketReadme: (pluginName: string) =>
    ipcRenderer.invoke(IpcChannel.PluginMarketReadme, pluginName),
  marketClearCache: () => ipcRenderer.invoke(IpcChannel.PluginMarketClearCache),
  installFromMarket: (plugin: unknown) =>
    ipcRenderer.invoke(IpcChannel.PluginMarketInstall, plugin),
  installFromFile: () => ipcRenderer.invoke(IpcChannel.PluginImportFromFile),
  cancelDownload: (name: string) => ipcRenderer.invoke(IpcChannel.PluginMarketCancel, name),
  listInstalled: () => ipcRenderer.invoke(IpcChannel.PluginList),
  deletePlugin: (pluginPath: string) => ipcRenderer.invoke(IpcChannel.PluginDelete, pluginPath),
  launch: (pluginPath: string) => ipcRenderer.invoke(IpcChannel.PluginLaunch, pluginPath),
  closePlugin: (pluginPath: string) => ipcRenderer.invoke(IpcChannel.PluginClose, pluginPath),
  runningPlugins: () => ipcRenderer.invoke(IpcChannel.PluginRunning),
  onPluginsChanged: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on(IpcChannel.PluginsChanged, handler)
    return () => ipcRenderer.removeListener(IpcChannel.PluginsChanged, handler)
  },
  onDownloadProgress: (cb: (payload: unknown) => void) => {
    const handler = (_e: unknown, payload: unknown) => cb(payload)
    ipcRenderer.on(IpcChannel.PluginMarketDownloadProgress, handler)
    return () => ipcRenderer.removeListener(IpcChannel.PluginMarketDownloadProgress, handler)
  },
  onToast: (cb: (payload: unknown) => void) => {
    const handler = (_e: unknown, payload: unknown) => cb(payload)
    ipcRenderer.on(IpcChannel.PluginToast, handler)
    return () => ipcRenderer.removeListener(IpcChannel.PluginToast, handler)
  },
})

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  if (ev.data.payload === 'removeLoading') removeLoading()
}

setTimeout(removeLoading, 4999)
