import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'
import AdvancedAnalytics from '@/components/analytics/AdvancedAnalytics'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Analytics',
  description: 'Métricas detalladas, tendencias y análisis de rendimiento de tu negocio',
  path: '/dashboard/analytics',
  keywords: ['analytics', 'métricas', 'estadísticas', 'análisis'],
  noIndex: true, // Analytics generalmente no debe ser indexado
})

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Analytics Avanzado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Métricas detalladas, tendencias y análisis de rendimiento
          </p>
        </div>
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      {/* Analytics Content */}
      <AdvancedAnalytics />
    </div>
  )
}

