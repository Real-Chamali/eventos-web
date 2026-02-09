'use client'

import useSWR from 'swr'
import { logger } from '@/lib/utils/logger'
import { CardSkeleton } from '@/components/Skeleton'

// Tipos de datos para el reporte
interface VendorReport {
  vendor_id: string;
  vendor_email: string;
  total_quotes: number;
  confirmed_quotes: number;
  total_sales: number;
  conversion_rate: number | null;
}

// Fetcher para SWR que llama a nuestra API de reportes
const reportsFetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const errorData = await response.json()
    logger.error('reportsFetcher', `Failed to fetch reports: ${errorData.error}`)
    throw new Error(errorData.error || 'Error al cargar los reportes')
  }
  return response.json()
}

export default function AdminReportsPage() {
  const { data: reports, error, isLoading } = useSWR<VendorReport[]>('/api/reports/vendors', reportsFetcher)

  if (isLoading) {
    return (
      <div className="p-8 bg-white dark:bg-gray-900 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Reportes de Rendimiento</h1>
        <CardSkeleton count={4} />
      </div>
    )
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error al cargar los reportes: {error.message}</div>
  }

  if (!reports) {
    return <div className="p-8 text-center text-gray-500">No hay datos de reportes disponibles.</div>
  }

  // Cálculos agregados para las tarjetas de resumen
  const totalSales = reports.reduce((sum, r) => sum + r.total_sales, 0)
  const totalConfirmedQuotes = reports.reduce((sum, r) => sum + r.confirmed_quotes, 0)
  const bestVendor = reports[0] // La API ya los ordena por ventas

  return (
    <div className="p-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Reportes de Rendimiento de Vendedores</h1>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ventas Totales</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">${totalSales.toLocaleString('es-MX')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ventas Confirmadas</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalConfirmedQuotes}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mejor Vendedor</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2 truncate">{bestVendor?.vendor_email || 'N/A'}</p>
          <p className="text-sm text-green-500">${(bestVendor?.total_sales || 0).toLocaleString('es-MX')}</p>
        </div>
      </div>

      {/* Tabla de Desglose por Vendedor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ventas Totales</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cotizaciones Confirmadas</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tasa de Conversión</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map(vendor => (
                <tr key={vendor.vendor_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{vendor.vendor_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">${vendor.total_sales.toLocaleString('es-MX')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">{vendor.confirmed_quotes} / {vendor.total_quotes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vendor.conversion_rate && vendor.conversion_rate > 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {vendor.conversion_rate ? `${vendor.conversion_rate.toFixed(1)}%` : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
