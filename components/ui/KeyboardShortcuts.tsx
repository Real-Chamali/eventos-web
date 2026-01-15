'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHotkeys } from 'react-hotkeys-hook'
import { 
  Home, 
  FileText, 
  Plus, 
  Calendar, 
  Users, 
  Settings, 
  BarChart3,
  Command,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './Dialog'

interface Shortcut {
  keys: string
  description: string
  action: () => void
  category: 'navigation' | 'actions' | 'general'
  icon?: React.ReactNode
}

export function KeyboardShortcuts() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const shortcuts: Shortcut[] = [
    {
      keys: 'g h',
      description: 'Ir al Dashboard',
      action: () => router.push('/dashboard'),
      category: 'navigation',
      icon: <Home className="h-4 w-4" />,
    },
    {
      keys: 'g q',
      description: 'Ir a Cotizaciones',
      action: () => router.push('/dashboard/quotes'),
      category: 'navigation',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      keys: 'g c',
      description: 'Ir a Clientes',
      action: () => router.push('/dashboard/clients'),
      category: 'navigation',
      icon: <Users className="h-4 w-4" />,
    },
    {
      keys: 'g e',
      description: 'Ir a Eventos',
      action: () => router.push('/dashboard/events'),
      category: 'navigation',
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      keys: 'g a',
      description: 'Ir a Analytics',
      action: () => router.push('/dashboard/analytics'),
      category: 'navigation',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      keys: 'g s',
      description: 'Ir a Configuración',
      action: () => router.push('/dashboard/settings'),
      category: 'navigation',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      keys: 'n',
      description: 'Nueva Cotización',
      action: () => router.push('/dashboard/quotes/new'),
      category: 'actions',
      icon: <Plus className="h-4 w-4" />,
    },
    {
      keys: 'shift+/',
      description: 'Mostrar atajos',
      action: () => setIsOpen(true),
      category: 'general',
      icon: <Command className="h-4 w-4" />,
    },
  ]

  // Registrar todos los shortcuts individualmente
  useHotkeys('g h', () => router.push('/dashboard'), { enableOnFormTags: false })
  useHotkeys('g q', () => router.push('/dashboard/quotes'), { enableOnFormTags: false })
  useHotkeys('g c', () => router.push('/dashboard/clients'), { enableOnFormTags: false })
  useHotkeys('g e', () => router.push('/dashboard/events'), { enableOnFormTags: false })
  useHotkeys('g a', () => router.push('/dashboard/analytics'), { enableOnFormTags: false })
  useHotkeys('g s', () => router.push('/dashboard/settings'), { enableOnFormTags: false })
  useHotkeys('n', () => router.push('/dashboard/quotes/new'), { enableOnFormTags: false })
  
  // Shortcut para abrir el diálogo
  useHotkeys('shift+/', (e) => {
    e.preventDefault()
    setIsOpen(true)
  })

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  const categoryLabels = {
    navigation: 'Navegación',
    actions: 'Acciones',
    general: 'General',
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-5 w-5" />
              Atajos de Teclado
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {Object.entries(groupedShortcuts).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {shortcut.icon && (
                          <div className="text-gray-500 dark:text-gray-400">
                            {shortcut.icon}
                          </div>
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.split(' ').map((key, keyIndex) => (
                          <span key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-gray-400 dark:text-gray-500 mx-1">+</span>
                            )}
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm">
                              {key.toUpperCase()}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Presiona <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 rounded">Shift + ?</kbd> para ver este diálogo
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Hook para usar shortcuts programáticamente
export function useKeyboardShortcuts() {
  const router = useRouter()

  useHotkeys('g+h', () => router.push('/dashboard'))
  useHotkeys('g+q', () => router.push('/dashboard/quotes'))
  useHotkeys('g+c', () => router.push('/dashboard/clients'))
  useHotkeys('g+e', () => router.push('/dashboard/events'))
  useHotkeys('g+a', () => router.push('/dashboard/analytics'))
  useHotkeys('g+s', () => router.push('/dashboard/settings'))
  useHotkeys('n', () => router.push('/dashboard/quotes/new'), {
    enableOnFormTags: false,
  })
}

