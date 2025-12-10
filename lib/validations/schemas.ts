import { z } from 'zod'

// Esquema para login
export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginFormData = z.infer<typeof LoginSchema>

// Esquema para crear cliente
export const CreateClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
})

export type CreateClientFormData = z.infer<typeof CreateClientSchema>

// Esquema para servicio en cotización
export const QuoteServiceSchema = z.object({
  service_id: z.string().uuid('ID de servicio inválido'),
  quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  final_price: z.number().positive('El precio debe ser positivo'),
})

// Esquema para crear cotización
export const CreateQuoteSchema = z.object({
  client_id: z.string().uuid('ID de cliente inválido'),
  services: z.array(QuoteServiceSchema).min(1, 'Debe haber al menos un servicio'),
  total_price: z.number().positive('El total debe ser positivo'),
})

export type CreateQuoteFormData = z.infer<typeof CreateQuoteSchema>

// Esquema para actualizar cotización
export const UpdateQuoteSchema = z.object({
  id: z.string().uuid(),
  services: z.array(QuoteServiceSchema).min(1),
  total_price: z.number().positive(),
})

export type UpdateQuoteFormData = z.infer<typeof UpdateQuoteSchema>

// Esquema para servicio de admin
export const AdminServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  base_price: z.number().positive('El precio base debe ser positivo'),
  cost_price: z.number().nonnegative('El costo no puede ser negativo'),
})

export type AdminServiceFormData = z.infer<typeof AdminServiceSchema>

// Esquema para entrada financiera
export const FinanceEntrySchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  type: z.enum(['income', 'expense']),
  description: z.string().min(3).max(200),
})

export type FinanceEntryFormData = z.infer<typeof FinanceEntrySchema>

// Función helper para validar y obtener errores
export function validateFormData<T>(schema: z.ZodSchema<T>, data: unknown): {
  valid: boolean
  data?: T
  errors?: Record<string, string>
} {
  try {
    const validated = schema.parse(data)
    return { valid: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.issues.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { valid: false, errors }
    }
    return { valid: false, errors: { general: 'Error de validación desconocido' } }
  }
}
