import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Ruta API para servir el Service Worker
 * Esto evita problemas de redirect que bloquean el registro del SW
 */
export async function GET(request: NextRequest) {
  try {
    // Leer el archivo del Service Worker desde public
    const swPath = join(process.cwd(), 'public', 'sw.js')
    const swContent = await readFile(swPath, 'utf-8')

    // Retornar con headers correctos para Service Worker
    return new NextResponse(swContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error serving service worker:', error)
    return new NextResponse('Service Worker not found', { status: 404 })
  }
}

// Asegurar que esta ruta no sea cacheada incorrectamente
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

