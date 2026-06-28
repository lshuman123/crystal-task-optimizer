// Supabase Edge Function — notify managers when a task is flagged as blocked
// Deploy: supabase functions deploy notify-manager
// Set secret: supabase secrets set RESEND_API_KEY=re_xxxx
// Set secret: supabase secrets set FROM_EMAIL=noreply@yourdom.com

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { taskId, taskTitle, flaggedBy, reason } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: managers } = await supabaseAdmin
      .from('profiles')
      .select('email, name')
      .eq('role', 'manager')

    if (!managers?.length) {
      return new Response(JSON.stringify({ message: 'No managers found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'noreply@crystalrcm.com'
    if (!resendKey) throw new Error('RESEND_API_KEY secret not configured')

    const appUrl = Deno.env.get('APP_URL') ?? ''
    const taskUrl = appUrl ? `${appUrl}/tasks/${taskId}` : ''

    await Promise.all(
      managers.map(mgr =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from:    `Crystal RCM <${fromEmail}>`,
            to:      mgr.email,
            subject: `Task Blocked: ${taskTitle}`,
            html: `
              <p>Hi ${mgr.name},</p>
              <p><strong>${flaggedBy}</strong> has flagged a task as blocked and needs your attention.</p>
              <table style="margin:16px 0;border-collapse:collapse;">
                <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px;">Task</td><td style="font-size:13px;font-weight:600;">${taskTitle}</td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px;">Reason</td><td style="font-size:13px;">${reason}</td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px;">Flagged by</td><td style="font-size:13px;">${flaggedBy}</td></tr>
              </table>
              ${taskUrl ? `<p><a href="${taskUrl}" style="color:#2563eb;">View task →</a></p>` : ''}
              <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Crystal RCM Staffing System</p>
            `,
          }),
        })
      )
    )

    return new Response(JSON.stringify({ success: true, notified: managers.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
