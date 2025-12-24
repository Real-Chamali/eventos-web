import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

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

    // Retornar con headers correctos para Manifest
    return NextResponse.json(manifest, {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving manifest:', error)
    return NextResponse.json(
      { error: 'Manifest not found' },
      { status: 404 }
    )
  }
}

// Asegurar que esta ruta no sea cacheada incorrectamente
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

