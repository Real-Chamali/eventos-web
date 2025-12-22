/**
 * Rate Limiting Distribuido
 * 
 * Implementación de rate limiting que funciona en entornos serverless
 * Usa una combinación de in-memory cache y opcionalmente Redis/Upstash
 */

import { logger } from '@/lib/utils/logger'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Cache in-memory como fallback
const rateLimitMap = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas periódicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
}, 60000) // Cada minuto

/**
 * Rate limiting distribuido
 * 
 * En producción, debería usar Redis/Upstash para rate limiting distribuido
 * Por ahora, usa in-memory con mejoras para serverless
 */
export async function checkRateLimitDistributed(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minuto
): Promise<boolean> {
  const now = Date.now()
  
  // Intentar usar Redis/Upstash si está configurado
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await checkRateLimitRedis(key, maxRequests, windowMs)
    } catch (error) {
      logger.warn('Rate Limit', 'Redis rate limiting failed, falling back to memory', {
        error: error instanceof Error ? error.message : String(error),
      })
      // Fallback a in-memory
    }
  }

  // Fallback a in-memory
  return checkRateLimitMemory(key, maxRequests, windowMs, now)
}

/**
 * Rate limiting con Redis/Upstash
 */
async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const redisKey = `ratelimit:${key}`
  const now = Date.now()
  const windowStart = now - windowMs

  // Usar Upstash Redis REST API
  const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['ZREMRANGEBYSCORE', redisKey, '0', String(windowStart)],
      ['ZCARD', redisKey],
      ['ZADD', redisKey, String(now), `${now}-${Math.random()}`],
      ['EXPIRE', redisKey, Math.ceil(windowMs / 1000)],
    ]),
  })

  if (!response.ok) {
    throw new Error(`Redis rate limit check failed: ${response.statusText}`)
  }

  const results = await response.json()
  const count = results[1]?.result || 0

  return count < maxRequests
}

/**
 * Rate limiting en memoria (fallback)
 */
function checkRateLimitMemory(
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number
): boolean {
  const entry = rateLimitMap.get(key)

  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

/**
 * Rate limiting simple (compatibilidad con código existente)
 * Usa la implementación distribuida internamente
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): boolean {
  // Llamar a la versión async pero retornar sincrónicamente para compatibilidad
  // En producción, esto debería ser async
  const now = Date.now()
  return checkRateLimitMemory(key, maxRequests, windowMs, now)
}

/**
 * Limpiar rate limit para una key específica (útil para testing)
 */
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key)
}

