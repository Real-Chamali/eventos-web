import { sanitizeHTML, sanitizeText, generateCSRFToken, validateCSRFToken } from '@/lib/utils/security'

describe('Security Utils', () => {
  describe('sanitizeHTML', () => {
    it('should remove dangerous HTML tags', () => {
      const dirty = '<script>alert("xss")</script><p>Safe content</p>'
      const result = sanitizeHTML(dirty)
      expect(result).not.toContain('<script>')
      expect(result).toContain('Safe content')
    })

    it('should allow safe HTML tags', () => {
      const dirty = '<b>Bold</b> <i>Italic</i> <p>Paragraph</p>'
      const result = sanitizeHTML(dirty)
      expect(result).toContain('<b>')
      expect(result).toContain('<i>')
      expect(result).toContain('<p>')
    })

    it('should handle empty strings', () => {
      expect(sanitizeHTML('')).toBe('')
    })
  })

  describe('sanitizeText', () => {
    it('should remove special characters', () => {
      const text = 'Hello<script>alert("xss")</script>World'
      const result = sanitizeText(text)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).not.toContain('"')
      expect(result).not.toContain('(')
      expect(result).not.toContain(')')
    })

    it('should trim whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello')
    })

    it('should limit length to 500 characters', () => {
      const longText = 'a'.repeat(600)
      const result = sanitizeText(longText)
      expect(result.length).toBe(500)
    })
  })

  describe('generateCSRFToken', () => {
    it('should generate a token', () => {
      const token = generateCSRFToken()
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('validateCSRFToken', () => {
    it('should validate matching tokens', () => {
      const token = generateCSRFToken()
      expect(validateCSRFToken(token, token)).toBe(true)
    })

    it('should reject non-matching tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      expect(validateCSRFToken(token1, token2)).toBe(false)
    })
  })
})

