'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import { X, LogOut, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  navItems: NavItem[]
  headerTitle: string
  headerSubtitle: string
  headerIcon: LucideIcon
  headerIconBg: string
}

export default function MobileSidebar({
  isOpen,
  onClose,
  navItems,
  headerTitle,
  headerSubtitle,
  headerIcon: HeaderIcon,
  headerIconBg,
}: MobileSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { error: toastError } = useToast()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus trap
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      const firstFocusable = sidebarRef.current.querySelector(
        'a, button, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      onClose()
      // Usar window.location para forzar recarga completa y limpiar estado
      window.location.href = '/login'
    } catch (error) {
      logger.error('MobileSidebar', 'Error signing out', error as Error)
      toastError('Error al cerrar sesión')
      // Aún así intentar redirigir
      window.location.href = '/login'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.aside
            ref={sidebarRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-full w-72 flex flex-col bg-white/95 backdrop-blur-xl border-r border-gray-200/60 dark:bg-gray-900/95 dark:border-gray-800/60 shadow-2xl lg:hidden"
            role="navigation"
            aria-label="Menú de navegación principal"
            id="mobile-sidebar-navigation"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center space-x-3 group">
                <div className={cn(
                  "h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200",
                  headerIconBg
                )}>
                  <HeaderIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                    {headerTitle}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {headerSubtitle}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl p-2 text-gray-700 hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800/80 transition-all duration-200"
                aria-label="Cerrar menú"
                aria-controls="mobile-sidebar-navigation"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Cerrar menú</span>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto" aria-label="Navegación principal" id="mobile-sidebar-nav">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'group relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      'hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-sm dark:from-indigo-950/30 dark:to-violet-950/30 dark:text-indigo-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                    )}
                    aria-current={isActive ? 'page' : undefined}
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

            {/* Footer */}
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

