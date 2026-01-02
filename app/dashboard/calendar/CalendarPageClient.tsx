'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import FullCalendarView from '@/components/calendar/FullCalendarView'
import { Calendar as CalendarIcon } from 'lucide-react'

/**
 * Página de Calendario
 * Muestra todos los eventos del sistema en formato de calendario visual
 * Solo accesible para vendedores y administradores
 */
export default function CalendarPageClient() {
  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8" role="region" aria-label="Calendario de eventos">
      {/* Premium Header */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          Calendario de Eventos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
          Visualiza todos tus eventos y gestiona pagos desde el calendario
        </p>
      </div>

      {/* Calendar Card */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Calendario Visual</CardTitle>
              <CardDescription className="mt-1">
                Haz clic en un evento para ver detalles y registrar pagos
              </CardDescription>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <CalendarIcon className="h-7 w-7 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <FullCalendarView />
        </CardContent>
      </Card>
    </div>
  )
}

