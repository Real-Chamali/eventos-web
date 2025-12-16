import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import AdvancedAnalytics from '@/components/analytics/AdvancedAnalytics'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Avanzado"
        description="Métricas detalladas, tendencias y análisis de rendimiento"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics' },
        ]}
      />
      <AdvancedAnalytics />
    </div>
  )
}

