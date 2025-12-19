'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SearchInput from '@/components/ui/SearchInput'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Users, Shield, User, Mail, Calendar, Search, Sparkles, Crown } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'

interface UserProfile {
  id: string
  full_name: string | null
  role: 'admin' | 'vendor'
  created_at: string
  email?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'vendor'>('all')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [newRole, setNewRole] = useState<'admin' | 'vendor'>('vendor')
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [updating, setUpdating] = useState(false)

  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Obtener perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Obtener emails de auth.users (solo podemos obtener el del usuario actual)
      // Para otros usuarios, usaremos el email si está disponible en el perfil
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      const usersWithEmail = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Solo podemos obtener el email del usuario actual
          let email: string | undefined
          if (currentUser && profile.id === currentUser.id) {
            email = currentUser.email || undefined
          }
          
          return {
            ...profile,
            email,
          }
        })
      )

      setUsers(usersWithEmail)
    } catch (error) {
      logger.error('AdminUsersPage', 'Error loading users', error as Error)
      toastError('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (user: UserProfile) => {
    setSelectedUser(user)
    setNewRole(user.role === 'admin' ? 'vendor' : 'admin')
    setShowRoleDialog(true)
  }

  const confirmRoleChange = async () => {
    if (!selectedUser) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el rol')
      }

      toastSuccess(`Rol actualizado a ${newRole === 'admin' ? 'Administrador' : 'Vendedor'}`)
      setShowRoleDialog(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error) {
      logger.error('AdminUsersPage', 'Error updating role', error as Error)
      toastError(error instanceof Error ? error.message : 'Error al actualizar el rol')
    } finally {
      setUpdating(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    vendors: users.filter((u) => u.role === 'vendor').length,
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 flex items-center justify-center shadow-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Administra roles y permisos de usuarios del sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Users className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administradores</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Shield className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vendedores</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.vendors}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <User className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Filters */}
      <Card variant="elevated">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar por nombre, email o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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

      {/* Premium Users Table */}
      {loading ? (
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12">
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="No se encontraron usuarios"
              description={
                searchTerm || roleFilter !== 'all'
                  ? 'No hay usuarios que coincidan con los filtros aplicados'
                  : 'Aún no hay usuarios registrados en el sistema'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Lista de Usuarios
                </CardTitle>
                <CardDescription className="mt-1">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol Actual</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          user.role === 'admin'
                            ? 'bg-gradient-to-br from-purple-500 to-violet-500'
                            : 'bg-gradient-to-br from-emerald-500 to-green-500'
                        }`}>
                          {user.role === 'admin' ? (
                            <Crown className="h-5 w-5 text-white" />
                          ) : (
                            <User className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {user.full_name || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'admin' ? 'premium' : 'success'}
                        size="sm"
                        className="gap-1"
                      >
                        {user.role === 'admin' ? (
                          <>
                            <Crown className="h-3 w-3" />
                            Administrador
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3" />
                            Vendedor
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(user.created_at), "dd MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleChange(user)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Cambiar Rol
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog para cambiar rol */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Cambiar Rol de Usuario
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Estás a punto de cambiar el rol de{' '}
                  <span className="font-semibold">{selectedUser.full_name || 'este usuario'}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nuevo Rol
              </label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as 'admin' | 'vendor')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-600" />
                      Administrador
                    </div>
                  </SelectItem>
                  <SelectItem value="vendor">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      Vendedor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedUser && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Nota:</strong> Al cambiar el rol, el usuario perderá o ganará permisos
                  inmediatamente. Los administradores tienen acceso completo al sistema.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setShowRoleDialog(false)} disabled={updating}>
                Cancelar
              </Button>
              <Button
                onClick={confirmRoleChange}
                disabled={updating}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
              >
                {updating ? 'Actualizando...' : 'Confirmar Cambio'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

