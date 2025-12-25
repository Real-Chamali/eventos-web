import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { logger } from '@/lib/utils/logger'

/**
 * Ruta API para servir el Manifest
 * Esto asegura que se sirva con los headers correctos
 */
export async function GET(request: NextRequest) {
  try {
    // Leer el archivo del manifest desde public
    const manifestPath = join(process.cwd(), 'public', 'manifest.json')
    const manifestContent = await readFile(manifestPath, 'utf-8')

    // Parsear y validar JSON
    const manifest = JSON.parse(manifestContent)

    // Asegurar que share_target tenga enctype si no lo tiene
    if (manifest.share_target && !manifest.share_target.enctype) {
      manifest.share_target.enctype = 'application/x-www-form-urlencoded'
    }

    // Retornar con headers correctos para Manifest
    return NextResponse.json(manifest, {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    })
  } catch (error) {
    logger.error('ManifestRoute', 'Error serving manifest', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Manifest not found' },
      { status: 404 }
    )
  }
}

// Asegurar que esta ruta no sea cacheada incorrectamente
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

