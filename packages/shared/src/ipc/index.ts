export { IPC_API_EVENT, IPC_API_REQUEST } from './transport'
export { IpcError, toSerializedIpcError, unwrapIpcResult } from './errors'
export type { IpcErrorCode, IpcResult, SerializedIpcError } from './errors'
export type {
  IpcEventMap,
  IpcEventName,
  IpcEventPayload,
  IpcInput,
  IpcOutput,
  IpcRequestMap,
  IpcRoute,
} from './routes'
export type { HostApi, IpcApiBridge } from './bridge'
export {
  CHINA_NPM_REGISTRY,
  CHINA_PYPI_INDEX,
  MCP_SERVER_PRESETS,
  chinaMirrorEnv,
  findMcpPreset,
  seedDefaultMcpServers,
} from '../mcp/presets'
export { buildMcpToolWireId } from '../mcp/toolId'
