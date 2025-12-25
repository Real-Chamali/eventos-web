'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/utils/logger'
import { Menu, X, User, LogOut, Settings, Sparkles, Shield, Home, FileText, Plus, Calendar, BarChart3, PartyPopper, DollarSign, Users, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import GlobalSearch from './layout/GlobalSearch'
import QuickActions from './layout/QuickActions'
import NotificationCenter from './notifications/NotificationCenter'
import MobileSidebar from './MobileSidebar'
import { useApp } from '@/contexts/AppContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu'

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string>('')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { state, actions } = useApp()
  const isOpen = state.sidebarOpen

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      logger.error('Navbar', 'Error signing out', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')
  const isAdmin = pathname?.startsWith('/admin')

  // Navigation items based on route
  const dashboardNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/clients', label: 'Clientes', icon: User },
    { href: '/dashboard/quotes', label: 'Cotizaciones', icon: FileText },
    { href: '/dashboard/quotes/new', label: 'Nueva Cotización', icon: Plus },
    { href: '/dashboard/events', label: 'Eventos', icon: PartyPopper },
    { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
    { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
  ]

  const adminNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard del Dueño', icon: BarChart3 },
    { href: '/admin/calendar-strategic', label: 'Calendario Estratégico', icon: TrendingUp },
    { href: '/admin/services', label: 'Gestión de Servicios', icon: Settings },
    { href: '/admin/vendors', label: 'Gestión de Personal', icon: Users },
    { href: '/admin/finance', label: 'Finanzas', icon: DollarSign },
    { href: '/admin/events', label: 'Eventos', icon: Calendar },
    { href: '/admin/users', label: 'Gestión de Usuarios', icon: Shield },
  ]

  const navItems = isAdmin ? adminNavItems : dashboardNavItems

  const toggleSidebar = () => {
    actions.toggleSidebar()
  }

  const closeSidebar = () => {
    actions.setSidebarOpen(false)
  }

  if (!isDashboard) {
    return null
  }

  // Generate breadcrumbs
  const pathSegments = pathname?.split('/').filter(Boolean) || []
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/')
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    return { href, label }
  })

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isOpen}
        onClose={closeSidebar}
        navItems={navItems}
        headerTitle={isAdmin ? 'Admin' : 'Eventos'}
        headerSubtitle="Premium"
        headerIcon={isAdmin ? Shield : Sparkles}
        headerIconBg={isAdmin ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600' : 'bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600'}
      />

      <nav className="sticky top-0 z-40 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-gray-800/60 dark:bg-gray-900/80">
        <div className="mx-auto flex h-20 max-w-[1920px] items-center justify-between px-6 lg:px-8">
          {/* Logo & Mobile Menu */}
          <div className="flex items-center space-x-6">
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center rounded-xl p-2.5 text-gray-700 hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800/80 lg:hidden transition-all duration-200"
              aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">Eventos</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Premium</span>
            </div>
          </Link>
          
          {/* Breadcrumbs - Desktop */}
          {breadcrumbs.length > 0 && (
            <div className="hidden lg:flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center space-x-2">
                  {index > 0 && <span className="text-gray-400 dark:text-gray-500">/</span>}
                  <Link
                    href={crumb.href}
                    className={cn(
                      'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200',
                      index === breadcrumbs.length - 1 && 'text-gray-900 dark:text-white font-medium'
                    )}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden flex-1 max-w-md mx-8 lg:flex items-center justify-center">
          <GlobalSearch />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Quick Actions */}
          <QuickActions />
          
          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-3 rounded-xl p-2 text-gray-700 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-gray-800/80 transition-all duration-200 hover:scale-105 active:scale-95">
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center shadow-md transition-all duration-200 hover:shadow-lg",
                  pathname?.startsWith('/admin')
                    ? "bg-gradient-to-br from-purple-500 to-purple-600"
                    : "bg-gradient-to-br from-indigo-500 to-violet-600"
                )}>
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden text-sm font-medium sm:inline-block text-gray-900 dark:text-white">
                  {userEmail?.split('@')[0] || 'Usuario'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-gray-200/60 dark:border-gray-800/60 shadow-xl">
              <DropdownMenuLabel className="p-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{userEmail}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {pathname?.startsWith('/admin') ? 'Administrador' : 'Vendedor'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200/60 dark:bg-gray-800/60" />
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                <Link href={pathname?.startsWith('/admin') ? '/admin' : '/dashboard'} className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200/60 dark:bg-gray-800/60" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400 rounded-lg focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
    </>
  )
}
