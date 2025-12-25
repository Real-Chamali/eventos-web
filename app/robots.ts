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
          '/dashboard/calendar',
          '/dashboard/analytics',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/quotes/*/edit',
          '/dashboard/quotes/new',
          '/dashboard/clients/new',
          '/dashboard/settings',
          '/dashboard/*/edit',
          '/dashboard/*/new',
          '/login',
          '/offline',
        ],
      },
      {
        userAgent: 'Googlebot',
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
          '/dashboard/*/edit',
          '/dashboard/*/new',
          '/dashboard/settings',
          '/login',
        ],
      },
      {
        userAgent: 'Bingbot',
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
          '/dashboard/*/edit',
          '/dashboard/*/new',
          '/dashboard/settings',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

