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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { ArrowLeft, User } from 'lucide-react'
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
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
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
    <div className="space-y-6">
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
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Input
                    label="Nombre del Cliente *"
                    placeholder="Ej: Juan Pérez"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>

                <div>
                  <Input
                    type="email"
                    label="Email"
                    placeholder="cliente@ejemplo.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>

                <div>
                  <Input
                    type="tel"
                    label="Teléfono"
                    placeholder="+52 123 456 7890"
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
                  </Button>
                  <Link href="/dashboard/clients">
                    <Button type="button" variant="outline">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Datos Requeridos
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Solo el nombre es obligatorio. Puedes agregar más información después.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

