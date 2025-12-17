/**
 * Skip links para navegación por teclado
 * Mejora accesibilidad permitiendo saltar al contenido principal
 */

'use client'

import Link from 'next/link'

export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50">
      <nav aria-label="Skip links">
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              href="#main-content"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Saltar al contenido principal
            </Link>
          </li>
          <li>
            <Link
              href="#navigation"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Saltar a la navegación
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

