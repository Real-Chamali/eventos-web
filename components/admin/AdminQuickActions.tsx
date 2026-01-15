'use client'

import Link from 'next/link'
import { useIsAdmin } from '@/lib/hooks'
import Button from '@/components/ui/Button'
import { Users, Plus } from 'lucide-react'

export default function AdminQuickActions() {
  const { isAdmin, loading } = useIsAdmin()

  if (loading || !isAdmin) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      <Link href="/admin/vendors?new=1">
        <Button variant="premium" size="sm" className="gap-2 shadow-lg">
          <Plus className="h-4 w-4" />
          Nuevo vendedor
        </Button>
      </Link>
      <Link href="/admin/vendors">
        <Button variant="outline" size="sm" className="gap-2 bg-white/90 dark:bg-gray-900/90 shadow">
          <Users className="h-4 w-4" />
          Gestionar vendedores
        </Button>
      </Link>
    </div>
  )
}
