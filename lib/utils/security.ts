/**
 * Utilidades de seguridad
 * Sanitización, encriptación, y protección contra ataques comunes
 * 
 * Usa Web Crypto API para compatibilidad con Edge Runtime
 */

import DOMPurify from 'isomorphic-dompurify'
import { logger } from '@/lib/utils/logger'

// Web Crypto API está disponible globalmente en Node.js 15+ y Edge Runtime
// No importar crypto de Node.js - usar Web Crypto API global
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - crypto está disponible globalmente pero TypeScript puede no reconocerlo
const webCrypto: Crypto = (typeof globalThis !== 'undefined' && globalThis.crypto && 'subtle' in globalThis.crypto)
  ? globalThis.crypto
  : (typeof crypto !== 'undefined' && 'subtle' in crypto)
  ? crypto
  : (() => {
      throw new Error('Web Crypto API not available')
    })()

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
 * Usa Web Crypto API para compatibilidad con Edge Runtime
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  webCrypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validar CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken
}

/**
 * Genera una clave segura a partir de una contraseña usando PBKDF2
 * Usa Web Crypto API para compatibilidad con Edge Runtime
 * 
 * @param password - Contraseña base para derivar la clave
 * @param salt - Salt aleatorio (Uint8Array) para evitar rainbow tables
 * @returns Uint8Array con la clave derivada de 32 bytes (256 bits)
 * 
 * @example
 * ```ts
 * const salt = new Uint8Array(16)
 * crypto.getRandomValues(salt)
 * const key = await deriveKey('myPassword', salt)
 * ```
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  // Convertir password a ArrayBuffer
  const encoder = new TextEncoder()
  const passwordKey = await webCrypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  // Derivar clave usando PBKDF2
  const derivedKey = await webCrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  
  return derivedKey
}

/**
 * Encripta un string usando AES-256-GCM
 * Usa Web Crypto API para compatibilidad con Edge Runtime
 * 
 * @param data - Datos a encriptar
 * @param key - Clave de encriptación (default: ENCRYPTION_KEY env var)
 * @returns String encriptado en formato: salt:iv:encrypted (base64)
 * 
 * @example
 * ```ts
 * const encrypted = await encryptData('datos sensibles', 'mi-clave-secreta')
 * // Resultado: "abc123...:def456...:encrypted_data_base64..."
 * ```
 */
export async function encryptData(data: string, key?: string): Promise<string> {
  const encryptionKey = key || (typeof process !== 'undefined' && process.env?.ENCRYPTION_KEY) || 'default'
  try {
    // Generar salt e IV aleatorios
    const salt = new Uint8Array(16)
    const iv = new Uint8Array(12) // 12 bytes para AES-GCM
    webCrypto.getRandomValues(salt)
    webCrypto.getRandomValues(iv)
    
    // Derivar clave
    const derivedKey = await deriveKey(encryptionKey, salt)
    
    // Convertir datos a ArrayBuffer
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    
    // Encriptar usando AES-GCM
    const encrypted = await webCrypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      derivedKey,
      dataBuffer
    )
    
    // Convertir a base64 para almacenamiento
    const encryptedArray = new Uint8Array(encrypted)
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))
    
    // Convertir salt e IV a hex para compatibilidad con formato anterior
    const saltHex = Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join('')
    const ivHex = Array.from(iv, byte => byte.toString(16).padStart(2, '0')).join('')
    
    // Formato: salt:iv:encrypted (base64)
    // Nota: En formato nuevo no incluimos authTag por separado ya que AES-GCM lo incluye en el ciphertext
    return `${saltHex}:${ivHex}:${encryptedBase64}`
  } catch (error) {
    logger.error('Security', 'Encryption error', error instanceof Error ? error : new Error(String(error)))
    return data
  }
}

/**
 * Desencriptar string usando AES-256-GCM (Web Crypto API)
 * Soporta múltiples formatos para compatibilidad:
 * - Formato nuevo (Web Crypto): salt:iv:encrypted (base64)
 * - Formato intermedio (Node.js crypto): salt:iv:authTag:encrypted (hex)
 * - Formato antiguo (legacy): encrypted (hex, AES-256-CBC) - requiere Node.js crypto
 * 
 * @param encrypted - String encriptado
 * @param key - Clave de encriptación (default: ENCRYPTION_KEY env var)
 * @returns String desencriptado
 */
