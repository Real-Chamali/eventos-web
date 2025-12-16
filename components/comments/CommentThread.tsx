'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/lib/hooks'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Send, AtSign, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils/cn'

interface Comment {
  id: string
  content: string
  user_id: string
  created_at: string
  mentions?: string[]
  user?: {
    email: string
  }
}

interface CommentThreadProps {
  entityType: 'quote' | 'event' | 'client'
  entityId: string
}

export default function CommentThread({ entityType, entityId }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    loadComments()

    // Suscribirse a nuevos comentarios en tiempo real
    const channel = supabase
      .channel(`comments-${entityType}-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `entity_type=eq.${entityType} AND entity_id=eq.${entityId}`,
        },
        () => {
          loadComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:profiles(email)')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error loading comments:', error)
      toastError('Error al cargar comentarios')
    } finally {
      setLoading(false)
    }
  }

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const matches = text.match(mentionRegex)
    return matches ? matches.map((m) => m.substring(1)) : []
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setSubmitting(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toastError('Debes estar autenticado')
        return
      }

      const mentions = extractMentions(newComment)

      const { error } = await supabase.from('comments').insert({
        entity_type: entityType,
        entity_id: entityId,
        user_id: user.id,
        content: newComment,
        mentions: mentions.length > 0 ? mentions : null,
      })

      if (error) throw error

      setNewComment('')
      toastSuccess('Comentario agregado')
      loadComments()
    } catch (error) {
      console.error('Error submitting comment:', error)
      toastError('Error al agregar comentario')
    } finally {
      setSubmitting(false)
    }
  }

  const formatMentionedText = (text: string, mentions?: string[]) => {
    if (!mentions || mentions.length === 0) return text

    let formatted = text
    mentions.forEach((mention) => {
      const regex = new RegExp(`@${mention}`, 'g')
      formatted = formatted.replace(regex, `<span class="font-semibold text-blue-600 dark:text-blue-400">@${mention}</span>`)
    })
    return formatted
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AtSign className="h-5 w-5" />
          <span>Comentarios</span>
          {comments.length > 0 && (
            <Badge variant="info">{comments.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando comentarios...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AtSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay comentarios aún</p>
              <p className="text-sm mt-1">Sé el primero en comentar</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.user?.email?.split('@')[0] || 'Usuario'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(comment.created_at), "dd MMM 'a las' HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p
                    className="text-sm text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{
                      __html: formatMentionedText(comment.content, comment.mentions),
                    }}
                  />
                  {comment.mentions && comment.mentions.length > 0 && (
                    <div className="flex items-center space-x-1 mt-2">
                      <AtSign className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Mencionado: {comment.mentions.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario... Usa @usuario para mencionar"
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Presiona @ para mencionar usuarios
            </p>
            <Button type="submit" disabled={!newComment.trim() || submitting} size="sm">
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

