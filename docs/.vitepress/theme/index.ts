import { h, computed } from 'vue'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HomePage from './components/HomePage.vue'
import DocsToggles from './components/DocsToggles.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    const route = useRoute()
    const isHome = computed(() => {
      const path = route.path.replace(/\/+$/, '')
      return path === '' || path === '/electron-react-template' || path === '/electron-react-template/'
    })

    if (isHome.value) {
      return h(HomePage)
    }

    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(DocsToggles),
    })
  }
}