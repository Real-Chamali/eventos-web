'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/utils/logger'
import { Menu, X, User, LogOut, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import GlobalSearch from './layout/GlobalSearch'
import QuickActions from './layout/QuickActions'
import NotificationCenter from './notifications/NotificationCenter'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

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
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-gray-800/60 dark:bg-gray-900/80">
      <div className="mx-auto flex h-20 max-w-[1920px] items-center justify-between px-6 lg:px-8">
        {/* Logo & Mobile Menu */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-xl p-2.5 text-gray-700 hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800/80 lg:hidden transition-all duration-200"
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
  )
}
