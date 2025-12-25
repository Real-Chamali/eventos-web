/**
 * Manejo Centralizado de Errores
 * 
 * Proporciona funciones consistentes para manejar errores en toda la aplicación
 * - Logging estructurado
 * - Mensajes de error seguros (no exponen información sensible)
 * - Formato consistente de respuestas
 * 
 * CRÍTICO: Todos los errores deben pasar por estas funciones
 */

import { NextResponse } from 'next/server'
import { logger } from './logger'
import { sanitizeForLogging } from './security'

export interface ErrorResponse {
  error: string
  message?: string
  details?: Record<string, unknown>
  code?: string
}

/**
 * Tipos de errores conocidos
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL = 'EXTERNAL_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

/**
 * Mapeo de códigos de error de Supabase a ErrorType
 */
function mapSupabaseError(error: { code?: string; message?: string }): ErrorType {
  if (!error.code) {
    return ErrorType.INTERNAL
  }

  switch (error.code) {
    case '23505': // Unique violation
      return ErrorType.CONFLICT
    case '23503': // Foreign key violation
      return ErrorType.VALIDATION
    case '23514': // Check constraint violation
      return ErrorType.VALIDATION
    case 'PGRST116': // Not found
      return ErrorType.NOT_FOUND
    default:
      return ErrorType.DATABASE
  }
}

/**
 * Determina el tipo de error basado en el error recibido
 */
function determineErrorType(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('unauthorized') || message.includes('not authenticated')) {
      return ErrorType.UNAUTHORIZED
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.FORBIDDEN
    }

    if (message.includes('not found') || message.includes('does not exist')) {
      return ErrorType.NOT_FOUND
    }

    if (message.includes('duplicate') || message.includes('already exists')) {
      return ErrorType.CONFLICT
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return ErrorType.RATE_LIMIT
    }
  }

  // Si es un objeto con código (Supabase error)
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return mapSupabaseError(error as { code?: string; message?: string })
  }

  return ErrorType.INTERNAL
}

/**
 * Obtiene un mensaje de error seguro para el cliente
 * No expone información sensible en producción
 */
function getSafeErrorMessage(
  error: unknown,
  errorType: ErrorType,
  context: string
): string {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // En desarrollo, mostrar más detalles
  if (isDevelopment && error instanceof Error) {
    return error.message
  }

  // Mensajes genéricos seguros para producción
  switch (errorType) {
    case ErrorType.VALIDATION:
      return 'Los datos proporcionados no son válidos'
    case ErrorType.UNAUTHORIZED:
      return 'No estás autenticado'
    case ErrorType.FORBIDDEN:
      return 'No tienes permisos para realizar esta acción'
    case ErrorType.NOT_FOUND:
      return 'El recurso solicitado no existe'
    case ErrorType.CONFLICT:
      return 'El recurso ya existe o hay un conflicto'
    case ErrorType.RATE_LIMIT:
      return 'Demasiadas solicitudes. Por favor intenta más tarde'
    case ErrorType.DATABASE:
      return 'Error al procesar la solicitud'
    case ErrorType.EXTERNAL:
      return 'Error al comunicarse con servicio externo'
    case ErrorType.INTERNAL:
    default:
      return 'Ocurrió un error inesperado'
  }
}

/**
 * Maneja un error y retorna una respuesta HTTP apropiada
 * 
 * @param error - El error a manejar
 * @param context - Contexto donde ocurrió el error (ej: "API /quotes")
 * @param userId - ID del usuario (opcional, para logging)
 * @param statusCode - Código de estado HTTP (opcional, se determina automáticamente)
 */
export function handleError(
  error: unknown,
  context: string,
  userId?: string,
  statusCode?: number
): NextResponse<ErrorResponse> {
  const errorType = determineErrorType(error)
  const safeMessage = getSafeErrorMessage(error, errorType, context)

  // Determinar código de estado HTTP si no se proporciona
  let httpStatus = statusCode
  if (!httpStatus) {
    switch (errorType) {
      case ErrorType.VALIDATION:
        httpStatus = 400
        break
      case ErrorType.UNAUTHORIZED:
        httpStatus = 401
        break
      case ErrorType.FORBIDDEN:
        httpStatus = 403
        break
      case ErrorType.NOT_FOUND:
        httpStatus = 404
        break
      case ErrorType.CONFLICT:
        httpStatus = 409
        break
      case ErrorType.RATE_LIMIT:
        httpStatus = 429
        break
      case ErrorType.DATABASE:
      case ErrorType.EXTERNAL:
      case ErrorType.INTERNAL:
      default:
        httpStatus = 500
    }
  }

  // Logging estructurado
  const errorDetails = error instanceof Error
    ? {
        message: error.message,
        stack: error.stack?.substring(0, 500), // Limitar stack trace
        name: error.name,
      }
    : { error: String(error) }

  logger.error(
    context,
    `Error ${errorType}: ${safeMessage}`,
    error instanceof Error ? error : new Error(String(error)),
    sanitizeForLogging({
      errorType,
      httpStatus,
      userId,
      ...errorDetails,
    })
  )

  // Construir respuesta
  const response: ErrorResponse = {
    error: errorType,
    message: safeMessage,
  }

  // En desarrollo, agregar detalles adicionales
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    response.details = {
      originalMessage: error.message,
      name: error.name,
    }
  }

  return NextResponse.json(response, { status: httpStatus })
}

/**
 * Maneja errores de validación específicamente
 */
export function handleValidationError(
  errors: Record<string, string> | string[],
  context: string
): NextResponse<ErrorResponse> {
  logger.warn(context, 'Validation error', sanitizeForLogging({ errors }))

  const response: ErrorResponse = {
    error: ErrorType.VALIDATION,
    message: 'Los datos proporcionados no son válidos',
    details: Array.isArray(errors)
      ? { errors }
      : errors,
  }

  return NextResponse.json(response, { status: 400 })
}

/**
 * Wrapper para funciones async que maneja errores automáticamente
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      throw handleError(error, context)
    }
  }) as T
}

/**
 * Crea una respuesta de error simple
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  errorType: ErrorType = ErrorType.INTERNAL
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: errorType,
      message,
    },
    { status }
  )
}

/**
 * Crea una respuesta de éxito
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<{ data: T; message?: string }> {
  return NextResponse.json(
    {
      data,
      ...(message && { message }),
    },
    { status }
  )
}

