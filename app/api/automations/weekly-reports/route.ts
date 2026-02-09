import { NextRequest, NextResponse } from 'next/server'
import { triggerWeeklyReports } from '@/lib/automations/weekly-reports'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Verificar si es un cron job (usando un header secreto)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      // Para desarrollo, permitir sin autenticación
      if (process.env.NODE_ENV === 'development') {
        logger.info('WeeklyReportsAPI', 'Development mode - skipping auth')
      } else {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const result = await triggerWeeklyReports()
    
    return NextResponse.json(result)
  } catch (error) {
    logger.error('WeeklyReportsAPI', 'Error processing weekly reports', error as Error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// También permitir GET para pruebas manuales
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'development') {
        logger.info('WeeklyReportsAPI', 'Development mode - skipping auth')
      } else {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const result = await triggerWeeklyReports()
    
    return NextResponse.json(result)
  } catch (error) {
    logger.error('WeeklyReportsAPI', 'Error processing weekly reports', error as Error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
