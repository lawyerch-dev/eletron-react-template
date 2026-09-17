import type { McpServerConfig, McpServerPreset } from '../types/mcp'

/** 国内可用镜像（stdio 用 npx/uvx 时注入） */
export const CHINA_NPM_REGISTRY = 'https://registry.npmmirror.com'
export const CHINA_PYPI_INDEX = 'https://pypi.tuna.tsinghua.edu.cn/simple'

export function chinaMirrorEnv(): Record<string, string> {
  return {
    npm_config_registry: CHINA_NPM_REGISTRY,
    NPM_CONFIG_REGISTRY: CHINA_NPM_REGISTRY,
    UV_DEFAULT_INDEX: CHINA_PYPI_INDEX,
    UV_INDEX_URL: CHINA_PYPI_INDEX,
    PIP_INDEX_URL: CHINA_PYPI_INDEX,
    PIP_TRUSTED_HOST: 'pypi.tuna.tsinghua.edu.cn',
  }
}

function npxArgs(pkg: string, extra: string[] = []): string[] {
  return ['-y', '--registry', CHINA_NPM_REGISTRY, pkg, ...extra]
}

/** 预设：优先 inMemory（进程内零外网），stdio 走国内镜像 */
export const MCP_SERVER_PRESETS: McpServerPreset[] = [
  {
    id: 'inmemory-filesystem',
    name: '@ert/filesystem',
    description: '进程内文件系统（读/写/列表，沙箱目录），国内零外网依赖',
    type: 'inMemory',
    readyToRun: true,
    category: 'local',
    shouldConfig: true,
  },
  {
    id: 'inmemory-memory',
    name: '@ert/memory',
    description: '进程内知识图谱记忆（实体/关系/观察）',
    type: 'inMemory',
    readyToRun: true,
    category: 'local',
  },
  {
    id: 'inmemory-fetch',
    name: '@ert/fetch',
    description: '进程内抓取网页文本（可访问国内站点）',
    type: 'inMemory',
    readyToRun: true,
    category: 'web',
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: '官方 stdio 版（经 npmmirror 拉包）',
    type: 'stdio',
    command: 'npx',
    args: npxArgs('@modelcontextprotocol/server-filesystem', ['${HOME}/Documents']),
    readyToRun: true,
    category: 'local',
  },
  {
    id: 'memory',
    name: 'Memory',
    description: '官方 stdio 版（经 npmmirror 拉包）',
    type: 'stdio',
    command: 'npx',
    args: npxArgs('@modelcontextprotocol/server-memory'),
    readyToRun: true,
    category: 'local',
  },
  {
    id: 'fetch',
    name: 'Fetch',
    description: '官方 Python 版（经清华 PyPI）',
    type: 'stdio',
    command: 'uvx',
    args: ['mcp-server-fetch'],
    readyToRun: true,
    category: 'web',
  },
  {
    id: 'time',
    name: 'Time',
    description: '时区与时间（stdio）',
    type: 'stdio',
    command: 'uvx',
    args: ['mcp-server-time'],
    readyToRun: true,
    category: 'local',
  },
  {
    id: 'git',
    name: 'Git',
    description: '本地 Git 仓库（stdio）',
    type: 'stdio',
    command: 'uvx',
    args: ['mcp-server-git', '--repository', '${HOME}'],
    readyToRun: true,
    category: 'dev',
  },
  {
    id: 'everything',
    name: 'Everything (demo)',
    description: '官方示例，验证 stdio 链路',
    type: 'stdio',
    command: 'npx',
    args: npxArgs('@modelcontextprotocol/server-everything'),
    readyToRun: true,
    category: 'dev',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: '本地 SQLite（stdio）',
    type: 'stdio',
    command: 'npx',
    args: npxArgs('@modelcontextprotocol/server-sqlite', ['--db-path', '${HOME}/data.db']),
    readyToRun: false,
    category: 'data',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: '需 Token；github.com 国内可能不稳定',
    type: 'stdio',
    command: 'npx',
    args: npxArgs('@modelcontextprotocol/server-github'),
    requiredEnvKeys: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    readyToRun: false,
    category: 'dev',
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: '需 BRAVE_API_KEY；服务端在国外',
    type: 'stdio',
    command: 'npx',
    args: npxArgs('@modelcontextprotocol/server-brave-search'),
    requiredEnvKeys: ['BRAVE_API_KEY'],
    readyToRun: false,
    category: 'web',
  },
]

export function findMcpPreset(id: string): McpServerPreset | undefined {
  return MCP_SERVER_PRESETS.find((p) => p.id === id)
}

/** 首次 seed：进程内三件套，默认开 memory + fetch */
export function seedDefaultMcpServers(): McpServerConfig[] {
  return [
    {
      id: 'inmemory-filesystem',
      name: '@ert/filesystem',
      type: 'inMemory',
      description: '进程内文件系统（默认沙箱：~/Documents）',
      isActive: false,
      shouldConfig: true,
      installSource: 'builtin',
      args: [],
    },
    {
      id: 'inmemory-memory',
      name: '@ert/memory',
      type: 'inMemory',
      description: '进程内知识图谱记忆',
      isActive: true,
      installSource: 'builtin',
    },
    {
      id: 'inmemory-fetch',
      name: '@ert/fetch',
      type: 'inMemory',
      description: '进程内网页抓取',
      isActive: true,
      installSource: 'builtin',
    },
  ]
}
