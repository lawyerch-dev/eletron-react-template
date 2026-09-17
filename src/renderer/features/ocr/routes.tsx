import type { RouteObject } from 'react-router-dom'
import { OcrPage } from './OcrPage'

export function getOcrRoutes(): RouteObject[] {
  return [{ path: 'ocr', element: <OcrPage /> }]
}

export function getOcrNavItems() {
  return [{ to: '/ocr', iconKey: 'scan' as const, labelKey: 'sidebar.ocr' }]
}
