'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { logger } from '@/lib/utils/logger'
import { TableSkeleton } from '@/components/Skeleton'

// Tipos de datos para nuestros registros de auditoría
interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  table_name: string;
  record_id: string;
  ip_address: string;
  user: {
    id: string;
    email: string;
  } | null;
}

// El fetcher que usará SWR para obtener los datos de nuestra API
const auditLogFetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Error al cargar los datos de auditoría')
  }
  return response.json()
}

export default function AdminAuditPage() {
  const [page, setPage] = useState(1)
  const { data, error, isLoading } = useSWR(`/api/audit?page=${page}`, auditLogFetcher, {
    keepPreviousData: true, // Mantiene los datos anteriores visibles mientras se cargan los nuevos
  })

  // Loguear el error si ocurre
  useEffect(() => {
    if (error) {
      logger.error('AdminAuditPage', 'Error al cargar los logs con SWR', error)
    }
  }, [error])

  const logs: AuditLog[] = data?.logs || []
  const totalPages: number = data?.totalPages || 1

  return (
    <div className="p-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Panel de Auditoría</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha y Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Objeto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID del Registro</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading && !data ? (
                <TableSkeleton rows={10} columns={5} />
              ) : error ? (
                <tr><td colSpan={5} className="text-center py-8 text-red-500">{error.message}</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(log.created_at).toLocaleString('es-MX')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{log.user?.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{log.action}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.table_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{log.record_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Anterior</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div><p className="text-sm text-gray-700 dark:text-gray-400">Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span></p></div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Anterior</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Siguiente</button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
