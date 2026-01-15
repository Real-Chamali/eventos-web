'use client'

import { motion } from 'framer-motion'

interface RippleProps {
  x: number
  y: number
  onComplete: () => void
}

export function Ripple({ x, y, onComplete }: RippleProps) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/30 pointer-events-none"
      initial={{ width: 0, height: 0, x, y, opacity: 1 }}
      animate={{ width: 300, height: 300, x: x - 150, y: y - 150, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
    />
  )
}

interface UseRippleProps {
  disabled?: boolean
}

export function useRipple() {
  const rippleRef = useRef<HTMLDivElement>(null)
  const ripplesRef = useRef<Array<{ id: number; x: number; y: number }>>([])

  const addRipple = (event: React.MouseEvent<HTMLElement>) => {
    if (!rippleRef.current) return

    const rect = rippleRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const id = Date.now()
    ripplesRef.current.push({ id, x, y })

    // Limpiar después de la animación
    setTimeout(() => {
      ripplesRef.current = ripplesRef.current.filter(r => r.id !== id)
    }, 600)
  }

  const RippleContainer = ({ children, disabled }: { children: React.ReactNode } & UseRippleProps) => (
    <div
      ref={rippleRef}
      className="relative overflow-hidden"
      onClick={disabled ? undefined : addRipple}
    >
      {children}
      {ripplesRef.current.map(ripple => (
        <Ripple
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          onComplete={() => {
            ripplesRef.current = ripplesRef.current.filter(r => r.id !== ripple.id)
          }}
        />
      ))}
    </div>
  )

  return { RippleContainer, addRipple }
}

