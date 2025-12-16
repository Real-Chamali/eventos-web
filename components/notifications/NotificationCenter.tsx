'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, X, Check, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { logger } from '@/lib/utils/logger'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface Notification {
  id: string
  type: 'quote' | 'event' | 'payment' | 'reminder' | 'system'
  title: string
  message: string
  read: boolean
  created_at: string
  metadata?: {
    quote_id?: string
    event_id?: string
    link?: string
  }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
    
    // Suscribirse a nuevas notificaciones en tiempo real
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        logger.debug('NotificationCenter', 'No user found, skipping notifications load')
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        // Manejar errores específicos de Supabase
        if (error.code === 'PGRST106' || error.message?.includes('schema')) {
          // Tabla no existe o no es accesible - no es un error crítico
          logger.warn('NotificationCenter', 'Notifications table not accessible (schema error)', {
            errorCode: error.code,
            errorMessage: error.message,
            userId: user.id,
          })
          setNotifications([])
          setUnreadCount(0)
          return
        }
        
        // Otros errores
        throw error
      }

      setNotifications(data || [])
      setUnreadCount(data?.filter((n) => !n.read).length || 0)
      
      logger.debug('NotificationCenter', 'Notifications loaded successfully', {
        count: data?.length || 0,
        unreadCount: data?.filter((n) => !n.read).length || 0,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorCode = (error as any)?.code || 'UNKNOWN'
      
      logger.error('NotificationCenter', 'Error loading notifications', error instanceof Error ? error : new Error(errorMessage), {
        errorCode,
        errorMessage,
      })
      
      // No mostrar error al usuario si es un problema de esquema (tabla no existe)
      // Solo loguear para debugging
      if (errorCode !== 'PGRST106' && !errorMessage.includes('schema')) {
        // Si es otro tipo de error, podríamos mostrar un toast, pero por ahora solo logueamos
        logger.warn('NotificationCenter', 'Failed to load notifications, will retry silently')
      }
      
      // Asegurar que el estado esté limpio
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) {
        // Si es error de esquema, solo loguear y actualizar UI localmente
        if (error.code === 'PGRST106' || error.message?.includes('schema')) {
          logger.warn('NotificationCenter', 'Cannot mark notification as read (schema error)', {
            notificationId: id,
            errorCode: error.code,
          })
          // Actualizar UI localmente aunque falle en el servidor
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
          setUnreadCount((prev) => Math.max(0, prev - 1))
          return
        }
        throw error
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      logger.error('NotificationCenter', 'Error marking notification as read', error instanceof Error ? error : new Error(String(error)), {
        notificationId: id,
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        // Si es error de esquema, solo loguear y actualizar UI localmente
        if (error.code === 'PGRST106' || error.message?.includes('schema')) {
          logger.warn('NotificationCenter', 'Cannot mark all as read (schema error)', {
            userId: user.id,
            errorCode: error.code,
          })
          // Actualizar UI localmente aunque falle en el servidor
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          setUnreadCount(0)
          return
        }
        throw error
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      logger.error('NotificationCenter', 'Error marking all as read', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'quote':
        return '📄'
      case 'event':
        return '📅'
      case 'payment':
        return '💰'
      case 'reminder':
        return '⏰'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'quote':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      case 'event':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'payment':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'reminder':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                No hay notificaciones
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Te notificaremos cuando haya actividad
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'relative px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer',
                    !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10',
                    getNotificationColor(notification.type)
                  )}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                    if (notification.metadata?.link) {
                      window.location.href = notification.metadata.link
                    }
                    setOpen(false)
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            notification.read
                              ? 'text-gray-600 dark:text-gray-400'
                              : 'text-gray-900 dark:text-white font-semibold'
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="ml-2 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {format(new Date(notification.created_at), "dd MMM 'a las' HH:mm", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                      className="flex-shrink-0 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {notification.read ? (
                        <Check className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-2">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Ver todas las notificaciones
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

