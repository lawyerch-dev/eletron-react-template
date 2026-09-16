import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/shell/contexts/ThemeContext'
import { LanguageProvider } from '@/shell/contexts/LanguageContext'
import { ErrorBoundary } from '@/shell/common/ErrorBoundary'
import { router } from '@/routes'
import { initLogger } from '@/utils/logger'

// 初始化渲染进程日志捕获
initLogger()

import '@/styles/index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <RouterProvider router={router} />
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
