const zhCN = {
  // 侧边栏
  'sidebar.home': '首页',
  'sidebar.settings': '设置',
  'sidebar.about': '关于',
  'sidebar.collapse': '折叠',
  'sidebar.expand': '展开',

  // 主题
  'theme.light': '浅色',
  'theme.dark': '暗色',
  'theme.system': '系统',
  'theme.select': '选择主题',

  // 语言
  'language.zh-CN': '中文',
  'language.en-US': 'English',
  'language.select': '选择语言',

  // 页面标题
  'page.home': '首页',
  'page.settings': '设置',
  'page.about': '关于',
  'page.plugins': '插件管理',
  'page.plugin-market': '插件市场',
  'page.my-plugins': '我的插件',

  // 侧边栏（插件）
  'sidebar.plugin-market': '插件市场',
  'sidebar.my-plugins': '我的插件',

  // 插件市场
  'market.title': '插件市场',
  'market.search': '搜索插件...',
  'market.refresh': '刷新',
  'market.loading': '正在加载插件市场...',
  'market.empty': '暂无可用插件',
  'market.failed': '插件市场加载失败，请检查网络后重试',
  'market.install': '安装',
  'market.installing': '安装中',
  'market.installed': '已安装',
  'market.uninstall': '卸载',
  'market.downloading': '下载中',
  'market.error': '加载失败',
  'market.author': '作者',
  'market.launch': '启动',
  'market.detail': '详情',
  'market.commands': '指令列表',
  'market.import': '导入插件',
  'market.import.tip': '选择 .zpx 或 .zip 插件文件',
  'market.import.success': '插件导入成功',
  'market.import.failed': '插件导入失败',
  'market.toast.installed': '插件 "{title}" 安装成功',

  // 我的插件
  'myplugins.title': '我的插件',
  'myplugins.empty': '还没有安装任何插件，去插件市场看看吧',
  'myplugins.empty.cta': '前往插件市场',
  'myplugins.count': '已安装 {count} 个插件',
  'myplugins.version': 'v{version}',
  'myplugins.running': '运行中',
  'myplugins.not-running': '未运行',
  'myplugins.stop': '停止',
  'myplugins.status': '状态',
  'myplugins.uninstall.confirm': '确定卸载插件 "{title}" 吗？',
  'myplugins.uninstall.desc': '将删除插件文件，此操作不可撤销。',
  'myplugins.builtin': '内置',
  'myplugins.author': '作者',

  // 通用
  'common.loading': '加载中...',
  'common.error': '错误',
  'common.success': '成功',

  // 首页
  'home.badge': 'Electron + Vite + React + Tailwind',
  'home.hero.title': '现代脚手架，更舒适的节奏，统一的视觉语言。',
  'home.hero.desc': '精调间距、均衡对比与一致的卡片风格，让页面更精致，同时保留全部演示功能。',
  'home.hero.repo': '打开项目仓库',
  'home.counter.title': '计数器演示',
  'home.counter.btn': '点击计数',
  'home.counter.hint': '编辑 src/App.tsx 并保存以测试 HMR。',
  'home.card.assets.title': '静态资源',
  'home.card.assets.desc': '将静态文件放入 /public 文件夹。',
  'home.card.tailwind.title': 'Tailwind 体系',
  'home.card.tailwind.desc': '统一的工具类驱动布局、层级与组件一致性。',
  'home.card.update.title': '更新面板',
  'home.card.update.desc': '内置更新 UI 遵循相同的间距与排版规则，体验更和谐。',

  // 设置页
  'settings.title': '设置',
  'settings.desc': '管理应用偏好',

  // 关于页
  'about.title': '关于',
  'about.desc': '项目信息和技术栈',
  'about.name': 'eletron-react-template',
  'about.intro':
    '基于 electron-vite-react 模板二次开发的 Electron + React + TypeScript 桌面应用模板。',
  'about.stack': '技术栈',
  'about.repo': 'GitHub 仓库',
  'about.docs': '文档站点',
  'about.pluginMarket': '插件市场',
  'about.pluginMarketDesc': '本应用的插件系统基于 ZTools 开发，兼容 ZTools 插件生态。',
  'about.ztoolsRepo': 'ZTools 开源仓库',

  // 更新
  'update.check': '检查更新',
  'update.checking': '检查中...',
  'update.title': '更新程序',
  'update.cancel': '取消',
  'update.ok': '更新',
  'update.later': '稍后',
  'update.install': '立即安装',
  'update.error': '下载最新版本时出错。',
  'update.latest': '最新版本为 v{version}',
  'update.progress': '更新进度：',

  // 日志
  'log.title': '应用日志',
  'log.refresh': '刷新',
  'log.clear': '清空',
  'log.auto': '自动刷新',
  'log.manual': '手动',
  'log.empty': '暂无日志',
  'log.search': '搜索日志...',
  'log.allLevels': '全部级别',
  'log.copy': '复制',
  'log.export': '导出',
  'log.copied': '已复制到剪贴板',
  'log.exported': '日志已导出',
  'log.cleared': '日志已清空',
  'log.refreshed': '日志已刷新',
} as const

export default zhCN
