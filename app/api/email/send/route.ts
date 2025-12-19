import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { sendEmail, EmailOptions } from '@/lib/integrations/email'

/**
 * API Route para envío de emails
 * Integrado con Resend para envío profesional
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { to, subject, html, from, replyTo, attachments } = body

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'to, subject, and html are required' },
        { status: 400 }
      )
    }

    const emailOptions: EmailOptions = {
      to,
      subject,
      html,
      from,
      replyTo,
      attachments,
    }

    const result = await sendEmail(emailOptions)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
    })
  } catch (error) {
    logger.error('API /email/send', 'Error in email send route', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

