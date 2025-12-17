import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import SecuritySettings from '@/components/security/SecuritySettings'
import UserPreferences from '@/components/settings/UserPreferences'
import { Card, CardContent } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Shield, Settings as SettingsIcon } from 'lucide-react'

export default async function SettingsPage() {
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
        title="Configuración"
        description="Gestiona tus preferencias y configuración de seguridad"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Configuración' },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="preferences" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none">
              <TabsTrigger value="preferences" className="flex items-center space-x-2">
                <SettingsIcon className="h-4 w-4" />
                <span>Preferencias</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Seguridad</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preferences" className="p-6">
              <UserPreferences />
            </TabsContent>
            <TabsContent value="security" className="p-6">
              <SecuritySettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

