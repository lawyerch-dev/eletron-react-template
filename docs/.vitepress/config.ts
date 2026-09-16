import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = 'https://bluerangala.github.io'
const BASE = '/electron-react-template/'
const SITE_NAME = 'Electron React Template'
const SITE_DESC =
  '基于 Electron + React + TypeScript 的桌面应用模板，集成插件系统、主题系统、国际化与自动更新，开箱即用'
const CANONICAL_BASE = SITE_URL + BASE

function jsonLd(pageData: { title?: string; description?: string }, url: string, isHome: boolean) {
  const base = {
    '@context': 'https://schema.org',
    inLanguage: 'zh-CN',
    url,
  }
  if (isHome) {
    return {
      ...base,
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      description: SITE_DESC,
      operatingSystem: 'macOS, Windows, Linux',
      applicationCategory: 'DeveloperApplication',
      softwareVersion: '1.1.0',
      license: 'https://github.com/BluerAngala/electron-react-template/blob/main/LICENSE',
      publisher: { '@type': 'Organization', name: 'BluerAngala' },
    }
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: pageData.title ?? SITE_NAME,
        description: pageData.description ?? SITE_DESC,
        url,
        inLanguage: 'zh-CN',
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        publisher: { '@type': 'Organization', name: 'BluerAngala' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: CANONICAL_BASE },
          { '@type': 'ListItem', position: 2, name: pageData.title ?? SITE_NAME, item: url },
        ],
      },
    ],
  }
}

export default defineConfig({
  base: BASE,
  title: SITE_NAME,
  description: SITE_DESC,
  lang: 'zh-CN',
  lastUpdated: true,

  markdown: {
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
    lineNumbers: false,
  },

  head: [
    ['meta', { name: 'theme-color', content: '#b08947' }],
    ['meta', { name: 'author', content: 'BluerAngala' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: BASE + 'logo.svg' }],
    ['meta', { property: 'og:title', content: SITE_NAME }],
    ['meta', { property: 'og:description', content: SITE_DESC }],
    ['meta', { property: 'og:image', content: CANONICAL_BASE + 'logo.svg' }],
  ],

  transformHead({ pageData }) {
    const rel = (pageData.relativePath ?? '')
      .replace(/\.md$/, '')
      .replace(/\\/g, '/')
      .replace(/^index$/, '')
    const isHome = rel === ''
    const url = CANONICAL_BASE + (isHome ? '' : rel + '.html')
    const title = pageData.title ? `${pageData.title} | ${SITE_NAME}` : SITE_NAME
    const desc = pageData.description ?? SITE_DESC
    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: desc }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: desc }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd(pageData, url, isHome))],
    ]
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: SITE_NAME,

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除',
            backButtonTitle: '返回',
            noResultsText: '未找到相关结果',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },

    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      { text: '功能', link: '/features/plugin-system' },
      { text: '插件开发', link: '/plugin-dev/getting-started' },
      { text: '开发', link: '/development/architecture' },
      { text: 'GitHub', link: 'https://github.com/BluerAngala/electron-react-template' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '目录结构', link: '/guide/directory-structure' },
            { text: '开发工作流', link: '/guide/workflow' },
          ],
        },
      ],
      '/features/': [
        {
          text: '功能',
          items: [
            { text: '插件系统', link: '/features/plugin-system' },
            { text: '主题系统', link: '/features/theme-system' },
            { text: '国际化', link: '/features/i18n' },
            { text: '自动更新', link: '/features/auto-update' },
          ],
        },
      ],
      '/development/': [
        {
          text: '开发',
          items: [
            { text: '架构概览', link: '/development/architecture' },
            { text: 'IPC 通信', link: '/development/ipc' },
            { text: '代码规范', link: '/development/code-style' },
            { text: '构建部署', link: '/development/build-deploy' },
          ],
        },
      ],
      '/plugin-dev/': [
        {
          text: '插件开发',
          items: [
            { text: '快速开始', link: '/plugin-dev/getting-started' },
            { text: 'plugin.json 配置', link: '/plugin-dev/plugin-json' },
            { text: '插件 API 参考', link: '/plugin-dev/plugin-api' },
            { text: 'Preload 脚本', link: '/plugin-dev/preload-js' },
            { text: '目录结构', link: '/plugin-dev/file-structure' },
            { text: '发布插件', link: '/plugin-dev/publish' },
          ],
        },
      ],
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: { dateStyle: 'medium', timeStyle: 'short' },
    },

    editLink: {
      pattern: 'https://github.com/BluerAngala/electron-react-template/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/BluerAngala/electron-react-template' },
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: '版权所有 © BluerAngala',
    },
  },

  vite: {
    plugins: [],
  },

  buildEnd(siteConfig) {
    const urls = siteConfig.pages
      .map((p) => {
        let rel = p.replace(/\.md$/, '').replace(/\\/g, '/')
        rel = rel === 'index' ? '' : rel + '.html'
        return `  <url><loc>${CANONICAL_BASE}${rel}</loc></url>`
      })
      .join('\n')
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls +
      '\n</urlset>\n'
    fs.mkdirSync(siteConfig.outDir, { recursive: true })
    fs.writeFileSync(path.join(siteConfig.outDir, 'sitemap.xml'), xml)
  },
})
