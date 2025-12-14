/**
 * Logger centralizado para la aplicación
 * Reemplaza console.error y console.log con un sistema estructurado
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
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatEntry(logEntry: LogEntry): string {
    return `[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.context}] ${logEntry.message}${
      logEntry.data ? ' ' + JSON.stringify(logEntry.data) : ''
    }`
  }

  private async sendToService(entry: LogEntry): Promise<void> {
    // En producción, enviar a servicio de error tracking si está configurado
    if (!this.isDevelopment && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        // Dynamic import para evitar errores si Sentry no está disponible
        const Sentry = await import('@sentry/nextjs')
        if (Sentry && entry.level === LogLevel.ERROR) {
          Sentry.captureException(new Error(entry.message), {
            tags: { context: entry.context },
            extra: entry.data,
          })
        }
      } catch {
        // Silenciar errores de logging - usar solo logger interno
      }
    }
    
    // En producción sin Sentry, los logs se pueden enviar a:
    // - Supabase (tabla de logs)
    // - Servicio de logging externo
    // - Archivo de logs
    // Por ahora, solo se muestran en consola en desarrollo
  }

  private log(level: LogLevel, context: string, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    }

    const formatted = this.formatEntry(entry)

    // En desarrollo, usar console
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formatted, data)
          break
        case LogLevel.INFO:
          console.info(formatted, data)
          break
        case LogLevel.WARN:
          console.warn(formatted, data)
          break
        case LogLevel.ERROR:
          console.error(formatted, data)
          break
      }
    }

    // Enviar a servicio externo (no bloqueante)
    void this.sendToService(entry)
  }

  debug(context: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, context, message, data)
  }

  info(context: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, context, message, data)
  }

  warn(context: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, context, message, data)
  }

  error(context: string, message: string, error?: Error, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      context,
      message: error ? `${message}: ${error.message}` : message,
      data: {
        ...data,
        ...(error && { error: error.message, stack: error.stack }),
      },
      stack: error?.stack,
    }

    const formatted = this.formatEntry(entry)

    if (this.isDevelopment) {
      console.error(formatted, error, data)
    }

    // Enviar a servicio externo (no bloqueante)
    void this.sendToService(entry)
  }
}

export const logger = new Logger()
