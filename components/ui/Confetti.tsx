'use client'

import confetti from 'canvas-confetti'

interface ConfettiOptions {
  particleCount?: number
  spread?: number
  origin?: { x: number; y: number }
  colors?: string[]
  shapes?: ('square' | 'circle')[]
}

export function triggerConfetti(options: ConfettiOptions = {}) {
  const {
    particleCount = 100,
    spread = 70,
    origin = { x: 0.5, y: 0.5 },
    colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
    shapes = ['square', 'circle'],
  } = options

  confetti({
    particleCount,
    spread,
    origin,
    colors,
    shapes,
    zIndex: 9999,
  })
}

export function triggerSuccessConfetti() {
  triggerConfetti({
    particleCount: 150,
    spread: 60,
    colors: ['#10b981', '#34d399', '#6ee7b7'],
  })
}

export function triggerCelebrationConfetti() {
  // Múltiples ráfagas para celebración
  const duration = 3000
  const end = Date.now() + duration

  const interval = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval)
      return
    }

    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899'],
    })

    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#f59e0b', '#10b981', '#3b82f6'],
    })
  }, 250)
}

// Hook para usar confetti en componentes
export function useConfetti() {
  return {
    trigger: triggerConfetti,
    success: triggerSuccessConfetti,
    celebrate: triggerCelebrationConfetti,
  }
}

