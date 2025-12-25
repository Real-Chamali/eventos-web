import type { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'
import EventsPageClient from './EventsPageClient'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Eventos',
  description: 'Gestiona todos tus eventos. Visualiza, crea y administra eventos de clientes',
  path: '/dashboard/events',
  keywords: ['eventos', 'calendario', 'gestión', 'CRM'],
})

export default function EventsPage() {
  return <EventsPageClient />
}
