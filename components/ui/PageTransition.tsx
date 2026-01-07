'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

// Variantes premium con efectos avanzados
const pageVariants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.96,
    filter: 'blur(8px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    filter: 'blur(4px)',
  },
}

// Variantes simplificadas para usuarios que prefieren menos movimiento
const reducedMotionVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
}

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
}

const reducedMotionTransition = {
  duration: 0.2,
  ease: 'easeInOut' as const,
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Pequeño delay para suavizar la transición inicial
    const timer = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(timer)
  }, [pathname])

  const variants = prefersReducedMotion ? reducedMotionVariants : pageVariants
  const transition = prefersReducedMotion ? reducedMotionTransition : pageTransition

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
        className="w-full"
        style={{
          willChange: 'transform, opacity, filter',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

