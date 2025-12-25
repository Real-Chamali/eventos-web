import type { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'
import CalendarPageClient from './CalendarPageClient'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Calendario',
  description: 'Visualiza todos tus eventos y cotizaciones confirmadas en formato de calendario',
  path: '/dashboard/calendar',
  keywords: ['calendario', 'eventos', 'agenda', 'fechas'],
})

export default function CalendarPage() {
  return <CalendarPageClient />
}