export async function decryptData(encrypted: string, key?: string): Promise<string> {
  const encryptionKey = key || (typeof process !== 'undefined' && process.env?.ENCRYPTION_KEY) || 'default'
  try {
    const parts = encrypted.split(':')
    
    // Formato nuevo (Web Crypto API): salt:iv:encrypted (base64)
    if (parts.length === 3) {
      const [saltHex, ivHex, encryptedBase64] = parts
      
      // Convertir hex a Uint8Array
      const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
      const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
      
      // Convertir base64 a ArrayBuffer
      const encryptedArray = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))
      
      // Derivar clave
      const derivedKey = await deriveKey(encryptionKey, salt)
      
      // Desencriptar
      const decrypted = await webCrypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        derivedKey,
        encryptedArray
      )
      
      // Convertir a string
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    }
    
    // Formato intermedio (Node.js crypto legacy): salt:iv:authTag:encrypted (hex)
    // Intentar desencriptar con Node.js crypto si está disponible (para compatibilidad)
    if (parts.length === 4) {
      try {
        // Solo intentar si estamos en Node.js (no en Edge Runtime)
        if (typeof process !== 'undefined' && process.versions?.node) {
          const nodeCrypto = await import('crypto')
          const [saltHex, ivHex, authTagHex, encryptedData] = parts
          const salt = Buffer.from(saltHex, 'hex')
          const iv = Buffer.from(ivHex, 'hex')
          const authTag = Buffer.from(authTagHex, 'hex')
          
          // Usar PBKDF2 de Node.js para compatibilidad
          const derivedKey = nodeCrypto.default.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256')
          
          const decipher = nodeCrypto.default.createDecipheriv('aes-256-gcm', derivedKey, iv)
          decipher.setAuthTag(authTag)
          
          let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
          decrypted += decipher.final('utf8')
          
          return decrypted
        } else {
          throw new Error('Legacy format requires Node.js runtime')
        }
      } catch (legacyError) {
        logger.warn('Security', 'Legacy decryption failed (Node.js format)', {
          error: legacyError instanceof Error ? legacyError.message : String(legacyError),
        })
        throw legacyError
      }
    }
    
    // Formato antiguo (muy legacy): simple string hexadecimal (AES-256-CBC)
    // Solo funciona en Node.js runtime
    if (parts.length === 1 && /^[0-9a-f]+$/i.test(encrypted)) {
      try {
        if (typeof process !== 'undefined' && process.versions?.node) {
          const nodeCrypto = await import('crypto')
          // createDecipher está deprecado pero necesario para compatibilidad
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - createDecipher deprecated
          const decipher = nodeCrypto.default.createDecipher('aes-256-cbc', encryptionKey)
          let decrypted = decipher.update(encrypted, 'hex', 'utf8')
          decrypted += decipher.final('utf8')
          return decrypted
        } else {
          throw new Error('Very legacy format requires Node.js runtime')
        }
      } catch (legacyError) {
        logger.warn('Security', 'Very legacy decryption failed', {
          error: legacyError instanceof Error ? legacyError.message : String(legacyError),
          encryptedLength: encrypted.length,
        })
        throw legacyError
      }
    }
    
    // Formato no reconocido
    throw new Error(`Invalid encrypted data format: expected 3 parts (Web Crypto), 4 parts (Node.js legacy), or hex string (very legacy), got ${parts.length} parts`)
  } catch (error) {
    logger.error('Security', 'Decryption error', error instanceof Error ? error : new Error(String(error)))
    return ''
  }
}

/**
 * Hash SHA256
 * Usa Web Crypto API para compatibilidad con Edge Runtime
 */
export async function hashSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await webCrypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = new Uint8Array(hashBuffer)
  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Generar token aleatorio seguro
 * Usa Web Crypto API para compatibilidad con Edge Runtime
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  webCrypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
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

/**
 * Sanitizar string para uso en emails (escapar HTML)
 * Previene XSS en templates de email
 */
export function sanitizeForEmail(input: string | number): string {
  const str = String(input)
  // Escapar HTML
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitizar datos para logging (remover información sensible)
 */
export function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'api_key', 'secret', 'key', 'authorization', 'cookie']
  const sanitized: Record<string, unknown> = {}
  
  for (const key in data) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      sanitized[key] = sanitizeForLogging(data[key] as Record<string, unknown>)
    } else {
      sanitized[key] = data[key]
    }
  }
  
  return sanitized
}
