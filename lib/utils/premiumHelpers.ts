/**
 * Helpers Premium - Funciones utilitarias avanzadas
 */

/**
 * Formatear moneda con estilo premium
 */
export function formatCurrencyPremium(
  amount: number,
  currency: string = 'MXN',
  locale: string = 'es-MX'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formatear fecha con estilo premium
 */
export function formatDatePremium(
  date: Date | string,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale: string = 'es-MX'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const options: Intl.DateTimeFormatOptions = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'long', day: 'numeric' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  }

  return new Intl.DateTimeFormat(locale, options[format]).format(dateObj)
}

/**
 * Calcular tiempo relativo (hace X tiempo)
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) return 'hace unos segundos'
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`
  if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 604800)} semanas`
  if (diffInSeconds < 31536000) return `hace ${Math.floor(diffInSeconds / 2592000)} meses`
  return `hace ${Math.floor(diffInSeconds / 31536000)} años`
}

/**
 * Truncar texto con ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Generar ID corto legible
 */
export function generateShortId(fullId: string, length: number = 8): string {
  return fullId.slice(0, length).toUpperCase()
}

/**
 * Calcular porcentaje con formato
 */
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${percentage.toFixed(decimals)}%`
}

/**
 * Validar y formatear número de teléfono
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  
  return phone
}

/**
 * Generar gradiente CSS dinámico
 */
export function generateGradient(colors: string[], direction: string = 'to right'): string {
  return `linear-gradient(${direction}, ${colors.join(', ')})`
}

/**
 * Clamp número entre min y max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Copiar al portapapeles con feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback para navegadores antiguos
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      document.body.removeChild(textArea)
      return false
    }
  }
}

/**
 * Descargar archivo
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generar color aleatorio
 */
export function generateRandomColor(): string {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#ef4444', // red
    '#06b6d4', // cyan
    '#6366f1', // indigo
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Verificar si es dispositivo móvil
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Verificar si está en modo oscuro
 */
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(prefers-color-scheme: dark)').matches ||
    document.documentElement.classList.contains('dark')
  )
}
