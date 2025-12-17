'use client'

import { useState } from 'react'
import { Calendar, Download, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import {
  generateGoogleCalendarLink,
  generateOutlookCalendarLink,
  downloadICSFile,
  type CalendarEvent,
} from '@/lib/integrations/calendar'

interface CalendarIntegrationProps {
  event: CalendarEvent
}

export default function CalendarIntegration({ event }: CalendarIntegrationProps) {

  const handleGoogleCalendar = () => {
    const link = generateGoogleCalendarLink(event)
    window.open(link, '_blank')
  }

  const handleOutlookCalendar = () => {
    const link = generateOutlookCalendarLink(event)
    window.open(link, '_blank')
  }

  const handleDownloadICS = () => {
    downloadICSFile(event, `evento-${Date.now()}.ics`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Agregar al Calendario</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                Agregar a Calendario
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleGoogleCalendar}>
                <span className="mr-2">📅</span>
                Google Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOutlookCalendar}>
                <span className="mr-2">📆</span>
                Outlook Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadICS}>
                <Download className="mr-2 h-4 w-4" />
                Descargar .ics
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Agrega este evento a tu calendario favorito
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

