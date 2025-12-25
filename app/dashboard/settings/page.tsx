import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'
import SecuritySettings from '@/components/security/SecuritySettings'
import UserPreferences from '@/components/settings/UserPreferences'
import { Card, CardContent } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Shield, Settings as SettingsIcon } from 'lucide-react'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Configuración',
  description: 'Gestiona tus preferencias y configuración de seguridad',
  path: '/dashboard/settings',
  noIndex: true, // Settings no debe ser indexado
})

export default async function SettingsPage() {
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
            Configuración
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Gestiona tus preferencias y configuración de seguridad
          </p>
        </div>
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
          <SettingsIcon className="h-7 w-7 text-white" />
        </div>
      </div>

      {/* Premium Settings Card */}
      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="preferences" className="w-full">
            <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 px-6">
              <TabsList className="w-full justify-start border-0 bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="preferences" 
                  className="flex items-center gap-2 px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 dark:data-[state=active]:border-indigo-400 data-[state=active]:bg-transparent transition-all duration-200"
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span className="font-medium">Preferencias</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="flex items-center gap-2 px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 dark:data-[state=active]:border-indigo-400 data-[state=active]:bg-transparent transition-all duration-200"
                >
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Seguridad</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="preferences" className="p-8">
              <UserPreferences />
            </TabsContent>
            <TabsContent value="security" className="p-8">
              <SecuritySettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

