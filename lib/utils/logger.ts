/**
 * Logger centralizado para la aplicación
 * Reemplaza console.error y console.log con un sistema estructurado
 * 
 * Características:
 * - Logging estructurado con niveles (DEBUG, INFO, WARN, ERROR)
 * - Formato mejorado con colores en desarrollo
 * - Integración opcional con Sentry para producción
 * - Soporte para metadata y stack traces
 * - Logging no bloqueante para mejor rendimiento
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  data?: Record<string, unknown>
  stack?: string
  userId?: string
  requestId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel: LogLevel

  constructor() {
    // Determinar nivel de log basado en variable de entorno
    // Por defecto: INFO en producción, WARN en desarrollo (para evitar spam de DEBUG)
    const envLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase()
    this.logLevel = envLogLevel && Object.values(LogLevel).includes(envLogLevel as LogLevel)
      ? (envLogLevel as LogLevel)
      : this.isDevelopment
      ? LogLevel.WARN  // Cambiado de DEBUG a WARN para reducir ruido
      : LogLevel.INFO
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const currentIndex = levels.indexOf(this.logLevel)
    const messageIndex = levels.indexOf(level)
    return messageIndex >= currentIndex
  }

  private getColorForLevel(level: LogLevel): string {
    if (!this.isDevelopment) return ''
    
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    }
    return colors[level] || ''
  }

  private resetColor(): string {
    return this.isDevelopment ? '\x1b[0m' : ''
  }

  private formatEntry(logEntry: LogEntry): string {
    const color = this.getColorForLevel(logEntry.level)
    const reset = this.resetColor()
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString('es-ES', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
    
    const levelStr = `${color}${logEntry.level.padEnd(5)}${reset}`
    const contextStr = `[${logEntry.context}]`
    const messageStr = logEntry.message
    
    let formatted = `${timestamp} ${levelStr} ${contextStr} ${messageStr}`
    
    if (logEntry.data && Object.keys(logEntry.data).length > 0) {
      formatted += ` ${JSON.stringify(logEntry.data, null, this.isDevelopment ? 2 : 0)}`
    }
    
    if (logEntry.stack && this.isDevelopment) {
      formatted += `\n${logEntry.stack}`
    }
    
    return formatted
  }

  private async sendToService(entry: LogEntry): Promise<void> {
    // Solo enviar errores a servicios externos en producción
    if (this.isDevelopment) {
      return
    }

    // Enviar a Sentry si está configurado (solo errores)
    if (entry.level === LogLevel.ERROR && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        const Sentry = await import('@sentry/nextjs')
        if (Sentry) {
          const error = new Error(entry.message)
          error.stack = entry.stack
          
          Sentry.captureException(error, {
            tags: {
              context: entry.context,
              level: entry.level,
              ...(entry.userId && { userId: entry.userId }),
              ...(entry.requestId && { requestId: entry.requestId }),
            },
            extra: {
              ...entry.data,
              timestamp: entry.timestamp,
            },
            user: entry.userId ? { id: entry.userId } : undefined,
          })
        }
      } catch {
        // Silenciar errores de logging - usar solo logger interno
        // No queremos que el logger cause errores en cascada
      }
    }

    // TODO: En el futuro, se pueden agregar más destinos:
    // - Supabase (tabla de logs para auditoría)
    // - LogRocket, Datadog, etc.
    // - Archivo de logs en servidor
    // - Webhook para notificaciones críticas
  }

  private log(
    level: LogLevel,
    context: string,
    message: string,
    data?: Record<string, unknown>,
    userId?: string,
    requestId?: string
  ): void {
    // Verificar si debemos loguear este nivel
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
      userId,
      requestId,
    }

    const formatted = this.formatEntry(entry)

    // En desarrollo, usar console con formato mejorado
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formatted)
          break
        case LogLevel.INFO:
          console.info(formatted)
          break
        case LogLevel.WARN:
          console.warn(formatted)
          break
        case LogLevel.ERROR:
          console.error(formatted)
          break
      }
    }

    // Enviar a servicio externo (no bloqueante)
    void this.sendToService(entry)
  }

  /**
   * Log de nivel DEBUG - Solo en desarrollo o si LOG_LEVEL=DEBUG
   * Útil para información detallada de debugging
   */
  debug(context: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, context, message, data)
  }

  /**
   * Log de nivel INFO - Información general de la aplicación
   * Ejemplo: "Usuario inició sesión", "Cotización creada"
   */
  info(context: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, context, message, data)
  }

  /**
   * Log de nivel WARN - Advertencias que no detienen la ejecución
   * Ejemplo: "Perfil no encontrado, usando valores por defecto"
   */
  warn(context: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, context, message, data)
  }

  /**
   * Log de nivel ERROR - Errores que requieren atención
   * Se envía automáticamente a Sentry en producción si está configurado
   * 
   * @param context - Contexto donde ocurrió el error (ej: "LoginPage", "API/quotes")
   * @param message - Mensaje descriptivo del error
   * @param error - Objeto Error opcional con stack trace
   * @param data - Metadata adicional sobre el error
   */
  error(context: string, message: string, error?: Error, data?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.ERROR)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      context,
      message: error ? `${message}: ${error.message}` : message,
      data: {
        ...data,
        ...(error && {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
        }),
      },
      stack: error?.stack,
    }

    const formatted = this.formatEntry(entry)

    if (this.isDevelopment) {
      console.error(formatted)
      if (error) {
        console.error('Stack trace:', error.stack)
      }
    }

    // Enviar a servicio externo (no bloqueante)
    void this.sendToService(entry)
  }

  /**
   * Log con contexto de usuario - Útil para tracking de acciones de usuario
   */
  logWithUser(
    level: LogLevel,
    context: string,
    message: string,
    userId: string,
    data?: Record<string, unknown>
  ): void {
    this.log(level, context, message, data, userId)
  }

  /**
   * Log con contexto de request - Útil para tracking de requests HTTP
   */
  logWithRequest(
    level: LogLevel,
    context: string,
    message: string,
    requestId: string,
    data?: Record<string, unknown>
  ): void {
    this.log(level, context, message, data, undefined, requestId)
  }
}

export const logger = new Logger()
