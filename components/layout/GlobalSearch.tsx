'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Search, X, FileText, Users, Calendar, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Dialog, DialogContent } from '@/components/ui/Dialog'

interface SearchResult {
  type: 'quote' | 'client' | 'event' | 'service'
  id: string
  title: string
  subtitle?: string
  href: string
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const searchAll = async () => {
      setLoading(true)
      const searchResults: SearchResult[] = []

      try {
        // Buscar cotizaciones
        const { data: quotes } = await supabase
          .from('quotes')
          .select('id, total_price, created_at, client:clients(name)')
          .or(`id.ilike.%${query}%,client:clients.name.ilike.%${query}%`)
          .limit(5)

        if (quotes) {
          quotes.forEach((quote: any) => {
            const client = Array.isArray(quote.client) ? quote.client[0] : quote.client
            searchResults.push({
              type: 'quote',
              id: quote.id,
              title: `Cotización #${quote.id.slice(0, 8)}`,
              subtitle: (client as { name?: string })?.name || 'Sin cliente',
              href: `/dashboard/quotes/${quote.id}`,
            })
          })
        }

        // Buscar clientes
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name, email')
          .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(5)

        if (clients) {
          clients.forEach((client: { id: string; name: string; email?: string }) => {
            searchResults.push({
              type: 'client',
              id: client.id,
              title: client.name,
              subtitle: client.email,
              href: `/dashboard/clients/${client.id}`,
            })
          })
        }

        // Buscar eventos
        const { data: events } = await supabase
          .from('events')
          .select('id, created_at, quote:quotes(id, client:clients(name))')
          .ilike('id', `%${query}%`)
          .limit(5)

        if (events) {
          events.forEach((event: any) => {
            const quote = Array.isArray(event.quote) ? event.quote[0] : event.quote
            const client = quote && (Array.isArray(quote.client) ? quote.client[0] : quote.client)
            searchResults.push({
              type: 'event',
              id: event.id,
              title: `Evento #${event.id.slice(0, 8)}`,
              subtitle: (client as { name?: string })?.name || 'Sin cliente',
              href: `/dashboard/events/${event.id}`,
            })
          })
        }

        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchAll, 300)
    return () => clearTimeout(timeoutId)
  }, [query, supabase])

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    setIsOpen(false)
    setQuery('')
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'quote':
        return <FileText className="h-4 w-4" />
      case 'client':
        return <Users className="h-4 w-4" />
      case 'event':
        return <Calendar className="h-4 w-4" />
      case 'service':
        return <DollarSign className="h-4 w-4" />
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden lg:flex items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          ⌘K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl p-0">
          <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-4">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar cotizaciones, clientes, eventos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 py-4 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="ml-2 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                Buscando...
              </div>
            ) : results.length === 0 && query.length >= 2 ? (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-gray-500">
                <p>No se encontraron resultados</p>
                <p className="text-xs text-gray-400 mt-1">Intenta con otros términos</p>
              </div>
            ) : query.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-gray-500">
                <p>Escribe al menos 2 caracteres para buscar</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800">
                    Cotizaciones
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800">
                    Clientes
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800">
                    Eventos
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{result.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

