/**
 * Dashboard de Auditoría para Administradores
 * Visualiza todos los logs de auditoría con filtros avanzados
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar,
  User,
  Database
} from 'lucide-react'
import { getChangedFields } from '@/lib/utils/audit'

interface AuditLog {
  id: string
  user_id: string
  action: string
  table_name: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  metadata: Record<string, unknown> | null
  user_email?: string
  user_name?: string | null
}

type AuditLogRow = AuditLog & {
  profiles?: {
    email?: string | null
    full_name?: string | null
  } | null
}

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'READ', 'LOGIN', 'LOGOUT', 'EXPORT', 'REPORT']
const TABLES = ['quotes', 'clients', 'events', 'services', 'partial_payments', 'profiles', 'notifications']

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [userIdFilter] = useState<string>('')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const { success: toastSuccess, error: toastError } = useToast()

  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      // Aplicar filtros
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter)
      }
      
      if (tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter)
      }
      
      if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString())
      }
      
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endDate.toISOString())
      }
      
      if (userIdFilter) {
        query = query.eq('user_id', userIdFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Mapear datos con información de usuario
      const logsWithUsers = ((data || []) as AuditLogRow[]).map((log) => ({
        ...log,
        user_email: log.profiles?.email || 'Usuario desconocido',
        user_name: log.profiles?.full_name || null,
      }))

      setLogs(logsWithUsers)
    } catch (error) {
      logger.error('AuditLogsPage', 'Error fetching audit logs', error as Error)
      toastError('Error al cargar logs de auditoría')
    } finally {
      setLoading(false)
    }
  }, [actionFilter, tableFilter, dateFrom, dateTo, userIdFilter, supabase, toastError])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Filtrar por término de búsqueda
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs

    const searchLower = searchTerm.toLowerCase()
    return logs.filter((log) => {
      const userEmail = log.user_email?.toLowerCase() || ''
      const userName = log.user_name?.toLowerCase() || ''
      const tableName = log.table_name?.toLowerCase() || ''
      const action = log.action?.toLowerCase() || ''
      const metadata = JSON.stringify(log.metadata || {}).toLowerCase()
      
      return (
        userEmail.includes(searchLower) ||
        userName.includes(searchLower) ||
        tableName.includes(searchLower) ||
        action.includes(searchLower) ||
        metadata.includes(searchLower)
      )
    })
  }, [logs, searchTerm])

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const exportToCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Acción', 'Tabla', 'IP', 'Cambios']
    const rows = filteredLogs.map((log) => {
      const changes = getChangedFields(log.old_values, log.new_values)
      const changesText = changes.map((c) => `${c.field}: ${c.old} → ${c.new}`).join('; ')
      
      return [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_email || 'N/A',
        log.action,
        log.table_name,
        log.ip_address || 'N/A',
        changesText,
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toastSuccess('Logs exportados exitosamente')
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="w-4 h-4" />
      case 'UPDATE':
        return <Edit className="w-4 h-4" />
      case 'DELETE':
        return <Trash2 className="w-4 h-4" />
      case 'READ':
        return <Eye className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      CREATE: 'success',
      UPDATE: 'warning',
      DELETE: 'error',
      READ: 'info',
    }
    return (
      <Badge variant={variants[action] || 'info'} size="sm" className="flex items-center gap-1">
        {getActionIcon(action)}
        {action}
      </Badge>
    )
  }

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Logs de Auditoría</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Registro completo de todas las acciones en el sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por usuario, tabla, acción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por acción */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las acciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                {ACTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por tabla */}
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las tablas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tablas</SelectItem>
                {TABLES.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por fecha desde */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Desde
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Filtro por fecha hasta */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Hasta
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de logs */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'registro' : 'registros'} encontrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-12 h-12 text-gray-400" />}
              title="No se encontraron logs"
              description="Intenta ajustar los filtros de búsqueda"
            />
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogs.has(log.id)
                const changes = getChangedFields(log.old_values, log.new_values)

                return (
                  <div
                    key={log.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getActionBadge(log.action)}
                          <Badge variant="info" size="sm" className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            {log.table_name}
                          </Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(log.created_at), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                              locale: es,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.user_email}
                            {log.user_name && ` (${log.user_name})`}
                          </span>
                          {log.ip_address && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {log.ip_address}
                            </span>
                          )}
                        </div>
                        {changes.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {changes.length} {changes.length === 1 ? 'campo modificado' : 'campos modificados'}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(log.id)}
                        className="ml-4"
                      >
                        {isExpanded ? 'Ocultar' : 'Ver detalles'}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
                        {/* Cambios */}
                        {changes.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Cambios realizados:</h4>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 space-y-2">
                              {changes.map((change, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{change.field}:</span>{' '}
                                  <span className="text-red-600 dark:text-red-400">
                                    {String(change.old || 'null')}
                                  </span>{' '}
                                  →{' '}
                                  <span className="text-green-600 dark:text-green-400">
                                    {String(change.new || 'null')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Valores completos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {log.old_values && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Valores anteriores:</h4>
                              <pre className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs overflow-auto max-h-48">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Valores nuevos:</h4>
                              <pre className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs overflow-auto max-h-48">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Metadata:</h4>
                            <pre className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs overflow-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* User Agent */}
                        {log.user_agent && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">User Agent:</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                              {log.user_agent}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
