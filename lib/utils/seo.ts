/**
 * Utilidades para SEO y Metadata
 * Funciones helper para generar metadata dinámica
 */

import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const siteName = 'Eventos CRM'
const defaultDescription = 'Sistema completo de gestión de eventos, cotizaciones y clientes'

/**
 * Genera metadata base con Open Graph y Twitter Cards
 */
export function generateMetadata({
  title,
  description = defaultDescription,
  path = '',
  image,
  type = 'website',
  noIndex = false,
}: {
  title: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}): Metadata {
  const url = `${baseUrl}${path}`
  const ogImage = image || `${baseUrl}/og-image.png`
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type,
      locale: 'es_MX',
      url,
      siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: '@eventoscrm', // Actualizar con tu handle de Twitter si lo tienes
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

/**
 * Genera structured data JSON-LD para eventos
 */
export function generateEventStructuredData(event: {
  id: string
  name: string
  description?: string
  startDate: string
  endDate?: string
  location?: string
  image?: string
  organizer?: {
    name: string
    email?: string
  }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || `Evento: ${event.name}`,
    startDate: event.startDate,
    endDate: event.endDate || event.startDate,
    location: event.location
      ? {
          '@type': 'Place',
          name: event.location,
        }
      : undefined,
    image: event.image || `${baseUrl}/og-image.png`,
    organizer: event.organizer
      ? {
          '@type': 'Organization',
          name: event.organizer.name,
          email: event.organizer.email,
        }
      : {
          '@type': 'Organization',
          name: siteName,
        },
  }
}

/**
 * Genera structured data JSON-LD para cotizaciones
 */
export function generateQuoteStructuredData(quote: {
  id: string
  clientName: string
  totalPrice: number
  status: string
  createdAt: string
  eventDate?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Invoice',
    identifier: quote.id,
    customer: {
      '@type': 'Person',
      name: quote.clientName,
    },
    totalPaymentDue: {
      '@type': 'MonetaryAmount',
      currency: 'MXN',
      value: quote.totalPrice,
    },
    status: quote.status === 'confirmed' ? 'PaymentComplete' : 'PaymentDue',
    dateCreated: quote.createdAt,
    scheduledPaymentDate: quote.eventDate || quote.createdAt,
  }
}

/**
 * Genera structured data JSON-LD para organización
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/icon-512.png`,
    description: defaultDescription,
    sameAs: [
      // Agregar redes sociales aquí si las tienes
      // 'https://twitter.com/eventoscrm',
      // 'https://facebook.com/eventoscrm',
    ],
  }
}

