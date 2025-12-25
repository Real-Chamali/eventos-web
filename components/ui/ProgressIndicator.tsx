/**
 * Indicador de Progreso para Formularios
 * 
 * Muestra el progreso de completado de un formulario multi-paso
 */

'use client'

import { cn } from '@/lib/utils/cn'
import { CheckCircle2 } from 'lucide-react'

interface ProgressStep {
  id: string
  label: string
  completed?: boolean
  current?: boolean
}

interface ProgressIndicatorProps {
  steps: ProgressStep[]
  currentStep: number
  className?: string
}

export default function ProgressIndicator({
  steps,
  currentStep,
  className,
}: ProgressIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                    isCompleted &&
                      'bg-emerald-500 border-emerald-500 text-white',
                    isCurrent &&
                      'bg-indigo-500 border-indigo-500 text-white ring-4 ring-indigo-500/20',
                    isUpcoming &&
                      'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[80px]',
                    isCurrent && 'text-indigo-600 dark:text-indigo-400',
                    isCompleted && 'text-emerald-600 dark:text-emerald-400',
                    isUpcoming && 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-all duration-200',
                    isCompleted
                      ? 'bg-emerald-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

