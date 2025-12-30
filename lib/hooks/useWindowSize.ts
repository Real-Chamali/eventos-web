/**
 * Hook para obtener el tamaño de la ventana de forma reactiva
 * Útil para hacer componentes responsive
 */

'use client'

import { useState, useEffect } from 'react'

interface WindowSize {
  width: number
  height: number
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Llamar inmediatamente para establecer el tamaño inicial

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

