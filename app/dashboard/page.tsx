import type { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'
import DashboardPageClient from './DashboardPageClient'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Dashboard',
  description: 'Panel principal con estadísticas, cotizaciones recientes y métricas avanzadas',
  path: '/dashboard',
})

export default function DashboardPage() {
  return <DashboardPageClient />
}
