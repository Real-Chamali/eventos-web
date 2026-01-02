'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, User, Calendar, DollarSign } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import Button from '@/components/ui/Button'

interface QuickAction {
  label: string
  icon: React.ReactNode
  href: string
  shortcut?: string
}

export default function QuickActions() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const actions: QuickAction[] = [
    {
      label: 'Nueva Cotización',
      icon: <FileText className="h-4 w-4" />,
      href: '/dashboard/quotes/new',
      shortcut: 'N',
    },
    {
      label: 'Nuevo Cliente',
      icon: <User className="h-4 w-4" />,
      href: '/dashboard/clients/new',
    },
    {
      label: 'Ver Calendario',
      icon: <Calendar className="h-4 w-4" />,
      href: '/dashboard/calendar',
    },
    {
      label: 'Ver Finanzas',
      icon: <DollarSign className="h-4 w-4" />,
      href: '/admin/finance',
    },
  ]

  const handleAction = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="md" className="gap-2 min-h-[44px]">
          <Plus className="h-4 w-4 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Acciones Rápidas</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 sm:w-64">
        <DropdownMenuLabel className="px-3 py-2.5">Acciones Rápidas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.href}
            onClick={() => handleAction(action.href)}
            className="cursor-pointer min-h-[48px] sm:min-h-[44px] px-3 py-2.5 sm:px-2 sm:py-1.5 active:bg-gray-100 dark:active:bg-gray-800 touch-manipulation"
          >
            <div className="flex items-center space-x-3 sm:space-x-2 flex-1">
              <div className="flex-shrink-0">{action.icon}</div>
              <span className="text-base sm:text-sm">{action.label}</span>
            </div>
            {action.shortcut && (
              <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                {action.shortcut}
              </kbd>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

