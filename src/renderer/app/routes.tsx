import { createHashRouter } from 'react-router-dom'
import { AppLayout } from '@/shell/layout/AppLayout'
import { Home } from '@/features/home'
import { Settings } from '@/features/settings'
import { About } from '@/features/about'
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
