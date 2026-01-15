'use client'

/**
 * Componente para agregar Structured Data (JSON-LD) a las páginas
 * Mejora el SEO y la visibilidad en motores de búsqueda
 */

import { generateOrganizationSchema, generateEventSchema, generateQuoteSchema, generateWebSiteSchema, generateBreadcrumbSchema } from '@/lib/utils/structuredData'

interface StructuredDataProps {
  type: 'organization' | 'event' | 'quote' | 'website' | 'breadcrumb'
  data: unknown
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  let schema: object

  switch (type) {
    case 'organization':
      schema = generateOrganizationSchema(data)
      break
    case 'event':
      schema = generateEventSchema(data)
      break
    case 'quote':
      schema = generateQuoteSchema(data)
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
