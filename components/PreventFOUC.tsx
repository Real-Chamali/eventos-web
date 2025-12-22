'use client'

import { useEffect } from 'react'

/**
 * Componente para prevenir FOUC (Flash of Unstyled Content)
 * Se ejecuta solo en el cliente después de la hidratación
 */
export default function PreventFOUC() {
  useEffect(() => {
    // Asegurar que el contenido sea visible después de la hidratación
    if (typeof document !== 'undefined') {
      const html = document.documentElement
      html.style.visibility = 'visible'
      html.style.opacity = '1'
      html.style.transition = 'opacity 0.2s'
    }
  }, [])

  return null
}

