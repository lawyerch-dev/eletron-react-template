import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './providers'
import { router } from './routes'
import { initLogger } from '@/lib/logger'

initLogger()

import '@/styles/index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
