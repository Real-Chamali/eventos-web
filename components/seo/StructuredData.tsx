'use client'

/**
 * Componente para agregar Structured Data (JSON-LD) a las páginas
 * Mejora el SEO y la visibilidad en motores de búsqueda
 */

import {
  generateOrganizationSchema,
  generateEventSchema,
  generateQuoteSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  type OrganizationStructuredData,
  type EventStructuredData,
  type QuoteStructuredData,
} from '@/lib/utils/structuredData'
import type { QuoteSeoStructuredData, OrganizationSeoStructuredData } from '@/lib/utils/seo'
type WebSiteStructuredData = {
  name: string
  url: string
  description?: string
  potentialAction?: {
    target: string
    'query-input': string
  }
}

type BreadcrumbItem = { name: string; url: string }

const isJsonLd = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && '@context' in value
}

type StructuredDataProps =
  | { type: 'organization'; data: OrganizationStructuredData | OrganizationSeoStructuredData }
  | { type: 'event'; data: EventStructuredData }
  | { type: 'quote'; data: QuoteStructuredData | QuoteSeoStructuredData }
  | { type: 'website'; data: WebSiteStructuredData }
  | { type: 'breadcrumb'; data: BreadcrumbItem[] }

export default function StructuredData({ type, data }: StructuredDataProps) {
  let schema: object

  switch (type) {
    case 'organization':
      schema = isJsonLd(data) ? data : generateOrganizationSchema(data as OrganizationStructuredData)
      break
    case 'event':
      schema = generateEventSchema(data)
      break
    case 'quote':
      schema = isJsonLd(data) ? data : generateQuoteSchema(data as QuoteStructuredData)
      break
    case 'website':
      schema = generateWebSiteSchema(data)
      break
    case 'breadcrumb':
      schema = generateBreadcrumbSchema(data)
      break
    default:
      return null
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}
