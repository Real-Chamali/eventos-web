/**
 * Utilidades para optimizar queries de Supabase
 * Incluye helpers para usar índices correctamente y evitar queries innecesarias
 */

/**
 * Optimizar query para usar índices de fecha
 * Asegura que las queries de fecha usen los índices correctos
 */
export function optimizeDateQuery(
  query: any,
  dateField: string,
  startDate?: Date,
  endDate?: Date
): any {
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
export function optimizeVendorQuery(
  query: any,
  vendorId: string,
  orderBy: string = 'created_at'
): any {
  query = query.eq('vendor_id', vendorId)
  // Usar índice compuesto vendor_id + created_at
  query = query.order(orderBy, { ascending: false })
  return query
}

/**
 * Limitar campos seleccionados para reducir transferencia de datos
 * Solo selecciona los campos necesarios
 */
export function selectOnlyNeededFields(
  query: any,
  fields: string[]
): any {
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

