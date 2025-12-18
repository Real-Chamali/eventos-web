'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

const Form = forwardRef<HTMLFormElement, HTMLAttributes<HTMLFormElement>>(
  ({ className, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn('space-y-6', className)}
        {...props}
      />
    )
  }
)
Form.displayName = 'Form'

const FormGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-2', className)}
        {...props}
      />
    )
  }
)
FormGroup.displayName = 'FormGroup'

const FormLabel = forwardRef<HTMLLabelElement, HTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 dark:text-white',
          className
        )}
        {...props}
      />
    )
  }
)
FormLabel.displayName = 'FormLabel'

const FormDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
        {...props}
      />
    )
  }
)
FormDescription.displayName = 'FormDescription'

const FormErrorMessage = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm font-medium text-red-600 dark:text-red-400', className)}
        {...props}
      />
    )
  }
)
FormErrorMessage.displayName = 'FormErrorMessage'

export {
  Form,
  FormGroup,
  FormLabel,
  FormDescription,
  FormErrorMessage,
}

