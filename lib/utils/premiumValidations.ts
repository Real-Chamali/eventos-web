/**
 * Validaciones Premium con mensajes mejorados y feedback visual
 */

import { z } from 'zod'

/**
 * Mensajes de error personalizados y descriptivos
 */
export const premiumErrorMessages = {
  required: (field: string) => `${field} es requerido`,
  invalid: (field: string) => `${field} no es válido`,
  min: (field: string, min: number) => `${field} debe tener al menos ${min} caracteres`,
  max: (field: string, max: number) => `${field} no puede exceder ${max} caracteres`,
  email: (field: string) => `${field} debe ser un email válido`,
  phone: (field: string) => `${field} debe ser un número de teléfono válido`,
  positive: (field: string) => `${field} debe ser mayor a 0`,
  date: (field: string) => `${field} debe ser una fecha válida`,
  future: (field: string) => `${field} debe ser una fecha futura`,
  past: (field: string) => `${field} debe ser una fecha pasada`,
}

/**
 * Schema de validación premium para emails
 */
export const premiumEmailSchema = z
  .string()
  .min(1, premiumErrorMessages.required('Email'))
  .email(premiumErrorMessages.email('Email'))
  .toLowerCase()
  .trim()

/**
 * Schema de validación premium para teléfonos
 */
export const premiumPhoneSchema = z
  .string()
  .min(1, premiumErrorMessages.required('Teléfono'))
  .regex(/^[\d\s\-\+\(\)]+$/, premiumErrorMessages.phone('Teléfono'))
  .min(10, premiumErrorMessages.min('Teléfono', 10))
  .max(20, premiumErrorMessages.max('Teléfono', 20))

/**
 * Schema de validación premium para nombres
 */
export const premiumNameSchema = z
  .string()
  .min(1, premiumErrorMessages.required('Nombre'))
  .min(2, premiumErrorMessages.min('Nombre', 2))
  .max(100, premiumErrorMessages.max('Nombre', 100))
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')

/**
 * Schema de validación premium para montos
 */
export const premiumAmountSchema = z
  .number()
  .positive(premiumErrorMessages.positive('Monto'))
  .min(0.01, 'El monto mínimo es $0.01')
  .max(999999999.99, 'El monto máximo es $999,999,999.99')

/**
 * Schema de validación premium para fechas
 */
export const premiumDateSchema = z
  .string()
  .min(1, premiumErrorMessages.required('Fecha'))
  .refine(
    (date) => !isNaN(Date.parse(date)),
    premiumErrorMessages.date('Fecha')
  )

/**
 * Schema de validación premium para fechas futuras
 */
export const premiumFutureDateSchema = premiumDateSchema.refine(
  (date) => new Date(date) > new Date(),
  premiumErrorMessages.future('Fecha')
)

/**
 * Formatear errores de Zod para mostrar al usuario
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}
  
  error.issues.forEach((err) => {
    const path = err.path.join('.')
    formatted[path] = err.message
  })
  
  return formatted
}

/**
 * Validar y sanitizar input en tiempo real
 */
export function validateInput(value: string, schema: z.ZodString): {
  isValid: boolean
  error?: string
  sanitized?: string
} {
  try {
    const sanitized = schema.parse(value.trim())
    return { isValid: true, sanitized }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'Valor inválido',
      }
    }
    return { isValid: false, error: 'Error de validación' }
  }
}

/**
 * Validar formato de email con regex mejorado
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Validar formato de teléfono mexicano
 */
export function isValidMexicanPhone(phone: string): boolean {
  // Acepta formatos: +52, 52, o sin código de país
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  const mexicanRegex = /^(\+?52)?[1-9]\d{9}$/
  return mexicanRegex.test(cleaned)
}

/**
 * Normalizar teléfono a formato estándar
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  if (cleaned.startsWith('+52')) {
    return cleaned
  } else if (cleaned.startsWith('52')) {
    return '+' + cleaned
  } else if (cleaned.length === 10) {
    return '+52' + cleaned
  }
  
  return cleaned
}
