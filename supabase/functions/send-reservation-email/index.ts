// Supabase Edge Function — Vonamed
// Envia emails de notificação quando reservas são criadas ou actualizadas
//
// Deploy:
//   supabase functions deploy send-reservation-email --no-verify-jwt
//
// Secrets necessários (configurar no Supabase Dashboard):
//   RESEND_API_KEY    = re_xxx (https://resend.com/api-keys)
//   FROM_EMAIL        = "Vonamed <onboarding@resend.dev>" (ou domínio próprio verificado)
//   APP_URL           = https://farma-pds.vercel.app
//
// Trigger: Database Webhook na tabela `reservations`
//   - Events: Insert, Update
//   - HTTP method: POST
//   - URL: https://<PROJECT>.supabase.co/functions/v1/send-reservation-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Vonamed <onboarding@resend.dev>'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://farma-pds.vercel.app'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function sendEmail(to: string, subject: string, html: string) {
  if (!to || !RESEND_API_KEY) {
    console.log('[skip] sendEmail to:', to, 'hasKey:', !!RESEND_API_KEY)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  })
  if (!res.ok) {
    console.error('Resend error:', res.status, await res.text())
  }
}

interface TemplateOpts {
  title: string
  body: string
  buttonText?: string
  buttonUrl?: string
  color?: string
}

