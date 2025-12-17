'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import { Home, FileText, Plus, LogOut, User, Calendar, BarChart3, Settings, Sparkles, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/ui/Button'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { error: toastError } = useToast()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      logger.error('Sidebar', 'Error signing out', error as Error)
      toastError('Error al cerrar sesión')
    }
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/clients', label: 'Clientes', icon: User },
    { href: '/dashboard/quotes', label: 'Cotizaciones', icon: FileText },
    { href: '/dashboard/quotes/new', label: 'Nueva Cotización', icon: Plus },
    { href: '/dashboard/events', label: 'Eventos', icon: PartyPopper },
    { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
    { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
  ]

  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:z-30">
      <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-xl border-r border-gray-200/60 dark:bg-gray-900/80 dark:border-gray-800/60">
        {/* Header - Premium Brand */}
        <div className="flex items-center h-20 px-6 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Eventos</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Premium</span>
            </div>
          </div>
        </div>

        {/* Navigation - Premium Design */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-sm dark:from-indigo-950/30 dark:to-violet-950/30 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-600 to-violet-600 rounded-r-full" />
                )}
                <Icon className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                )} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer - Premium Logout */}
        <div className="p-4 border-t border-gray-200/60 dark:border-gray-800/60">
          <Button
            variant="ghost"
            size="md"
            onClick={handleLogout}
            className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  )
}
