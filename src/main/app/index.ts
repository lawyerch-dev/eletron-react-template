import { initLogging, logFromMain, type LogEntry } from './logging'
import { registerShellProtocols } from './protocols'
import { initAppRoot, getAppRoot, paths } from './paths'
import {
  bootstrapServices,
  disposeServices,
  getService,
  listServices,
  registerService,
  type MainService,
} from './serviceRegistry'
import { registerDefaultServices } from './defaultServices'
import {
  windowManager,
  windowRegistry,
  getWindowTypeConfig,
  type OpenWindowOptions,
  type WindowMode,
  type WindowType,
  type WindowTypeConfig,
} from './window'

export {
  initLogging,
  logFromMain,
  type LogEntry,
  registerShellProtocols,
  initAppRoot,
  getAppRoot,
  paths,
  bootstrapServices,
  disposeServices,
  getService,
  listServices,
  registerService,
  type MainService,
  registerDefaultServices,
  windowManager,
  windowRegistry,
  getWindowTypeConfig,
  type OpenWindowOptions,
  type WindowMode,
  type WindowType,
  type WindowTypeConfig,
}
