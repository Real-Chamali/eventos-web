'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowLeft, User, Mail, Phone, Sparkles, Info } from 'lucide-react'
import Link from 'next/link'

const ClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
})

type ClientFormData = z.infer<typeof ClientSchema>

export default function NewClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      name: '',
      email: searchParams.get('email') || '',
      phone: '',
    },
  })

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toastError('Usuario no autenticado')
        return
      }

      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      toastSuccess('Cliente creado correctamente')
      router.push(`/dashboard/clients/${client.id}`)
      router.refresh()
    } catch (err) {
      logger.error('NewClientPage', 'Error creating client', err as Error)
      toastError('Error al crear el cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Nuevo Cliente"
        description="Registra un nuevo cliente en el sistema"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clientes', href: '/dashboard/clients' },
          { label: 'Nuevo' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Información del Cliente</CardTitle>
                  <CardDescription className="mt-1">Completa los datos del nuevo cliente</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Nombre del Cliente"
                  placeholder="Ej: Juan Pérez"
                  icon={<User className="h-4 w-4" />}
                  {...register('name')}
                  error={errors.name?.message}
                  description="Nombre completo del cliente (requerido)"
                />

                <Input
                  type="email"
                  label="Email"
                  placeholder="cliente@ejemplo.com"
                  icon={<Mail className="h-4 w-4" />}
                  {...register('email')}
                  error={errors.email?.message}
                  description="Correo electrónico del cliente (opcional)"
                />

                <Input
                  type="tel"
                  label="Teléfono"
                  placeholder="+52 123 456 7890"
                  icon={<Phone className="h-4 w-4" />}
                  {...register('phone')}
                  error={errors.phone?.message}
                  description="Número de teléfono del cliente (opcional)"
                />

                <div className="flex gap-3 pt-4">
                  <Link href="/dashboard/clients" className="flex-1">
                    <Button type="button" variant="outline" className="w-full gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" variant="premium" size="lg" disabled={isSubmitting} isLoading={isSubmitting} className="flex-1 gap-2 shadow-lg hover:shadow-xl">
                    <Sparkles className="h-5 w-5" />
                    Guardar Cliente
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Información</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
                  <Info className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center flex-shrink-0">
                  <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">
                    Datos Requeridos
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Solo el nombre es obligatorio. Puedes agregar más información después.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  El cliente será asignado automáticamente a tu cuenta y podrás crear cotizaciones para él.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
