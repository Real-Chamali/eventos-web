'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import SearchInput from '@/components/ui/SearchInput'
import { Users, Filter, Mail, Phone, TrendingUp, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmptyState from '@/components/ui/EmptyState'

interface Vendor {
  id: string
  email: string
  raw_user_meta_data?: {
    name?: string
    phone?: string
  }
  created_at: string
  last_sign_in_at?: string
  quotes_count?: number
  total_sales?: number
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { error: toastError } = useToast()

  useEffect(() => {
    loadVendors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadVendors = async () => {
    try {
      setLoading(true)
      
      // Obtener vendedores desde la API
      const response = await fetch('/api/admin/vendors')
      if (!response.ok) {
        throw new Error('Error al obtener vendedores')
      }
      
      const { data } = await response.json()
      setVendors(data || [])
    } catch (error) {
      logger.error('AdminVendorsPage', 'Error loading vendors', error as Error)
      toastError('Error al cargar los vendedores')
    } finally {
      setLoading(false)
    }
  }

  const filteredVendors = vendors.filter((vendor) => {
    const name = vendor.raw_user_meta_data?.name?.toLowerCase() || ''
    const email = vendor.email.toLowerCase()
    const search = searchTerm.toLowerCase()
    return name.includes(search) || email.includes(search)
  })

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.last_sign_in_at && new Date(v.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    totalQuotes: vendors.reduce((acc, v) => acc + (v.quotes_count || 0), 0),
    totalSales: vendors.reduce((acc, v) => acc + (v.total_sales || 0), 0),
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Administrar Vendedores"
        description="Gestiona todos los vendedores del sistema"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vendedores</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activos (30 días)</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cotizaciones</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalQuotes}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <FileText className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventas Totales</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(stats.totalSales)}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Búsqueda</CardTitle>
              <CardDescription className="mt-1">Busca vendedores por nombre o email</CardDescription>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <SearchInput
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Lista de Vendedores</CardTitle>
              <CardDescription className="mt-1">
                {filteredVendors.length} {filteredVendors.length === 1 ? 'vendedor' : 'vendedores'} encontrado{filteredVendors.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredVendors.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title={searchTerm ? 'No se encontraron vendedores' : 'No hay vendedores aún'}
              description={
                searchTerm
                  ? 'Intenta ajustar el término de búsqueda'
                  : 'Los vendedores aparecerán aquí cuando se registren'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Cotizaciones</TableHead>
                  <TableHead className="text-right">Ventas Totales</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => {
                  const isActive = vendor.last_sign_in_at && new Date(vendor.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  return (
                    <TableRow key={vendor.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {vendor.raw_user_meta_data?.name || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {vendor.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {vendor.raw_user_meta_data?.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-3 w-3" />
                              {vendor.raw_user_meta_data.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="h-3 w-3" />
                            {vendor.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {vendor.quotes_count || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(vendor.total_sales || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {vendor.last_sign_in_at
                          ? format(new Date(vendor.last_sign_in_at), "d 'de' MMMM, yyyy", { locale: es })
                          : 'Nunca'}
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <Badge variant="success" size="sm">Activo</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Inactivo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

