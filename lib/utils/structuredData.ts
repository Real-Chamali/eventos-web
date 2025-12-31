/**
 * Structured Data (JSON-LD) para SEO
 * 
 * Genera datos estructurados para mejorar el SEO y la visibilidad
 * en motores de búsqueda y redes sociales
 */

export interface OrganizationStructuredData {
  name: string
  url: string
  logo?: string
  description?: string
  contactPoint?: {
    telephone?: string
    contactType?: string
    email?: string
  }
}

export interface EventStructuredData {
  name: string
  startDate: string
  endDate?: string
  location?: {
    name?: string
    address?: string
  }
  description?: string
  organizer?: {
    name: string
    url?: string
  }
}

export interface QuoteStructuredData {
  name: string
  description?: string
  price: number
  currency?: string
  validFrom?: string
  validThrough?: string
  availability?: string
}

/**
 * Genera JSON-LD para una organización
 */
export function generateOrganizationSchema(data: OrganizationStructuredData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    ...(data.logo && { logo: data.logo }),
    ...(data.description && { description: data.description }),
    ...(data.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        ...(data.contactPoint.telephone && { telephone: data.contactPoint.telephone }),
        ...(data.contactPoint.contactType && { contactType: data.contactPoint.contactType }),
        ...(data.contactPoint.email && { email: data.contactPoint.email }),
      },
    }),
  }
}

/**
 * Genera JSON-LD para un evento
 */
export function generateEventSchema(data: EventStructuredData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: data.name,
    startDate: data.startDate,
    ...(data.endDate && { endDate: data.endDate }),
    ...(data.location && {
      location: {
        '@type': 'Place',
        ...(data.location.name && { name: data.location.name }),
        ...(data.location.address && { address: data.location.address }),
      },
    }),
    ...(data.description && { description: data.description }),
    ...(data.organizer && {
      organizer: {
        '@type': 'Organization',
        name: data.organizer.name,
        ...(data.organizer.url && { url: data.organizer.url }),
      },
    }),
  }
}

/**
 * Genera JSON-LD para una cotización/offer
 */
export function generateQuoteSchema(data: QuoteStructuredData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: data.name,
    ...(data.description && { description: data.description }),
    price: data.price,
    priceCurrency: data.currency || 'MXN',
    ...(data.validFrom && { priceValidFrom: data.validFrom }),
    ...(data.validThrough && { priceValidThrough: data.validThrough }),
    ...(data.availability && { availability: data.availability }),
  }
}

/**
 * Genera JSON-LD para el sitio web
 */
export function generateWebSiteSchema(data: {
  name: string
  url: string
  description?: string
  potentialAction?: {
    target: string
    'query-input': string
  }
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    url: data.url,
    ...(data.description && { description: data.description }),
    ...(data.potentialAction && {
      potentialAction: {
        '@type': 'SearchAction',
        target: data.potentialAction.target,
        'query-input': data.potentialAction['query-input'],
      },
    }),
  }
}

/**
 * Genera JSON-LD para breadcrumbs
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): object {
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

