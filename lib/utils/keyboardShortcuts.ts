/**
 * Sistema Premium de Keyboard Shortcuts
 * Atajos de teclado globales para mejorar productividad
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
  description: string
  category?: string
}

/**
 * Hook para registrar shortcuts globales
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.alt ? e.altKey : !e.altKey
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          e.preventDefault()
          shortcut.action()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

/**
 * Shortcuts predefinidos para navegación
 */
export function useNavigationShortcuts() {
  const router = useRouter()

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      action: () => {
        // Abrir command palette (si existe)
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
        })
        window.dispatchEvent(event)
      },
      description: 'Abrir búsqueda rápida',
      category: 'Navegación',
    },
    {
      key: 'n',
      ctrl: true,
      action: () => router.push('/dashboard/quotes/new'),
      description: 'Nueva cotización',
      category: 'Acciones',
    },
    {
      key: 'c',
      ctrl: true,
      action: () => router.push('/dashboard/clients'),
      description: 'Ir a clientes',
      category: 'Navegación',
    },
    {
      key: 'e',
      ctrl: true,
      action: () => router.push('/dashboard/events'),
      description: 'Ir a eventos',
      category: 'Navegación',
    },
    {
      key: 'q',
      ctrl: true,
      action: () => router.push('/dashboard/quotes'),
      description: 'Ir a cotizaciones',
      category: 'Navegación',
    },
  ])
}

/**
 * Shortcuts para acciones rápidas
 */
export const globalShortcuts: KeyboardShortcut[] = [
  {
    key: '/',
    action: () => {
      // Focus en búsqueda si existe
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="buscar" i]') as HTMLInputElement
      searchInput?.focus()
    },
    description: 'Focus en búsqueda',
    category: 'Navegación',
  },
  {
    key: 'Escape',
    action: () => {
      // Cerrar modales abiertos
      const modals = document.querySelectorAll('[role="dialog"]')
      modals.forEach((modal) => {
        const closeButton = modal.querySelector('button[aria-label*="cerrar" i], button[aria-label*="close" i]')
        if (closeButton) (closeButton as HTMLButtonElement).click()
      })
    },
    description: 'Cerrar modales',
    category: 'Acciones',
  },
]
