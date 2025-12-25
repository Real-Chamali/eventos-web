import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/dashboard',
          '/dashboard/quotes',
          '/dashboard/clients',
          '/dashboard/events',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/quotes/[id]/edit',
          '/dashboard/quotes/new',
          '/dashboard/clients/new',
          '/dashboard/settings',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/dashboard',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/*/edit',
          '/dashboard/*/new',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

