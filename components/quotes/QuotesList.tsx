/**
 * Componente de lista de cotizaciones con paginación infinita
 * Usa Intersection Observer para cargar más automáticamente
 */

'use client'

import { useEffect, useRef, useMemo, memo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useInfiniteQuotes } from '@/lib/hooks/useInfiniteQuotes'
import { useIsAdmin, useDebounce, useWindowSize } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmptyState from '@/components/ui/EmptyState'
import { FileText, Edit, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'

function getStatusBadge(status: string) {
  switch (status) {
    case 'confirmed':
      return <Badge variant="success" size="sm">Confirmada</Badge>
    case 'pending':
    case 'draft':
      return <Badge variant="warning" size="sm">Pendiente</Badge>
    case 'cancelled':
      return <Badge variant="error" size="sm">Cancelada</Badge>
    default:
      return <Badge size="sm">{status}</Badge>
  }
}

interface QuotesListProps {
  searchTerm?: string
  statusFilter?: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'draft'
}

// Componente de fila memoizado para evitar re-renders innecesarios
const QuoteRow = memo(function QuoteRow({
  quote,
  isAdmin,
  adminLoading,
  onDelete,
  getStatusBadge,
}: {
  quote: { id: string; client_name?: string; status: string; total_price?: number; created_at: string }
  isAdmin: boolean
  adminLoading: boolean
  onDelete: (id: string) => void
  getStatusBadge: (status: string) => React.ReactNode
}) {
  return (
    <>
      {/* Mobile Card View */}
      <div className="lg:hidden">
        <Card variant="elevated" className="mb-4 active:scale-[0.98] transition-transform touch-manipulation">
          <CardContent className="p-4">
            <Link href={`/dashboard/quotes/${quote.id}`} className="block">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate mb-1">
                    {quote.client_name || 'Cliente sin nombre'}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(quote.status)}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                      minimumFractionDigits: 2,
                    }).format(quote.total_price || 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
              <Link href={`/dashboard/quotes/${quote.id}`} className="flex-1">
                <Button variant="outline" size="md" className="w-full min-h-[44px]">
                  Ver detalles
                </Button>
              </Link>
              {!adminLoading && isAdmin && (
                <>
                  <Link href={`/dashboard/quotes/${quote.id}/edit`}>
                    <Button variant="ghost" size="md" className="min-w-[44px] min-h-[44px]">
                      <Edit className="h-5 w-5" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="md" 
                        className="min-w-[44px] min-h-[44px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 active:bg-red-100 dark:active:bg-red-900/30"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente la cotización. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(quote.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block group border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
          <div className="col-span-3">
            <Link
              href={`/dashboard/quotes/${quote.id}`}
              className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
            >
              {quote.client_name || 'Cliente sin nombre'}
            </Link>
          </div>
          <div className="col-span-2">{getStatusBadge(quote.status)}</div>
          <div className="col-span-2 text-right">
            <span className="font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 2,
              }).format(quote.total_price || 0)}
            </span>
          </div>
          <div className="col-span-2 text-gray-600 dark:text-gray-400">
            {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
          </div>
          <div className="col-span-3 text-right">
            <div className="flex items-center justify-end gap-2">
              <Link href={`/dashboard/quotes/${quote.id}`}>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Ver detalles
                </Button>
              </Link>
              {!adminLoading && isAdmin && (
                <>
                  <Link href={`/dashboard/quotes/${quote.id}/edit`}>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente la cotización. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(quote.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
})

export function QuotesList({ searchTerm = '', statusFilter = 'all' }: QuotesListProps = {}) {
  const { quotes, isLoading, isLoadingMore, isReachingEnd, loadMore, error } = useInfiniteQuotes()
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const router = useRouter()
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { height: windowHeight } = useWindowSize()
  
  // Debounce en búsqueda para mejorar performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const handleDeleteQuote = useCallback(async (quoteId: string) => {
    if (!isAdmin) {
      toastError('Solo los administradores pueden eliminar cotizaciones')
      return
    }

    try {
      // Usar la API route que maneja la eliminación en cascada
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar la cotización')
      }

      toastSuccess(data.message || 'Cotización eliminada exitosamente')
      router.refresh()
    } catch (err) {
      logger.error('QuotesList', 'Error deleting quote', err as Error)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la cotización'
      
      // Mensaje más descriptivo
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('eventos')) {
        toastError('No se puede eliminar: La cotización tiene eventos asociados. Por favor, elimina primero los eventos relacionados.')
      } else {
        toastError(errorMessage)
      }
    }
  }, [isAdmin, toastSuccess, toastError, router])
  
  // Filtrar cotizaciones localmente con debounce
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch = quote.client_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [quotes, debouncedSearchTerm, statusFilter])
  
  // Calcular altura dinámica del contenedor (responsive)
  const containerHeight = useMemo(() => {
    // Altura base: viewport height menos header, padding, y controles
    // En móvil: más compacto, en desktop: más espacio
    const baseHeight = windowHeight > 768 ? windowHeight - 400 : windowHeight - 300
    return Math.max(400, Math.min(800, baseHeight))
  }, [windowHeight])

  // Virtual scrolling para la lista de cotizaciones
  const virtualizer = useVirtualizer({
    count: filteredQuotes.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 80, // Altura estimada de cada fila
    overscan: 5, // Renderizar 5 elementos adicionales fuera de la vista
    measureElement: (element) => element?.getBoundingClientRect().height ?? 80,
    // Scroll suave al navegar
    scrollMargin: 20,
  })
  
  // Scroll suave a un elemento específico
  const scrollToIndex = useCallback((index: number) => {
    virtualizer.scrollToIndex(index, {
      align: 'start',
      behavior: 'smooth',
    })
  }, [virtualizer])
  
  // Integración mejorada con paginación infinita
  useEffect(() => {
    if (isReachingEnd || isLoading) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          // Cargar más cuando el usuario está cerca del final
          const virtualItems = virtualizer.getVirtualItems()
          const lastItem = virtualItems[virtualItems.length - 1]
          if (lastItem && lastItem.index >= filteredQuotes.length - 3) {
            loadMore()
          }
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }
    
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [isReachingEnd, isLoading, isLoadingMore, loadMore, virtualizer, filteredQuotes.length])
  
  if (isLoading && quotes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Error al cargar cotizaciones</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (filteredQuotes.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<FileText className="h-10 w-10" />}
            title="No hay cotizaciones"
            description="Crea tu primera cotización para comenzar"
          />
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lista de Cotizaciones</CardTitle>
            <CardDescription>
              {filteredQuotes.length} {filteredQuotes.length === 1 ? 'cotización' : 'cotizaciones'} encontrada{filteredQuotes.length !== 1 ? 's' : ''}
              {quotes.length > filteredQuotes.length && (
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  (de {quotes.length} total)
                </span>
              )}
            </CardDescription>
          </div>
          {/* Indicador de posición */}
          {virtualizer.getVirtualItems().length > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {virtualizer.getVirtualItems()[0]?.index + 1 || 0} - {virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1]?.index + 1 || 0} de {filteredQuotes.length}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          {/* Header fijo */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-3 text-right">Acciones</div>
            </div>
          </div>
          
          {/* Lista virtualizada con altura dinámica */}
          <div 
            ref={tableContainerRef} 
            className="overflow-auto transition-all duration-300"
            style={{ height: `${containerHeight}px` }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
              className="transition-opacity duration-300"
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const quote = filteredQuotes[virtualRow.index]
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="transition-opacity duration-200"
                  >
                    <QuoteRow
                      quote={quote}
                      isAdmin={isAdmin}
                      adminLoading={adminLoading}
                      onDelete={handleDeleteQuote}
                      getStatusBadge={getStatusBadge}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* Trigger para cargar más */}
        <div ref={loadMoreRef} className="p-4 text-center">
          {isLoadingMore && (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {isReachingEnd && quotes.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay más cotizaciones
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

