/**
 * Input Premium con validación en tiempo real y feedback visual
 */

'use client'

import { InputHTMLAttributes, forwardRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { CheckCircle2, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  helperText?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  animated?: boolean
  validateOnBlur?: boolean
  validator?: (value: string) => { isValid: boolean; error?: string }
}

const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({
    className,
    label,
    error,
    success,
    helperText,
    icon,
    iconPosition = 'left',
    animated = true,
    validateOnBlur = true,
    validator,
    type = 'text',
    onBlur,
    onChange,
    ...props
  }, ref) => {
    const [internalError, setInternalError] = useState<string | undefined>(undefined)
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [value, setValue] = useState(props.value?.toString() || props.defaultValue?.toString() || '')

    const isPassword = type === 'password'
    const displayType = isPassword && showPassword ? 'text' : type
    const hasError = error || internalError
    const isValid = success || (value && !hasError && validator ? validator(value).isValid : false)

    useEffect(() => {
      if (props.value !== undefined) {
        setValue(props.value.toString())
      }
    }, [props.value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
      onChange?.(e)

      // Validación en tiempo real si hay validator
      if (validator && e.target.value) {
        const validation = validator(e.target.value)
        if (!validation.isValid) {
          setInternalError(validation.error)
        } else {
          setInternalError(undefined)
        }
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      if (validateOnBlur && validator && value) {
        const validation = validator(value)
        if (!validation.isValid) {
          setInternalError(validation.error)
        } else {
          setInternalError(undefined)
        }
      }
      onBlur?.(e)
    }

    const handleFocus = () => {
      setIsFocused(true)
    }

    // Filtrar props que no son compatibles con motion.input
    const { 
      onDrag, 
      onDragStart, 
      onDragEnd,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      ...motionProps 
    } = props

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <motion.input
            ref={ref}
            type={displayType}
            className={cn(
              'w-full rounded-xl border-2 bg-white px-4 py-3 text-sm transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
              'dark:bg-gray-900 dark:text-white',
              icon && iconPosition === 'left' && 'pl-10',
              (icon && iconPosition === 'right') || (isPassword && !icon) ? 'pr-10' : '',
              hasError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
                : isValid
                  ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500 dark:border-emerald-500'
                  : isFocused
                    ? 'border-indigo-500 focus:border-indigo-500 focus:ring-indigo-500 dark:border-indigo-500'
                    : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            animate={animated && isFocused ? { scale: 1.01 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            {...motionProps}
            value={value}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
          {icon && iconPosition === 'right' && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <AnimatePresence>
            {hasError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <XCircle className="w-5 h-5 text-red-500" />
              </motion.div>
            )}
            {isValid && !hasError && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {(hasError || helperText) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              {hasError ? (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error || internalError}
                </p>
              ) : helperText ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

PremiumInput.displayName = 'PremiumInput'

export default PremiumInput
