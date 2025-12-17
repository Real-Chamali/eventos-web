'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { ChevronDown, ChevronUp, BarChart3, Clock, User, DollarSign, GitBranch, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Utility function to format relative time
function formatRelativeTime(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (seconds < 60) return 'hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `hace ${weeks} sem`
  const months = Math.floor(days / 30)
  return `hace ${months} meses`
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })
  } catch {
    return dateString
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface QuoteVersion {
  version_number: number
  status: string
  total_price: number
  services: Array<{
    service_id: string
    quantity: number
    final_price: number
  }>
  created_by_name: string | null
  created_at: string
}

interface QuoteHistorySummary {
  quote_id: string
  total_versions: number
  current_version: number
  versions: QuoteVersion[]
  created_at: string
  last_modified_at: string
}

interface ComparisonField {
  field_name: string
  version1_value: string | null
  version2_value: string | null
  changed: boolean
}

export default function QuoteHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { success, error: showError } = useToast()
  const [paramId, setParamId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<QuoteHistorySummary | null>(null)
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null)
  const [comparison, setComparison] = useState<ComparisonField[]>([])
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    const unwrap = async () => {
      const p = await params
      setParamId(p.id)
    }
    unwrap()
  }, [params])

  // Fetch quote history
  useEffect(() => {
    if (!paramId) return

    const fetchHistory = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/quotes/${paramId}/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch history')
        }

        setHistory(data.data)
        success('Historial cargado correctamente')
      } catch (error) {
        logger.error('dashboard/quotes/history', 'Error fetching quote history', error instanceof Error ? error : new Error(String(error)), {
          quoteId: paramId,
        })
        showError('Error al cargar el historial')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [paramId, success, showError])

  // Compare versions
  const handleCompare = async (v1: number, v2: number) => {
    if (v1 === v2) {
      showError('Selecciona versiones diferentes')
      return
    }

    try {
      setComparing(true)
      const response = await fetch(`/api/quotes/${paramId}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version1: Math.min(v1, v2),
          version2: Math.max(v1, v2),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to compare versions')
      }

      setComparison(data.data)
      setSelectedVersions([Math.min(v1, v2), Math.max(v1, v2)])
      success('Comparación cargada correctamente')
    } catch (error) {
      logger.error('dashboard/quotes/history', 'Error comparing versions', error instanceof Error ? error : new Error(String(error)), {
        quoteId: paramId,
      })
      showError('Error al comparar versiones')
    } finally {
      setComparing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'confirmed':
        return <Badge variant="success" size="sm">Aceptada</Badge>
      case 'rejected':
      case 'cancelled':
        return <Badge variant="error" size="sm">Rechazada</Badge>
      case 'pending':
        return <Badge variant="warning" size="sm">Pendiente</Badge>
      default:
        return <Badge size="sm">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!history) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader
          title="Historial no encontrado"
          description="No se pudo cargar el historial de la cotización"
        />
        <Card variant="elevated">
          <CardContent className="p-12">
            <EmptyState
              icon={<GitBranch className="h-10 w-10" />}
              title="Historial no disponible"
              description="No se pudo cargar el historial de versiones de esta cotización"
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  const sortedVersions = [...history.versions].sort((a, b) => b.version_number - a.version_number)

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Historial de Versiones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Cotización #{paramId.slice(0, 8)}...
          </p>
        </div>
        <Link href={`/dashboard/quotes/${paramId}`}>
          <Button variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Versiones</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {history.total_versions}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <GitBranch className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Creada</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatRelativeTime(history.created_at)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(history.created_at)}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Clock className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Última Modificación</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatRelativeTime(history.last_modified_at)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(history.last_modified_at)}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compare Mode Toggle - Premium */}
      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Modo Comparación
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selecciona dos versiones para comparar cambios
              </p>
            </div>
            <Button
              variant={compareMode ? 'premium' : 'outline'}
              onClick={() => {
                setCompareMode(!compareMode)
                setSelectedVersions(null)
                setComparison([])
              }}
              className={compareMode ? 'shadow-lg hover:shadow-xl' : ''}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {compareMode ? 'Salir de Comparación' : 'Comparar Versiones'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Versions List - Premium */}
      <div className="space-y-4">
        {sortedVersions.map((version) => (
          <Card
            key={version.version_number}
            variant="elevated"
            className="overflow-hidden group hover:shadow-lg transition-all duration-200"
          >
            {/* Version Header */}
            <button
              onClick={() => {
                if (compareMode && selectedVersions && selectedVersions.length === 2) {
                  // In compare mode, selecting both versions triggers comparison
                  if (selectedVersions[0] === version.version_number ||
                      selectedVersions[1] === version.version_number) {
                    setSelectedVersions(null)
                  }
                } else {
                  setExpandedVersion(expandedVersion === version.version_number ? null : version.version_number)
                }
              }}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors text-left"
            >
              <div className="flex items-center gap-4 flex-1">
                {compareMode && (
                  <input
                    type="checkbox"
                    checked={selectedVersions?.includes(version.version_number) || false}
                    onChange={(e) => {
                      e.stopPropagation()
                      if (e.target.checked) {
                        if (!selectedVersions) {
                          setSelectedVersions([version.version_number, version.version_number])
                        } else if (selectedVersions[0] === selectedVersions[1]) {
                          setSelectedVersions([
                            Math.min(selectedVersions[0], version.version_number),
                            Math.max(selectedVersions[0], version.version_number),
                          ])
                        }
                      } else {
                        setSelectedVersions(null)
                      }
                    }}
                    className="w-5 h-5 rounded cursor-pointer text-indigo-600 focus:ring-indigo-500"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="info" size="lg" className="font-bold">
                      v{version.version_number}
                    </Badge>
                    {getStatusBadge(version.status)}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">{formatCurrency(version.total_price)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{version.created_by_name || 'Sistema'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(version.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!compareMode && (
                  <>
                    {expandedVersion === version.version_number ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </>
                )}
              </div>
            </button>

            {/* Version Details */}
            {!compareMode && expandedVersion === version.version_number && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Servicios
                    </h4>
                    <div className="space-y-2">
                      {version.services.map((service, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Servicio {service.service_id.slice(0, 8)}... × {service.quantity}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(service.final_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compare Button for Selected Versions */}
            {compareMode &&
              selectedVersions &&
              selectedVersions[0] !== selectedVersions[1] &&
              (version.version_number === selectedVersions[0] ||
                version.version_number === selectedVersions[1]) && (
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-indigo-50/50 dark:bg-indigo-950/30">
                  {version.version_number === selectedVersions[1] && (
                    <Button
                      onClick={() => handleCompare(selectedVersions[0], selectedVersions[1])}
                      disabled={comparing}
                      variant="premium"
                      className="w-full shadow-lg hover:shadow-xl"
                      isLoading={comparing}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {comparing ? 'Comparando...' : 'Comparar Versiones'}
                    </Button>
                  )}
                </div>
              )}
          </Card>
        ))}
      </div>

      {/* Comparison Result - Premium */}
      {selectedVersions && comparison.length > 0 && (
        <Card variant="elevated" className="overflow-hidden border-2 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Comparación de Versiones</CardTitle>
                <CardDescription className="mt-1">
                  Versión {selectedVersions[0]} → Versión {selectedVersions[1]}
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {comparison.map((change, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    change.changed
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
                      : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 opacity-60'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white capitalize mb-2">
                    {change.field_name.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <div>
                      <span className="font-medium">Desde:</span>{' '}
                      <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs">
                        {change.version1_value || 'N/A'}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Hacia:</span>{' '}
                      <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs">
                        {change.version2_value || 'N/A'}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
