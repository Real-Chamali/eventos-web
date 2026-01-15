import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'
import QuoteDetailPageClient from './QuoteDetailPageClient'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Quote {
  id: string
  client_id: string
  total_price: number
  status: string
  created_at: string
  updated_at?: string
  event_date?: string | null
  client?: {
    name: string
    email: string
  }
  quote_services?: Array<{
    id: string
    quantity: number
    final_price: number
    service?: {
      name: string
    }
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  try {
    const { data: quote } = await supabase
      .from('quotes')
      .select(`
        id,
        total_price,
        status,
        created_at,
        updated_at,
        clients(name, email)
      `)
      .eq('id', id)
      .single()

    if (!quote) {
      return generateSEOMetadata({
        title: 'Cotización no encontrada',
        description: 'La cotización que buscas no existe',
        path: `/dashboard/quotes/${id}`,
        noIndex: true,
      })
    }

    const client = Array.isArray(quote.clients) ? quote.clients[0] : quote.clients
    const clientName = client?.name || 'Cliente'
    
    return generateSEOMetadata({
      title: `Cotización #${id.slice(0, 8)} - ${clientName}`,
      description: `Cotización de ${clientName} por ${new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(quote.total_price)}`,
      path: `/dashboard/quotes/${id}`,
      keywords: ['cotización', 'presupuesto', 'eventos', clientName],
      type: 'article',
      publishedTime: quote.created_at,
      modifiedTime: quote.updated_at || quote.created_at,
    })
  } catch {
    return generateSEOMetadata({
      title: 'Cotización',
      description: 'Detalles de la cotización',
      path: `/dashboard/quotes/${id}`,
    })
  }
}

export default async function QuoteDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  let quote: Quote | null = null
  try {
    const { data } = await supabase
      .from('quotes')
      .select(`
        *,
        clients(name, email),
        quote_services(
          id,
          quantity,
          final_price,
          service:services(name)
        )
      `)
      .eq('id', id)
      .single()

    if (!data) {
      notFound()
    }

    quote = data as Quote
  } catch {
    quote = null
  }

  return quote ? <QuoteDetailPageClient initialQuote={quote} /> : <QuoteDetailPageClient />
}
