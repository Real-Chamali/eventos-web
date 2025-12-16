import Calendar from '@/components/ui/Calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Calendar as CalendarIcon, Info } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendario de Eventos</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Visualiza todas las fechas ocupadas y eventos programados
        </p>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Nota:</strong> El calendario se actualiza automáticamente cada 30 segundos. 
                Las fechas marcadas en verde indican eventos confirmados. Haz clic en una fecha para ver los detalles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Calendar />
    </div>
  )
}

