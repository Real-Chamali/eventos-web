import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Forzar dynamic rendering para evitar error de cookies
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidar cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard/quotes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard/clients`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard/analytics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dashboard/calendar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Intentar obtener datos dinámicos (quotes y events)
  // Si falla, solo retornamos las páginas estáticas
  try {
    // Crear cliente sin cookies para evitar problemas de static generation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return staticPages
    }
    
    // Usar cliente directo sin cookies para sitemap
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    
    // Obtener quotes aprobadas (usar enum correcto: APPROVED)
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, updated_at, created_at')
      .eq('status', 'APPROVED')
      .order('updated_at', { ascending: false })
      .limit(100) // Limitar a 100 para no sobrecargar el sitemap

    // Obtener eventos confirmados
    const { data: events } = await supabase
      .from('events')
      .select('id, start_date, updated_at')
      .eq('status', 'confirmed')
      .order('start_date', { ascending: false })
      .limit(100)

    const dynamicPages: MetadataRoute.Sitemap = []

    // Agregar páginas de quotes
    if (quotes) {
      quotes.forEach((quote) => {
        dynamicPages.push({
          url: `${baseUrl}/dashboard/quotes/${quote.id}`,
          lastModified: quote.updated_at ? new Date(quote.updated_at) : new Date(quote.created_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    }

    // Agregar páginas de events
    if (events) {
      events.forEach((event) => {
        dynamicPages.push({
          url: `${baseUrl}/dashboard/events/${event.id}`,
          lastModified: event.updated_at ? new Date(event.updated_at) : new Date(event.start_date),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    }

    return [...staticPages, ...dynamicPages]
  } catch (error) {
    // Si hay error, retornar solo páginas estáticas
    console.error('Error generating dynamic sitemap:', error)
    return staticPages
  }
}

