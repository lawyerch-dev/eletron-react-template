import log from 'electron-log/main'
import { docService } from './DocService'

export function initDocsCapability(): void {
  log.info('[docs] capability ready (text/md/json/csv/html)')
}

export { docService }
