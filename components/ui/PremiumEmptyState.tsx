'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import Button from './Button'
import { LucideIcon } from 'lucide-react'

interface PremiumEmptyStateProps {
  icon?: ReactNode | LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'premium' | 'outline'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  illustration?: 'empty' | 'search' | 'error' | 'success' | 'loading'
  className?: string
}

// Ilustraciones SVG animadas
const EmptyIllustration = () => (
  <motion.svg
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-gray-300 dark:text-gray-700"
  >
    <motion.circle
      cx="100"
      cy="100"
      r="80"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="4 4"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, delay: 0.2 }}
    />
    <motion.path
      d="M70 100 L90 120 L130 80"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    />
  </motion.svg>
)

const SearchIllustration = () => (
  <motion.svg
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-gray-300 dark:text-gray-700"
  >
    <motion.circle
      cx="90"
      cy="90"
      r="50"
      stroke="currentColor"
      strokeWidth="3"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    <motion.line
      x1="130"
      y1="130"
      x2="170"
      y2="170"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    />
  </motion.svg>
)

const ErrorIllustration = () => (
  <motion.svg
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-red-300 dark:text-red-700"
  >
    <motion.circle
      cx="100"
      cy="100"
      r="70"
      stroke="currentColor"
      strokeWidth="3"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    <motion.line
      x1="80"
      y1="80"
      x2="120"
      y2="120"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    />
    <motion.line
      x1="120"
      y1="80"
      x2="80"
      y2="120"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.7 }}
    />
  </motion.svg>
)

const SuccessIllustration = () => (
  <motion.svg
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-emerald-300 dark:text-emerald-700"
  >
    <motion.circle
      cx="100"
      cy="100"
      r="70"
      stroke="currentColor"
      strokeWidth="3"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    <motion.path
      d="M70 100 L90 120 L130 80"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    />
  </motion.svg>
)

const LoadingIllustration = () => (
  <motion.svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-indigo-300 dark:text-indigo-700"
  >
    <motion.circle
      cx="100"
      cy="100"
      r="70"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      strokeDasharray="20 10"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    />
  </motion.svg>
)

const illustrations = {
  empty: EmptyIllustration,
  search: SearchIllustration,
  error: ErrorIllustration,
  success: SuccessIllustration,
  loading: LoadingIllustration,
}

export default function PremiumEmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration = 'empty',
  className,
}: PremiumEmptyStateProps) {
  const Illustration = illustrations[illustration]
  const IconComponent = typeof icon === 'function' ? icon : null
  const CustomIcon = typeof icon !== 'function' && icon ? icon : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* Ilustración o Icono */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        {CustomIcon ? (
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 shadow-xl">
            <div className="text-indigo-600 dark:text-indigo-400">
              {CustomIcon}
            </div>
          </div>
        ) : IconComponent ? (
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 shadow-xl">
            <IconComponent className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <div className="flex h-32 w-32 items-center justify-center">
            <Illustration />
          </div>
        )}
      </motion.div>

      {/* Título */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-3 text-2xl font-bold text-gray-900 dark:text-white"
      >
        {title}
      </motion.h3>

      {/* Descripción */}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-400"
        >
          {description}
        </motion.p>
      )}

      {/* Acciones */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {action && (
            <Button
              variant={action.variant || 'premium'}
              onClick={action.onClick}
              className="shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

