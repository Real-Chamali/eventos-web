import type { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'
import ClientsPageClient from './ClientsPageClient'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Clientes',
  description: 'Gestiona tu base de clientes. Visualiza, edita y administra información de clientes',
  path: '/dashboard/clients',
  keywords: ['clientes', 'gestión', 'CRM', 'eventos'],
})

export default function ClientsPage() {
  return <ClientsPageClient />
}
