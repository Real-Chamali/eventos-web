/**
 * Utilidades para Microinteracciones Premium
 * 
 * Funciones para mejorar la experiencia del usuario con animaciones
 * y feedback visual en todas las acciones
 */

import { motion } from 'framer-motion'

/**
 * Variantes de animación para botones
 */
export const buttonVariants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
}

/**
 * Variantes de animación para cards
 */
export const cardVariants = {
  hover: {
    y: -4,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    transition: { duration: 0.2 },
  },
  tap: {
    y: 0,
    transition: { duration: 0.1 },
  },
}

/**
 * Variantes de animación para listas
 */
export const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
}

/**
 * Variantes de animación para modales
 */
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
}

/**
 * Variantes de animación para overlays
 */
export const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

/**
 * Variantes de animación para toasts
 */
export const toastVariants = {
  hidden: {
    opacity: 0,
    x: 300,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: 300,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
}

/**
 * Variantes de animación para skeleton loaders
 */
export const skeletonVariants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/**
 * Variantes de animación para transiciones de página
 */
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
}

/**
 * Variantes de animación para ripple effect
 */
export const rippleVariants = {
  initial: {
    scale: 0,
    opacity: 0.6,
  },
  animate: {
    scale: 4,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

/**
 * Variantes de animación para confetti
 */
export const confettiVariants = {
  initial: {
    y: 0,
    opacity: 1,
  },
  animate: {
    y: 1000,
    opacity: 0,
    transition: {
      duration: 3,
      ease: 'easeIn',
    },
  },
}

/**
 * Hook para animación de entrada
 */
export function useFadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay },
  }
}

/**
 * Hook para animación de escala
 */
export function useScaleIn(delay = 0) {
  return {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, delay },
  }
}

/**
 * Hook para animación de slide
 */
export function useSlideIn(direction: 'left' | 'right' | 'up' | 'down' = 'up', delay = 0) {
  const directions = {
    left: { x: -20 },
    right: { x: 20 },
    up: { y: 20 },
    down: { y: -20 },
  }
  
  return {
    initial: { opacity: 0, ...directions[direction] },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { duration: 0.3, delay },
  }
}

/**
 * Función para crear efecto ripple en botones
 */
export function createRipple(event: React.MouseEvent<HTMLElement>) {
  const button = event.currentTarget
  const circle = document.createElement('span')
  const diameter = Math.max(button.clientWidth, button.clientHeight)
  const radius = diameter / 2

  circle.style.width = circle.style.height = `${diameter}px`
  circle.style.left = `${event.clientX - button.offsetLeft - radius}px`
  circle.style.top = `${event.clientY - button.offsetTop - radius}px`
  circle.classList.add('ripple')

  const ripple = button.getElementsByClassName('ripple')[0]
  if (ripple) {
    ripple.remove()
  }

  button.appendChild(circle)
  
  setTimeout(() => {
    circle.remove()
  }, 600)
}

/**
 * Función para animar número (count up)
 */
export function animateNumber(
  from: number,
  to: number,
  duration: number,
  callback: (value: number) => void
) {
  const startTime = Date.now()
  const difference = to - from
  
  function update() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function (ease-out)
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = from + difference * eased
    
    callback(Math.floor(current))
    
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  
  update()
}

