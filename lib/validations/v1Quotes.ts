import { z } from 'zod'

/**
 * Schema de validación para crear cotización v1
 * Incluye todas las validaciones de seguridad y negocio
 */
export const CreateQuoteV1Schema = z.object({
  client_id: z.string().uuid('client_id must be a valid UUID'),
  services: z.array(
    z.object({
      service_id: z.string().uuid('service_id must be a valid UUID'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1').max(1000, 'Quantity cannot exceed 1000'),
      price: z.number().positive('Price must be positive').optional(), // Solo si se permite override
    })
  ).min(1, 'At least one service is required').max(50, 'Cannot exceed 50 services per quote'),
  notes: z.string().max(5000, 'Notes cannot exceed 5000 characters').optional(),
})

export type CreateQuoteV1Data = z.infer<typeof CreateQuoteV1Schema>

/**
 * Schema para validar parámetros de paginación
 */
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(['DRAFT', 'APPROVED', 'REJECTED', 'confirmed', 'draft']).optional(),
})

export type PaginationData = z.infer<typeof PaginationSchema>

