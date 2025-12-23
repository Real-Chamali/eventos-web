/**
 * Calendario Estratégico para Dueño
 * Análisis de rentabilidad por fecha, temporadas y valor
 */

'use client'

import PageHeader from '@/components/ui/PageHeader'
import StrategicCalendar from '@/components/admin/StrategicCalendar'

export default function StrategicCalendarPage() {
  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Calendario Estratégico"
        description="Análisis de rentabilidad por fecha, temporadas altas y bajas, valor por fecha"
      />
      <StrategicCalendar />
    </div>
  )
}

