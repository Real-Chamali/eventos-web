import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-8 text-center text-red-600">Usuario no autenticado</div>
  }

  // Obtener mis ventas (cotizaciones confirmadas)
  const { data: sales } = await supabase
    .from('quotes')
    .select('total_price')
    .eq('vendor_id', user.id)
    .eq('status', 'confirmed')

  const totalSales = sales?.reduce((acc, sale) => acc + (sale.total_price || 0), 0) || 0

  // Calcular comisiones (asumiendo 10% de comisión)
  const commissionRate = 0.1
  const totalCommissions = totalSales * commissionRate

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mis Ventas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Comisiones</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${totalCommissions.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-4xl">💵</div>
          </div>
        </div>
      </div>
    </div>
  )
}


