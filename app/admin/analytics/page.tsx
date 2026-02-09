import type { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'
import AnalyticsClient from './AnalyticsClient'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Analytics de Negocio',
  description: 'Panel analítico con métricas clave de negocio y rendimiento',
  path: '/admin/analytics',
})

export default function AnalyticsPage() {
  return <AnalyticsClient />
}
