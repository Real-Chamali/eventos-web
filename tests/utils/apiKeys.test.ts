/**
 * Tests para utilidades de API keys
 */

import { hashApiKey, generateApiKey } from '@/lib/api/apiKeys'
import { hashSHA256 } from '@/lib/utils/security'

describe('API Keys utilities', () => {
  describe('hashApiKey', () => {
    it('hashes API key using SHA-256', async () => {
      const apiKey = 'test-api-key-123'
      const hash = await hashApiKey(apiKey)
      const expectedHash = await hashSHA256(apiKey)

      expect(hash).toBe(expectedHash)
      expect(hash).toHaveLength(64) // SHA-256 produces 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]{64}$/i) // Hex string
    })

    it('produces consistent hashes for same input', async () => {
      const apiKey = 'consistent-key'
      const hash1 = await hashApiKey(apiKey)
      const hash2 = await hashApiKey(apiKey)

      expect(hash1).toBe(hash2)
    })

    it('produces different hashes for different inputs', async () => {
      const hash1 = await hashApiKey('key1')
      const hash2 = await hashApiKey('key2')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('generateApiKey', () => {
    it('generates a random API key', () => {
      const apiKey = generateApiKey()

      expect(apiKey).toBeDefined()
      expect(typeof apiKey).toBe('string')
      expect(apiKey.length).toBe(64) // 32 bytes = 64 hex chars
      expect(apiKey).toMatch(/^[a-f0-9]{64}$/i) // Hex string
    })

    it('generates unique keys on each call', () => {
      const key1 = generateApiKey()
      const key2 = generateApiKey()

      expect(key1).not.toBe(key2)
    })

    it('generates keys that can be hashed', async () => {
      const apiKey = generateApiKey()
      const hash = await hashApiKey(apiKey)

      expect(hash).toBeDefined()
      expect(hash.length).toBe(64)
    })
  })
})

