/**
 * Componente de lista de cotizaciones con paginación infinita
 * Usa Intersection Observer para cargar más automáticamente
 */

'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useInfiniteQuotes } from '@/lib/hooks/useInfiniteQuotes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmptyState from '@/components/ui/EmptyState'
import { FileText } from 'lucide-react'

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

export function QuotesList({ searchTerm = '', statusFilter = 'all' }: QuotesListProps = {}) {
  const { quotes, isLoading, isLoadingMore, isReachingEnd, loadMore, error } = useInfiniteQuotes()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  // Filtrar cotizaciones localmente
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch = quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [quotes, searchTerm, statusFilter])
  
  useEffect(() => {
    if (isReachingEnd || isLoading) return
    
    // Configurar Intersection Observer para carga automática
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
    
    const currentRef = loadMoreRef.current
    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef)
      }
    }
  }, [isReachingEnd, isLoading, isLoadingMore, loadMore])
  
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
        <CardTitle>Lista de Cotizaciones</CardTitle>
        <CardDescription>
          {filteredQuotes.length} {filteredQuotes.length === 1 ? 'cotización' : 'cotizaciones'} encontrada{filteredQuotes.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.map((quote) => (
              <TableRow key={quote.id} className="group">
                <TableCell>
                  <Link
                    href={`/dashboard/quotes/${quote.id}`}
                    className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                  >
                    {quote.client_name || 'Cliente sin nombre'}
                  </Link>
                </TableCell>
                <TableCell>{getStatusBadge(quote.status)}</TableCell>
                <TableCell className="text-right">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                      minimumFractionDigits: 2,
                    }).format(quote.total_price || 0)}
                  </span>
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-400">
                  {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/quotes/${quote.id}`}>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Ver detalles
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
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

