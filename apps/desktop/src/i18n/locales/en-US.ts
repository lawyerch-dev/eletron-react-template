const enUS = {
  // Sidebar
  'sidebar.home': 'Home',
  'sidebar.settings': 'Settings',
  'sidebar.about': 'About',
  'sidebar.collapse': 'Collapse',
  'sidebar.expand': 'Expand',

  // Theme
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',
  'theme.select': 'Choose Theme',

  // Language
  'language.zh-CN': '中文',
  'language.en-US': 'English',
  'language.select': 'Choose Language',

  // Page titles
  'page.home': 'Home',
  'page.settings': 'Settings',
  'page.about': 'About',
  'page.plugins': 'Plugins',
  'page.plugin-market': 'Solutions',
  'page.my-plugins': 'My Products',

  // Sidebar (plugins)
  'sidebar.plugin-market': 'Solutions',
  'sidebar.my-plugins': 'My Products',

  // Plugin Market
  'market.title': 'Solutions',
  'market.search': 'Search solutions...',
  'market.refresh': 'Refresh',
  'market.loading': 'Loading solutions...',
  'market.empty': 'No solutions available',
  'market.failed': 'Failed to load solutions. Check your network and try again.',
  'market.install': 'Install',
  'market.installing': 'Installing',
  'market.installed': 'Installed',
  'market.uninstall': 'Uninstall',
  'market.downloading': 'Downloading',
  'market.error': 'Failed to load',
  'market.author': 'Author',
  'market.launch': 'Launch',
  'market.detail': 'Details',
  'market.commands': 'Commands',
  'market.import': 'Import Product',
  'market.import.tip': 'Select a .zpx or .zip product file',
  'market.import.success': 'Product imported successfully',
  'market.import.failed': 'Failed to import product',
  'market.toast.installed': 'Product "{title}" installed successfully',
  'market.total': '{count} solutions total',
  'market.category.all': 'All',
  'market.downloads': '{count} downloads',
  'market.detail.author': 'Author',
  'market.detail.version': 'Version',
  'market.detail.downloads': 'Downloads',
  'market.detail.downloads.value': '{count}',
  'market.detail.no-readme': 'No details available',
  'market.uninstall.success': 'Product "{title}" uninstalled',
  'market.launch.failed': 'Launch failed',

  // My Plugins
  'myplugins.title': 'My Products',
  'myplugins.empty': 'No products yet. Browse the Solutions to get started.',
  'myplugins.empty.cta': 'Go to Solutions',
  'myplugins.count': '{count} products installed',
  'myplugins.version': 'v{version}',
  'myplugins.running': 'Running',
  'myplugins.not-running': 'Not running',
  'myplugins.stop': 'Stop',
  'myplugins.status': 'Status',
  'myplugins.uninstall.confirm': 'Uninstall product "{title}"?',
  'myplugins.uninstall.desc': 'The product files will be deleted. This cannot be undone.',
  'myplugins.builtin': 'Built-in',
  'myplugins.author': 'Author',

  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',

  // Home
  'home.badge': 'Electron + Vite + React + Tailwind',
  'home.hero.title': 'Modern starter, cleaner rhythm, unified visual language.',
  'home.hero.desc':
    'Refined spacing, balanced contrast, and consistent cards make the page feel more polished while keeping all demo functionality intact.',
  'home.hero.repo': 'Open project repository',
  'home.counter.title': 'Counter demo',
  'home.counter.btn': 'Increment counter',
  'home.counter.hint': 'Edit src/App.tsx and save to test HMR.',
  'home.card.assets.title': 'Public assets',
  'home.card.assets.desc': 'Place static files into the /public folder.',
  'home.card.tailwind.title': 'Tailwind system',
  'home.card.tailwind.desc':
    'Unified utility classes now drive layout, hierarchy, and component consistency across the app.',
  'home.card.update.title': 'Update panel',
  'home.card.update.desc':
    'Built-in updater UI follows the same spacing and typography rules for a more harmonious experience.',

  // Settings
  'settings.title': 'Settings',
  'settings.desc': 'Manage app preferences',

  // About
  'about.title': 'About',
  'about.desc': 'Project info and tech stack',
  'about.name': 'eletron-react-template',
  'about.intro':
    'An Electron + React + TypeScript desktop app template based on electron-vite-react.',
  'about.stack': 'Tech stack',
  'about.repo': 'GitHub repository',
  'about.docs': 'Documentation',
  'about.pluginMarket': 'Solutions',
  'about.pluginMarketDesc':
    'This app extends its features through solutions for on-demand integration of various capabilities.',

  // Update
  'update.check': 'Check update',
  'update.checking': 'Checking...',
  'update.title': 'Updater',
  'update.cancel': 'Cancel',
  'update.ok': 'Update',
  'update.later': 'Later',
  'update.install': 'Install now',
  'update.error': 'Error downloading the latest version.',
  'update.latest': 'The latest version is v{version}',
  'update.progress': 'Update progress:',

  // Log
  'log.title': 'Application Logs',
  'log.refresh': 'Refresh',
  'log.clear': 'Clear',
  'log.auto': 'Auto refresh',
  'log.manual': 'Manual',
  'log.empty': 'No logs yet',
  'log.search': 'Search logs...',
  'log.allLevels': 'All levels',
  'log.source.all': 'All',
  'log.source.main': 'Main',
  'log.source.renderer': 'Renderer',
  'log.source.plugin': 'Plugin',
  'log.copy': 'Copy',
  'log.export': 'Export',
  'log.copied': 'Copied to clipboard',
  'log.exported': 'Logs exported',
  'log.cleared': 'Logs cleared',
  'log.refreshed': 'Logs refreshed',

  // Error boundary
  'error.boundary.title': 'Something went wrong',
  'error.boundary.desc': 'An error occurred while rendering',
  'error.boundary.reload': 'Reload',
  'error.boundary.copy': 'Copy error',
} as const

export default enUS
