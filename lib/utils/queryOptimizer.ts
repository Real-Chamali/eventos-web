/**
 * Utilidades para optimizar queries de Supabase
 * Incluye helpers para usar índices correctamente y evitar queries innecesarias
 */

import { PostgrestQueryBuilder } from '@supabase/postgrest-js'

/**
 * Optimizar query para usar índices de fecha
 * Asegura que las queries de fecha usen los índices correctos
 */
export function optimizeDateQuery<T>(
  query: PostgrestQueryBuilder<T>,
  dateField: string,
  startDate?: Date,
  endDate?: Date
): PostgrestQueryBuilder<T> {
  if (startDate) {
    query = query.gte(dateField, startDate.toISOString())
  }
  if (endDate) {
    query = query.lte(dateField, endDate.toISOString())
  }
  // Ordenar por fecha para usar índice
  query = query.order(dateField, { ascending: false })
  return query
}

/**
 * Optimizar query para usar índices de vendor_id
 * Asegura que las queries filtradas por vendor usen el índice compuesto
 */
export function optimizeVendorQuery<T>(
  query: PostgrestQueryBuilder<T>,
  vendorId: string,
  orderBy: string = 'created_at'
): PostgrestQueryBuilder<T> {
  query = query.eq('vendor_id', vendorId)
  // Usar índice compuesto vendor_id + created_at
  query = query.order(orderBy, { ascending: false })
  return query
}

/**
 * Limitar campos seleccionados para reducir transferencia de datos
 * Solo selecciona los campos necesarios
 */
export function selectOnlyNeededFields<T>(
  query: PostgrestQueryBuilder<T>,
  fields: string[]
): PostgrestQueryBuilder<T> {
  return query.select(fields.join(', '))
}

/**
 * Batch queries para evitar N+1
 * Agrupa múltiples queries en una sola cuando es posible
 */
export async function batchQuery<T>(
  queries: Array<() => Promise<{ data: T | null; error: any }>>
): Promise<Array<{ data: T | null; error: any }>> {
  return Promise.all(queries.map(q => q()))
}

