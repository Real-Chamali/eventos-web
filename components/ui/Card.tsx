import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'rounded-2xl border border-gray-200/60 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 dark:border-gray-800/60 dark:bg-gray-900',
    elevated: 'rounded-2xl border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-200 dark:bg-gray-900',
    outlined: 'rounded-2xl border-2 border-gray-200 bg-transparent hover:border-gray-300 transition-colors duration-200 dark:border-gray-800 dark:hover:border-gray-700',
    glass: 'rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-200 dark:bg-gray-900/80 dark:border-gray-800/60',
  }
  
  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)} {...props} />
))

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-white', className)}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm leading-relaxed text-gray-600 dark:text-gray-400', className)} {...props} />
  )
)

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0 gap-2', className)} {...props} />
))

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
