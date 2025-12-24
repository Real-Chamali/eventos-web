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
import { Users, Filter, Mail, Phone, TrendingUp, FileText, Shield, Crown, Edit2, Trash2, RefreshCw, Lock } from 'lucide-react'
import Button from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
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
  role?: 'admin' | 'vendor'
  full_name?: string | null
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'vendor'>('all')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    loadVendors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Función para recargar manualmente
  const handleRefresh = () => {
    loadVendors()
  }

  const loadVendors = async () => {
    try {
      setLoading(true)
      
      // Obtener vendedores desde la API con cache-busting
      const response = await fetch('/api/admin/vendors', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`
        logger.error('AdminVendorsPage', 'Error loading vendors', new Error(errorMessage), {
          status: response.status,
          statusText: response.statusText,
          errorData,
        })
        toastError(`Error al cargar los vendedores: ${errorMessage}`)
        setVendors([])
        return
      }
      
      const result = await response.json()
      
      // Validar que la respuesta tenga la estructura esperada
      if (!result || typeof result !== 'object') {
        logger.error('AdminVendorsPage', 'Invalid response structure', new Error('Server response is not an object'), { result })
        throw new Error('Respuesta inválida del servidor')
      }
      
      const { data } = result
      
      // Asegurar que data sea un array
      if (!Array.isArray(data)) {
        logger.warn('AdminVendorsPage', 'Data is not an array', { data, result })
        setVendors([])
        return
      }
      
      logger.info('AdminVendorsPage', 'Vendors loaded successfully', {
        count: data.length,
      })
      
      setVendors(data)
    } catch (error) {
      logger.error('AdminVendorsPage', 'Error loading vendors', error as Error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toastError(`Error al cargar los vendedores: ${errorMessage}`)
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setEditForm({
      name: vendor.full_name || vendor.raw_user_meta_data?.name || '',
      email: vendor.email,
      password: '',
    })
    setShowEditDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedVendor) return

    try {
      setUpdating(true)
      
      // Preparar datos para actualizar (solo enviar campos que han cambiado)
      const updates: { name?: string; email?: string; password?: string } = {}
      
      const currentName = selectedVendor.full_name || selectedVendor.raw_user_meta_data?.name || ''
      if (editForm.name !== currentName) {
        updates.name = editForm.name
      }
      
      if (editForm.email !== selectedVendor.email) {
        updates.email = editForm.email
      }
      
      if (editForm.password && editForm.password.length > 0) {
        updates.password = editForm.password
      }

      // Si no hay cambios, no hacer nada
      if (Object.keys(updates).length === 0) {
        toastError('No hay cambios para guardar')
        return
      }

      const response = await fetch(`/api/admin/users/${selectedVendor.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el usuario')
      }

      toastSuccess('Usuario actualizado exitosamente')
      setShowEditDialog(false)
      setSelectedVendor(null)
      setEditForm({ name: '', email: '', password: '' })
      loadVendors()
    } catch (error) {
      logger.error('AdminVendorsPage', 'Error updating user', error as Error)
      toastError(error instanceof Error ? error.message : 'Error al actualizar el usuario')
    } finally {
      setUpdating(false)
    }
  }

  const filteredVendors = vendors.filter((vendor) => {
    const name = (vendor.full_name || vendor.raw_user_meta_data?.name || '').toLowerCase()
    const email = vendor.email.toLowerCase()
    const search = searchTerm.toLowerCase()
    const matchesSearch = name.includes(search) || email.includes(search)
    const matchesRole = roleFilter === 'all' || vendor.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.last_sign_in_at && new Date(v.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    totalQuotes: vendors.reduce((acc, v) => acc + (v.quotes_count || 0), 0),
    totalSales: vendors.reduce((acc, v) => acc + (v.total_sales || 0), 0),
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Gestión de Personal
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Administra vendedores y sus roles en el sistema
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Cargando...' : 'Recargar'}
        </Button>
      </div>

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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Solo Administradores</SelectItem>
                  <SelectItem value="vendor">Solo Vendedores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Cotizaciones</TableHead>
                  <TableHead className="text-right">Ventas Totales</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => {
                  const isActive = vendor.last_sign_in_at && new Date(vendor.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  return (
                    <TableRow key={vendor.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                            vendor.role === 'admin'
                              ? 'bg-gradient-to-br from-purple-500 to-violet-500'
                              : 'bg-gradient-to-br from-emerald-500 to-green-500'
                          }`}>
                            {vendor.role === 'admin' ? (
                              <Crown className="h-5 w-5 text-white" />
                            ) : (
                              <Users className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {vendor.full_name || vendor.raw_user_meta_data?.name || 'Sin nombre'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {vendor.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={vendor.role === 'admin' ? 'premium' : 'success'}
                          size="sm"
                          className="gap-1"
                        >
                          {vendor.role === 'admin' ? (
                            <>
                              <Crown className="h-3 w-3" />
                              Administrador
                            </>
                          ) : (
                            <>
                              <Users className="h-3 w-3" />
                              Vendedor
                            </>
                          )}
                        </Badge>
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
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(vendor)}
                          title="Editar usuario"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para editar usuario */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription>
              {selectedVendor && (
                <>
                  Edita la información de{' '}
                  <span className="font-semibold">{selectedVendor.full_name || selectedVendor.email}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nueva Contraseña (opcional)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Dejar vacío para no cambiar"
                />
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mínimo 6 caracteres. Dejar vacío si no deseas cambiar la contraseña.
              </p>
            </div>
            {selectedVendor && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Nota:</strong> Solo el administrador puede editar usuarios. Los cambios se aplicarán inmediatamente.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => {
                setShowEditDialog(false)
                setEditForm({ name: '', email: '', password: '' })
              }} disabled={updating}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={updating}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
              >
                {updating ? 'Actualizando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

