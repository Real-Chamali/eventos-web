import type { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'
import QuotesPageClient from './QuotesPageClient'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Cotizaciones',
  description: 'Gestiona todas tus cotizaciones. Crea, edita y administra cotizaciones de eventos',
  path: '/dashboard/quotes',
})

export default function QuotesPage() {
  return <QuotesPageClient />
}
