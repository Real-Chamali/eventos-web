'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { 
  Home, 
  FileText, 
  Plus, 
  Calendar, 
  Users, 
  Settings, 
  Search,
  BarChart3,
  Shield,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react'
import { Dialog, DialogContent } from './Dialog'
import { cn } from '@/lib/utils/cn'
import { usePathname } from 'next/navigation'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  href?: string
  action?: () => void
  keywords?: string[]
  group: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  const navigationItems: CommandItem[] = isAdmin
    ? [
        {
          id: 'admin-dashboard',
          label: 'Dashboard del Dueño',
          description: 'Panel principal de administración',
          icon: <BarChart3 className="h-4 w-4" />,
          href: '/admin/dashboard',
          keywords: ['dashboard', 'admin', 'dueño', 'panel'],
          group: 'Navegación',
        },
        {
          id: 'admin-calendar',
          label: 'Calendario Estratégico',
          description: 'Análisis de rentabilidad por fecha',
          icon: <TrendingUp className="h-4 w-4" />,
          href: '/admin/calendar-strategic',
          keywords: ['calendario', 'estratégico', 'rentabilidad'],
          group: 'Navegación',
        },
        {
          id: 'admin-services',
          label: 'Gestión de Servicios',
          description: 'Administrar servicios disponibles',
          icon: <Settings className="h-4 w-4" />,
          href: '/admin/services',
          keywords: ['servicios', 'gestión'],
          group: 'Navegación',
        },
        {
          id: 'admin-vendors',
          label: 'Gestión de Personal',
          description: 'Administrar vendedores y personal',
          icon: <Users className="h-4 w-4" />,
          href: '/admin/vendors',
          keywords: ['personal', 'vendedores', 'gestión'],
          group: 'Navegación',
        },
        {
          id: 'admin-finance',
          label: 'Finanzas',
          description: 'Control financiero completo',
          icon: <DollarSign className="h-4 w-4" />,
          href: '/admin/finance',
          keywords: ['finanzas', 'dinero', 'ingresos'],
          group: 'Navegación',
        },
        {
          id: 'admin-events',
          label: 'Eventos',
          description: 'Ver todos los eventos',
          icon: <Calendar className="h-4 w-4" />,
          href: '/admin/events',
          keywords: ['eventos', 'calendario'],
          group: 'Navegación',
        },
        {
          id: 'admin-users',
          label: 'Gestión de Usuarios',
          description: 'Administrar usuarios del sistema',
          icon: <Shield className="h-4 w-4" />,
          href: '/admin/users',
          keywords: ['usuarios', 'gestión'],
          group: 'Navegación',
        },
      ]
    : [
        {
          id: 'dashboard',
          label: 'Dashboard',
          description: 'Panel principal',
          icon: <Home className="h-4 w-4" />,
          href: '/dashboard',
          keywords: ['dashboard', 'inicio', 'principal'],
          group: 'Navegación',
        },
        {
          id: 'quotes',
          label: 'Cotizaciones',
          description: 'Ver todas las cotizaciones',
          icon: <FileText className="h-4 w-4" />,
          href: '/dashboard/quotes',
          keywords: ['cotizaciones', 'cotización', 'quotes'],
          group: 'Navegación',
        },
        {
          id: 'new-quote',
          label: 'Nueva Cotización',
          description: 'Crear una nueva cotización',
          icon: <Plus className="h-4 w-4" />,
          href: '/dashboard/quotes/new',
          keywords: ['nueva', 'crear', 'cotización'],
          group: 'Acciones',
        },
        {
          id: 'clients',
          label: 'Clientes',
          description: 'Gestionar clientes',
          icon: <Users className="h-4 w-4" />,
          href: '/dashboard/clients',
          keywords: ['clientes', 'cliente'],
          group: 'Navegación',
        },
        {
          id: 'events',
          label: 'Eventos',
          description: 'Ver eventos programados',
          icon: <Calendar className="h-4 w-4" />,
          href: '/dashboard/events',
          keywords: ['eventos', 'evento', 'calendario'],
          group: 'Navegación',
        },
        {
          id: 'analytics',
          label: 'Analytics',
          description: 'Métricas y análisis',
          icon: <BarChart3 className="h-4 w-4" />,
          href: '/dashboard/analytics',
          keywords: ['analytics', 'métricas', 'estadísticas'],
          group: 'Navegación',
        },
        {
          id: 'settings',
          label: 'Configuración',
          description: 'Ajustes y preferencias',
          icon: <Settings className="h-4 w-4" />,
          href: '/dashboard/settings',
          keywords: ['configuración', 'ajustes', 'settings'],
          group: 'Navegación',
        },
      ]

  const allItems = navigationItems

  // Abrir con Cmd+K o Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = useCallback((item: CommandItem) => {
    if (item.href) {
      router.push(item.href)
      setOpen(false)
    } else if (item.action) {
      item.action()
      setOpen(false)
    }
  }, [router])

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 max-w-2xl">
          <Command className="rounded-lg border-none shadow-lg" shouldFilter={true}>
            <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
              <Command.Input
                placeholder="Buscar comandos, navegar, o ejecutar acciones..."
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                onClick={() => setOpen(false)}
                className="ml-2 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <Command.List className="max-h-[400px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-gray-500">
                No se encontraron resultados.
              </Command.Empty>
              {Object.entries(
                allItems.reduce((acc, item) => {
                  if (!acc[item.group]) {
                    acc[item.group] = []
                  }
                  acc[item.group].push(item)
                  return acc
                }, {} as Record<string, CommandItem[]>)
              ).map(([group, items]) => (
                <Command.Group key={group} heading={group} className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {items.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.description || ''} ${item.keywords?.join(' ') || ''}`}
                      onSelect={() => handleSelect(item)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer',
                        'aria-selected:bg-indigo-50 aria-selected:text-indigo-900',
                        'dark:aria-selected:bg-indigo-950/30 dark:aria-selected:text-indigo-300',
                        'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )}
                    >
                      <div className="text-gray-500 dark:text-gray-400 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.href && (
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400">
                          ↵
                        </kbd>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}

