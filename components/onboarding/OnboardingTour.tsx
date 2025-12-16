'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

interface TourStep {
  id: string
  title: string
  description: string
  target?: string // Selector CSS del elemento a destacar
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a Eventos CRM!',
    description: 'Te guiaremos por las características principales de la aplicación.',
    position: 'bottom',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Aquí verás tus métricas clave, ventas y cotizaciones recientes.',
    target: '[data-tour="dashboard"]',
    position: 'bottom',
  },
  {
    id: 'quotes',
    title: 'Cotizaciones',
    description: 'Gestiona todas tus cotizaciones desde aquí. Crea, edita y envía cotizaciones a tus clientes.',
    target: '[data-tour="quotes"]',
    position: 'bottom',
  },
  {
    id: 'clients',
    title: 'Clientes',
    description: 'Mantén un registro completo de todos tus clientes y su historial.',
    target: '[data-tour="clients"]',
    position: 'bottom',
  },
  {
    id: 'search',
    title: 'Búsqueda Global',
    description: 'Usa ⌘K para buscar rápidamente cotizaciones, clientes y eventos.',
    target: '[data-tour="search"]',
    position: 'bottom',
  },
]

interface OnboardingTourProps {
  steps?: TourStep[]
  onComplete?: () => void
}

export default function OnboardingTour({ steps = DEFAULT_TOUR_STEPS, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya completó el tour
    const tourCompleted = localStorage.getItem('onboarding-tour-completed')
    if (!tourCompleted) {
      setIsVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem('onboarding-tour-completed', 'true')
    setIsVisible(false)
    if (onComplete) {
      onComplete()
    }
  }

  if (!isVisible) return null

  const currentStepData = steps[currentStep]
  const targetElement = currentStepData.target
    ? document.querySelector(currentStepData.target)
    : null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleSkip} />

      {/* Tour Card */}
      <div
        className={cn(
          'fixed z-50 transition-all duration-300',
          targetElement
            ? 'transform -translate-x-1/2 -translate-y-full'
            : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        )}
        style={
          targetElement
            ? {
                left: `${targetElement.getBoundingClientRect().left + targetElement.getBoundingClientRect().width / 2}px`,
                top: `${targetElement.getBoundingClientRect().top}px`,
              }
            : {}
        }
      >
        <Card className="w-96 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentStepData.description}
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="ml-4 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      index === currentStep
                        ? 'bg-blue-600'
                        : index < currentStep
                        ? 'bg-blue-300'
                        : 'bg-gray-300'
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrevious}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                )}
                <Button size="sm" onClick={handleNext}>
                  {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                  {currentStep < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

