/**
 * Utilidades para SEO y Metadata
 * Funciones helper para generar metadata dinámica
 */

import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const siteName = 'Eventos CRM'
const defaultDescription = 'Sistema completo de gestión de eventos, cotizaciones y clientes'
const defaultImage = `${baseUrl}/icon-512.png`

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
  keywords,
  publishedTime,
  modifiedTime,
  authors,
}: {
  title: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  noIndex?: boolean
  keywords?: string[]
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
}): Metadata {
  const url = `${baseUrl}${path}`
  // Usar imagen OG dinámica si no se proporciona una imagen específica
  const ogImage = image || (path ? `${baseUrl}/api/og-image?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}` : defaultImage)
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`

  const metadata: Metadata = {
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
      creator: '@eventoscrm',
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

  // Agregar keywords si se proporcionan
  if (keywords && keywords.length > 0) {
    metadata.keywords = keywords
  }

  // Agregar información de artículo si es tipo article
  if (type === 'article') {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors && authors.length > 0 && { authors }),
    }
  }

  return metadata
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
export interface QuoteSeoStructuredData {
  '@context': string
  '@type': string
  identifier: string
  customer: {
    '@type': string
    name: string
  }
  totalPaymentDue: {
    '@type': string
    currency: string
    value: number
  }
  status: string
  dateCreated?: string
  scheduledPaymentDate?: string
  dateModified?: string
  paymentStatus?: string
  itemListElement?: Array<{
    '@type': string
    position: number
    item: {
      '@type': string
      name: string
      quantity: number
      price: {
        '@type': string
        currency: string
        value: number
      }
    }
  }>
}

export function generateQuoteStructuredData(quote: {
  id: string
  clientName: string
  totalPrice: number
  status: string
  createdAt: string
  eventDate?: string
  updatedAt?: string
  services?: Array<{
    name: string
    quantity: number
    price: number
  }>
}): QuoteSeoStructuredData {
  const structuredData: QuoteSeoStructuredData = {
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

  // Agregar fecha de modificación si existe
  if (quote.updatedAt) {
    structuredData.dateModified = quote.updatedAt
  }

  // Agregar items si se proporcionan
  if (quote.services && quote.services.length > 0) {
    structuredData.itemListElement = quote.services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: service.name,
        quantity: service.quantity,
        price: {
          '@type': 'MonetaryAmount',
          currency: 'MXN',
          value: service.price,
        },
      },
    }))
  }

  return structuredData
}

/**
 * Genera structured data JSON-LD para organización
 */
export interface OrganizationSeoStructuredData {
  '@context': string
  '@type': 'Organization'
  name: string
  url: string
  logo: {
    '@type': 'ImageObject'
    url: string
    width: number
    height: number
  }
  description: string
  sameAs: string[]
}

export function generateOrganizationStructuredData(): OrganizationSeoStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/icon-512.png`,
      width: 512,
      height: 512,
    },
    description: defaultDescription,
    sameAs: [
      // Agregar redes sociales aquí si las tienes
      // 'https://twitter.com/eventoscrm',
      // 'https://facebook.com/eventoscrm',
    ],
  }
}

/**
 * Genera structured data JSON-LD para BreadcrumbList
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Genera structured data JSON-LD para WebSite con SearchAction
 */
export function generateWebSiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: baseUrl,
    description: defaultDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/dashboard/quotes?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