function template({ title, body, buttonText, buttonUrl, color = '#059669' }: TemplateOpts) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0f172a;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:40px 20px;background:#f8fafc;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
<tr><td style="background:linear-gradient(135deg,${color},#047857);padding:32px;text-align:center;">
<div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Vona<span style="color:#a7f3d0;">med</span></div>
<div style="font-size:11px;color:#d1fae5;margin-top:6px;letter-spacing:1px;">FARMÁCIAS DE MAPUTO</div>
</td></tr>
<tr><td style="padding:36px 32px;">
<h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;font-weight:700;">${title}</h1>
<div style="font-size:15px;line-height:1.7;color:#475569;">${body}</div>
${buttonUrl ? `<div style="margin-top:28px;"><a href="${buttonUrl}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:14px;">${buttonText}</a></div>` : ''}
</td></tr>
<tr><td style="padding:20px 32px;background:#f8fafc;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">
Vonamed — Plataforma de farmácias de Maputo<br>
Esta é uma mensagem automática. Não responda a este email.
</td></tr>
</table></td></tr></table></body></html>`
}

interface Reservation {
  id: string
  user_id: string
  pharmacy_id: number
  medicine_name: string
  pharmacy_name: string
  pharmacy_address: string
  price: number
  status: string
  created_at: string
}

async function getContext(r: Reservation) {
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('contact_email, name')
    .eq('id', r.pharmacy_id)
    .single()

  const { data: userResp } = await supabase.auth.admin.getUserById(r.user_id)
  const user = userResp?.user
  const clientEmail = user?.email ?? ''
  const clientName = (user?.user_metadata as { name?: string } | undefined)?.name
    ?? clientEmail?.split('@')[0]
    ?? 'Cliente'

  return {
    pharmacyEmail: pharmacy?.contact_email ?? '',
    clientEmail,
    clientName,
  }
}

async function onCreated(r: Reservation) {
  const { pharmacyEmail, clientEmail, clientName } = await getContext(r)
  const shortId = r.id.slice(0, 8).toUpperCase()

  if (clientEmail) {
    await sendEmail(clientEmail, 'Reserva confirmada — Vonamed', template({
      title: `Olá ${clientName}, a sua reserva foi criada!`,
      body: `
        <p>Reservámos <strong>${r.medicine_name}</strong> na <strong>${r.pharmacy_name}</strong>.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;background:#f1f5f9;border-radius:8px;padding:12px;width:100%;">
          <tr><td style="padding:8px 12px;font-size:13px;color:#64748b;">Código de reserva</td><td style="padding:8px 12px;font-size:14px;font-weight:bold;font-family:monospace;color:#0f172a;text-align:right;">${shortId}</td></tr>
          <tr><td style="padding:8px 12px;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;">Preço</td><td style="padding:8px 12px;font-size:14px;font-weight:bold;color:#0f172a;text-align:right;border-top:1px solid #e2e8f0;">${r.price} MT</td></tr>
        </table>
        <p>Aguarde aprovação da farmácia. Será notificado quando estiver pronta para levantamento.</p>
      `,
      buttonText: 'Ver as minhas reservas',
      buttonUrl: `${APP_URL}/reservas`,
    }))
  }

  if (pharmacyEmail) {
    await sendEmail(pharmacyEmail, 'Nova reserva recebida — Vonamed', template({
      title: 'Recebeu uma nova reserva',
      body: `
        <p>Um cliente fez uma reserva na sua farmácia.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;background:#f1f5f9;border-radius:8px;padding:12px;width:100%;">
          <tr><td style="padding:8px 12px;font-size:13px;color:#64748b;">Medicamento</td><td style="padding:8px 12px;font-size:14px;font-weight:bold;color:#0f172a;text-align:right;">${r.medicine_name}</td></tr>
          <tr><td style="padding:8px 12px;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;">Preço</td><td style="padding:8px 12px;font-size:14px;font-weight:bold;color:#0f172a;text-align:right;border-top:1px solid #e2e8f0;">${r.price} MT</td></tr>
          <tr><td style="padding:8px 12px;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;">Cliente</td><td style="padding:8px 12px;font-size:14px;color:#0f172a;text-align:right;border-top:1px solid #e2e8f0;">${clientName}</td></tr>
          <tr><td style="padding:8px 12px;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;">Código</td><td style="padding:8px 12px;font-size:14px;font-weight:bold;font-family:monospace;color:#0f172a;text-align:right;border-top:1px solid #e2e8f0;">${shortId}</td></tr>
        </table>
        <p>Aceda ao dashboard para aprovar a reserva.</p>
      `,
      buttonText: 'Ver reservas recebidas',
      buttonUrl: `${APP_URL}/dashboard/reservas`,
      color: '#2563eb',
    }))
  }
}

async function onApproved(r: Reservation) {
  const { clientEmail, clientName } = await getContext(r)
  if (!clientEmail) return
  await sendEmail(clientEmail, 'Reserva pronta para levantamento — Vonamed', template({
    title: `${clientName}, a sua reserva está pronta!`,
    body: `
      <p><strong>${r.medicine_name}</strong> está disponível para levantar em <strong>${r.pharmacy_name}</strong>.</p>
      <p style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:8px;color:#92400e;margin:16px 0;">
        📍 <strong>Morada:</strong> ${r.pharmacy_address ?? ''}
      </p>
      <p>Apresente o <strong>QR code</strong> da sua reserva no balcão para levantar o medicamento.</p>
      <p style="font-size:13px;color:#94a3b8;">A reserva é válida por 24h após aprovação.</p>
    `,
    buttonText: 'Ver QR code da reserva',
    buttonUrl: `${APP_URL}/reservas`,
  }))
}

async function onCancelled(r: Reservation) {
  const { pharmacyEmail, clientEmail } = await getContext(r)
  const body = `<p>A reserva de <strong>${r.medicine_name}</strong> em <strong>${r.pharmacy_name}</strong> foi cancelada.</p>`

  if (clientEmail) {
    await sendEmail(clientEmail, 'Reserva cancelada — Vonamed', template({
      title: 'A sua reserva foi cancelada',
      body, color: '#dc2626',
      buttonText: 'Ver reservas', buttonUrl: `${APP_URL}/reservas`,
    }))
  }
  if (pharmacyEmail) {
    await sendEmail(pharmacyEmail, 'Reserva cancelada — Vonamed', template({
      title: 'Uma reserva foi cancelada',
      body, color: '#dc2626',
      buttonText: 'Ver reservas', buttonUrl: `${APP_URL}/dashboard/reservas`,
    }))
  }
}

async function onCompleted(r: Reservation) {
  const { clientEmail, clientName } = await getContext(r)
  if (!clientEmail) return
  await sendEmail(clientEmail, 'Levantamento confirmado — Vonamed', template({
    title: `Obrigado, ${clientName}!`,
    body: `
      <p>Confirmamos o levantamento de <strong>${r.medicine_name}</strong> em <strong>${r.pharmacy_name}</strong>.</p>
      <p>Esperamos voltar a vê-lo em breve. Avalie a sua experiência:</p>
    `,
    buttonText: 'Deixar avaliação',
    buttonUrl: `${APP_URL}/farmacia/${r.pharmacy_id}`,
  }))
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const { type, table, record, old_record } = payload

    if (table !== 'reservations') {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'INSERT') {
      await onCreated(record)
    } else if (type === 'UPDATE') {
      const oldStatus = old_record?.status
      const newStatus = record?.status
      if (oldStatus !== newStatus) {
        if (newStatus === 'aprovada') await onApproved(record)
        else if (newStatus === 'cancelada') await onCancelled(record)
        else if (newStatus === 'concluida') await onCompleted(record)
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Edge function error:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
