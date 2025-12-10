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

  private async sendToService(): Promise<void> {
    // En producción, enviar a Sentry, LogRocket, etc
    if (!this.isDevelopment && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        // Ejemplo con Sentry - descomentar cuando Sentry esté configurado
        // await Sentry.captureException(new Error(entry.message), {
        //   level: entry.level.toLowerCase() as SeverityLevel,
        //   tags: { context: entry.context },
        //   extra: entry.data,
        // })
      } catch {
        // Silenciar errores de logging
      }
    }
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

    // Enviar a servicio externo
    this.sendToService()
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
      message,
      data,
      stack: error?.stack,
    }

    const formatted = this.formatEntry(entry)

    if (this.isDevelopment) {
      console.error(formatted, error, data)
    }

    this.sendToService()
  }
}

export const logger = new Logger()
