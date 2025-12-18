/**
 * Utilidades de seguridad
 * Sanitización, encriptación, y protección contra ataques comunes
 */

import DOMPurify from 'isomorphic-dompurify'
import crypto from 'crypto'
import { logger } from '@/lib/utils/logger'

/**
 * Sanitizar HTML para prevenir XSS
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitizar entrada de texto (eliminar caracteres especiales)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>\"'%;()&+]/g, '')
    .trim()
    .substring(0, 500) // Limitar longitud
}

/**
 * Generar CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validar CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken
}

/**
 * Genera una clave segura a partir de una contraseña usando PBKDF2
 * 
 * @param password - Contraseña base para derivar la clave
 * @param salt - Salt aleatorio para evitar rainbow tables
 * @returns Buffer con la clave derivada de 32 bytes (256 bits)
 * 
 * @example
 * ```ts
 * const salt = crypto.randomBytes(16)
 * const key = deriveKey('myPassword', salt)
 * ```
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
}

/**
 * Encripta un string usando AES-256-GCM (más seguro que createCipher)
 * 
 * @param data - Datos a encriptar
 * @param key - Clave de encriptación (default: ENCRYPTION_KEY env var)
 * @returns String encriptado en formato: salt:iv:authTag:encrypted
 * 
 * @example
 * ```ts
 * const encrypted = encryptData('datos sensibles', 'mi-clave-secreta')
 * // Resultado: "abc123...:def456...:789xyz...:encrypted_data..."
 * ```
 */
export function encryptData(data: string, key: string = process.env.ENCRYPTION_KEY || 'default'): string {
  try {
    const algorithm = 'aes-256-gcm'
    const iv = crypto.randomBytes(16)
    const salt = crypto.randomBytes(16)
    const derivedKey = deriveKey(key, salt)
    
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Formato: salt:iv:authTag:encrypted
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    logger.error('Security', 'Encryption error', error instanceof Error ? error : new Error(String(error)))
    return data
  }
}

/**
 * Desencriptar string usando AES-256-GCM (formato nuevo) o AES-256-CBC (formato antiguo para compatibilidad)
 * Soporta dos formatos:
 * - Nuevo: salt:iv:authTag:encrypted (AES-256-GCM)
 * - Antiguo: encrypted (AES-256-CBC, formato hexadecimal simple)
 */
export function decryptData(encrypted: string, key: string = process.env.ENCRYPTION_KEY || 'default'): string {
  try {
    const parts = encrypted.split(':')
    
    // Formato nuevo: salt:iv:authTag:encrypted (AES-256-GCM)
    if (parts.length === 4) {
      const [saltHex, ivHex, authTagHex, encryptedData] = parts
      const salt = Buffer.from(saltHex, 'hex')
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')
      const derivedKey = deriveKey(key, salt)
      
      const algorithm = 'aes-256-gcm'
      const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv)
      decipher.setAuthTag(authTag)
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    }
    
    // Formato antiguo: simple string hexadecimal (AES-256-CBC)
    // Compatibilidad hacia atrás para datos encriptados con createCipher
    // NOTA: createDecipher está deprecado pero necesario para desencriptar datos antiguos
    if (parts.length === 1 && /^[0-9a-f]+$/i.test(encrypted)) {
      try {
        // createDecipher está deprecado pero necesario para compatibilidad
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - createDecipher deprecated
        const decipher = crypto.createDecipher('aes-256-cbc', key)
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
      } catch (legacyError) {
        // Si falla el formato antiguo, registrar el error y lanzarlo
        logger.warn('Security', 'Legacy decryption failed', {
          error: legacyError instanceof Error ? legacyError.message : String(legacyError),
          encryptedLength: encrypted.length,
        })
        throw legacyError
      }
    }
    
    // Formato no reconocido
    throw new Error(`Invalid encrypted data format: expected 4 colon-separated parts (new format) or hex string (legacy format), got ${parts.length} parts`)
  } catch (error) {
    logger.error('Security', 'Decryption error', error instanceof Error ? error : new Error(String(error)))
    return ''
  }
}

/**
 * Hash SHA256
 */
export function hashSHA256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Generar token aleatorio seguro
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Rate limit helper
 */
export interface RateLimitStore {
  get(key: string): Promise<number | null>
  set(key: string, count: number, ttl: number): Promise<void>
}

export class SimpleRateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map()

  async check(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowSeconds * 1000 })
      return true
    }

    if (entry.count < limit) {
      entry.count++
      return true
    }

    return false
  }

  reset(key: string): void {
    this.store.delete(key)
  }
}

export const rateLimiter = new SimpleRateLimiter()

/**
 * Validar contraseña fuerte
 */
export function isStrongPassword(password: string): {
  strong: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener mayúscula')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener minúscula')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener número')
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Debe contener carácter especial (!@#$%^&*)')
  }

  return {
    strong: errors.length === 0,
    errors,
  }
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
