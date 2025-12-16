/**
 * Integración con Calendarios
 * Soporta Google Calendar y Outlook
 */

export interface CalendarEvent {
  title: string
  description: string
  start: Date
  end: Date
  location?: string
  attendees?: string[]
}

export function generateGoogleCalendarLink(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.start)}/${formatDate(event.end)}`,
    details: event.description,
    location: event.location || '',
  })

  if (event.attendees && event.attendees.length > 0) {
    params.append('add', event.attendees.join(','))
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function generateOutlookCalendarLink(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
    body: event.description,
    location: event.location || '',
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

export function generateICSFile(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  let ics = 'BEGIN:VCALENDAR\n'
  ics += 'VERSION:2.0\n'
  ics += 'PRODID:-//Eventos CRM//EN\n'
  ics += 'BEGIN:VEVENT\n'
  ics += `UID:${Date.now()}@eventos-crm.com\n`
  ics += `DTSTART:${formatDate(event.start)}\n`
  ics += `DTEND:${formatDate(event.end)}\n`
  ics += `SUMMARY:${event.title}\n`
  ics += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`
  if (event.location) {
    ics += `LOCATION:${event.location}\n`
  }
  if (event.attendees && event.attendees.length > 0) {
    event.attendees.forEach((attendee) => {
      ics += `ATTENDEE;CN=${attendee}:mailto:${attendee}\n`
    })
  }
  ics += 'END:VEVENT\n'
  ics += 'END:VCALENDAR'

  return ics
}

export function downloadICSFile(event: CalendarEvent, filename: string = 'event.ics') {
  const ics = generateICSFile(event)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

