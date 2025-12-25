import type { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'
import AdminQuotesPageClient from './AdminQuotesPageClient'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Gestión de Cotizaciones - Admin',
  description: 'Panel de administración para gestionar todas las cotizaciones del sistema',
  path: '/admin/quotes',
  noIndex: true,
})

export default function AdminQuotesPage() {
  return <AdminQuotesPageClient />
}

