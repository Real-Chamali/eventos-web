import Badge from './Badge'
import { Shield, User } from 'lucide-react'

interface RoleBadgeProps {
  role: 'admin' | 'vendor'
  showIcon?: boolean
}

export default function RoleBadge({ role, showIcon = false }: RoleBadgeProps) {
  const isAdmin = role === 'admin'
  
  return (
    <Badge
      variant={isAdmin ? 'info' : 'default'}
      className="flex items-center space-x-1"
    >
      {showIcon && (
        isAdmin ? (
          <Shield className="h-3 w-3" />
        ) : (
          <User className="h-3 w-3" />
        )
      )}
      <span>{isAdmin ? 'Administrador' : 'Vendedor'}</span>
    </Badge>
  )
}

