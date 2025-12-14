'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import confetti from 'canvas-confetti'

export default function EventPage() {
  const params = useParams()
  const eventId = params.id as string

  useEffect(() => {
    // Mostrar confeti al cargar la página
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    // Cleanup: limpiar el interval cuando el componente se desmonte
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow p-8 border border-gray-200 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Venta Cerrada Exitosamente!
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          El evento ha sido creado y la venta ha sido confirmada.
        </p>
        <p className="text-sm text-gray-500">
          ID del Evento: {eventId}
        </p>
      </div>
    </div>
  )
}


