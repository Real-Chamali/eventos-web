import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'

// Este fetcher es específico para obtener los servicios.
// SWR usará la clave 'services' para cachear el resultado de esta función.
const servicesFetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name')

  if (error) {
    logger.error('useServices', 'Error fetching services', error)
    throw error
  }

  return data
}

export function useServices() {
  const { data, error, isLoading, mutate } = useSWR('services', servicesFetcher)

  return {
    services: data ?? [], // Devuelve un array vacío si `data` es undefined durante la carga inicial
    isLoading,
    error,
    mutate, // `mutate` permite refrescar los datos bajo demanda
  }
}
