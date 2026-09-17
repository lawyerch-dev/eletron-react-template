import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC_API_EVENT,
  IPC_API_REQUEST,
  unwrapIpcResult,
  type HostApi,
  type IpcEventName,
  type IpcEventPayload,
  type IpcInput,
  type IpcOutput,
  type IpcResult,
  type IpcRoute,
} from '@ert/shared/ipc'

/** 宿主渲染层唯一 preload 面：类型化 IpcApi。禁止再透传完整 ipcRenderer。 */
const hostApi: HostApi = {
  ipcApi: {
    async request<R extends IpcRoute>(route: R, input: IpcInput<R>): Promise<IpcOutput<R>> {
      const result = (await ipcRenderer.invoke(IPC_API_REQUEST, route, input)) as IpcResult<
        IpcOutput<R>
      >
      // 主进程包了一层 { ok, data | error }，这里必须解包，否则渲染层拿到的是信封对象
      return unwrapIpcResult(result)
    },
    on<E extends IpcEventName>(
      event: E,
      listener: (payload: IpcEventPayload<E>) => void,
    ): () => void {
      const handler = (_e: Electron.IpcRendererEvent, name: string, payload: unknown): void => {
        if (name === event) listener(payload as IpcEventPayload<E>)
      }
      ipcRenderer.on(IPC_API_EVENT, handler)
      return () => {
        ipcRenderer.off(IPC_API_EVENT, handler)
      }
    },
  },
}

contextBridge.exposeInMainWorld('api', hostApi)

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

const { appendLoading, removeLoading } = useLoading()
void domReady().then(appendLoading)

window.onmessage = (ev) => {
  if (ev.data.payload === 'removeLoading') removeLoading()
}

setTimeout(removeLoading, 4999)
