import log from 'electron-log/main'

/**
 * 主进程轻量服务契约。
 * 有长资源 / 持久副作用的服务实现此接口并 registerService。
 * 无状态工具仍用具名导出，不必注册。
 */
export interface MainService {
  readonly name: string
  init?(): void | Promise<void>
  dispose?(): void
}

const services: MainService[] = []
const byName = new Map<string, MainService>()
let bootstrapped = false
let disposed = false

/** 注册服务；bootstrap 前可多次调用，重复 name 直接抛错。 */
export function registerService(service: MainService): void {
  if (bootstrapped) {
    throw new Error(`Cannot register service after bootstrap: ${service.name}`)
  }
  if (byName.has(service.name)) {
    throw new Error(`Service already registered: ${service.name}`)
  }
  services.push(service)
  byName.set(service.name, service)
}

export function getService(name: string): MainService | undefined {
  return byName.get(name)
}

export function listServices(): readonly MainService[] {
  return services
}

/** 按注册顺序 init；任一失败则已 init 的服务 dispose 后重抛。 */
export async function bootstrapServices(): Promise<void> {
  if (bootstrapped) return
  bootstrapped = true

  const started: MainService[] = []
  for (const service of services) {
    try {
      await service.init?.()
      started.push(service)
      log.info(`[services] ready: ${service.name}`)
    } catch (error) {
      log.error(`[services] init failed: ${service.name}`, error)
      for (const s of [...started].reverse()) {
        try {
          s.dispose?.()
        } catch {
          // ignore secondary dispose errors
        }
      }
      throw error
    }
  }
}

/** 逆序 dispose；可重复调用（幂等）。 */
export function disposeServices(): void {
  if (disposed) return
  disposed = true
  for (const service of [...services].reverse()) {
    try {
      service.dispose?.()
      log.info(`[services] disposed: ${service.name}`)
    } catch (error) {
      log.error(`[services] dispose failed: ${service.name}`, error)
    }
  }
}

/** 测试用：重置注册表（勿在生产路径调用）。 */
export function __resetServiceRegistryForTests(): void {
  services.length = 0
  byName.clear()
  bootstrapped = false
  disposed = false
}
