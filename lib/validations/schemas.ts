import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const CreateQuoteServiceSchema = z.object({
  service_id: z.string().uuid('ID de servicio inválido'),
  quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
  final_price: z.number().nonnegative('El precio no puede ser negativo'),
})

export const CreateQuoteSchema = z.object({
  client_id: z.string().uuid('ID de cliente inválido'),
  services: z.array(CreateQuoteServiceSchema).min(1, 'Debe haber al menos un servicio'),
  total_price: z.number().nonnegative('El precio total no puede ser negativo'),
  event_date: z.string().optional(), // AÑADIDO: Fecha del evento opcional
})

export const UpdateServiceSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  base_price: z.number().nonnegative(),
  cost_price: z.number().nonnegative(),
})
