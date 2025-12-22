/**
 * Helper functions for creating notifications
 */

import { createAdminClient } from '@/utils/supabase/admin'
import { logger } from '@/lib/utils/logger'

export type NotificationType = 'quote' | 'event' | 'payment' | 'reminder' | 'system'

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, unknown>
}

/**
 * Create a notification for a user
 * Uses admin client to bypass RLS
 */
export async function createNotification(params: CreateNotificationParams): Promise<string | null> {
  try {
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin.rpc('create_notification', {
      p_user_id: params.userId,
      p_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_metadata: params.metadata || {},
    })

    if (error) {
      logger.error('Notifications', 'Error creating notification', error as Error, {
        userId: params.userId,
        type: params.type,
      })
      return null
    }

    logger.debug('Notifications', 'Notification created successfully', {
      notificationId: data,
      userId: params.userId,
      type: params.type,
    })

    return data
  } catch (error) {
    logger.error('Notifications', 'Unexpected error creating notification', error as Error, {
      userId: params.userId,
      type: params.type,
    })
    return null
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationsForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<void> {
  const promises = userIds.map((userId) =>
    createNotification({
      ...params,
      userId,
    })
  )

  await Promise.allSettled(promises)
}

