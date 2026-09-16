import { protocol } from 'electron'

/** 注册插件图标相关自定义协议（须在 app ready 前调用） */
export function registerShellProtocols(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'plugin-icon',
      privileges: {
        bypassCSP: true,
        secure: true,
        standard: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: false,
      },
    },
    {
      // 市场远程图标代理
      scheme: 'market-icon',
      privileges: {
        bypassCSP: true,
        secure: true,
        standard: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: false,
      },
    },
  ])
}
