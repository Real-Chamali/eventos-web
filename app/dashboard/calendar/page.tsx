import Calendar from '@/components/ui/Calendar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Calendar as CalendarIcon, Info, RefreshCw } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Calendario de Eventos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Visualiza todas las fechas ocupadas y eventos programados
          </p>
        </div>
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
          <CalendarIcon className="h-7 w-7 text-white" />
        </div>
      </div>

      {/* Info Card - Premium */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Información del Calendario
              </CardTitle>
              <CardDescription className="mt-1">
                Cómo usar el calendario de eventos
              </CardDescription>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <RefreshCw className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Actualización Automática
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  El calendario se actualiza automáticamente cada 30 segundos para mostrar los eventos más recientes.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Fechas Ocupadas
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Las fechas marcadas en verde indican eventos confirmados. Haz clic en una fecha para ver los detalles.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Navegación
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Usa las flechas para navegar entre meses y ver eventos pasados o futuros.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar - Premium Card */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Vista Mensual</CardTitle>
              <CardDescription className="mt-1">
                Todos los eventos programados en el calendario
              </CardDescription>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Calendar />
        </CardContent>
      </Card>
    </div>
  )
}

