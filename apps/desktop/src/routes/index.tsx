import { createHashRouter } from 'react-router-dom'
import { AppLayout } from '@/shell/layout/AppLayout'
import { Home } from '@/shell/pages/Home'
import { Settings } from '@/shell/pages/Settings'
import { About } from '@/shell/pages/About'
import { getCapabilityRoutes } from '@/capabilities'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      ...getCapabilityRoutes(),
      { path: 'settings', element: <Settings /> },
      { path: 'about', element: <About /> },
    ],
  },
])
