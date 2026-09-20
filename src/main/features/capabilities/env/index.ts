import log from 'electron-log/main'
import { envService } from './EnvService'

export function initEnvCapability(): void {
  log.info('[env] capability ready')
}

export { envService }
