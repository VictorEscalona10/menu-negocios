// lib/vexpay.ts
// Cliente VEXPay server-side — NUNCA importar desde componentes client
import VexPay, { WebhookEvent, PaymentWebhookData } from '@vexpay/node'

const apiKey = process.env.VEXPAY_API_KEY
if (!apiKey) {
  console.warn('[VEXPay] ⚠️ VEXPAY_API_KEY no está configurada en .env')
}

export const vexpay = new VexPay(apiKey || '')

export type { WebhookEvent, PaymentWebhookData }

export interface NormalizedWebhookData {
  paymentId?: string
  reference?: string
  status?: string
  usdAmount?: number
  vesAmount?: number
  bcvRate?: number
}

export interface NormalizedWebhookEvent {
  event: string
  timestamp: string | number
  data: NormalizedWebhookData
}

/**
 * Verifica la firma del webhook de VEXPay usando el SDK oficial si existe secret,
 * o parsea directamente en desarrollo local si no se ha configurado secret.
 */
export function verifyVexpayWebhook(
  rawBody: string,
  signatureHeader: string | null,
): NormalizedWebhookEvent | null {
  const secret = process.env.VEXPAY_WEBHOOK_SECRET

  // En desarrollo sin secret configurado, parsear sin verificar
  if (!secret) {
    console.warn('[VEXPay] ⚠️ VEXPAY_WEBHOOK_SECRET no configurado — webhook NO verificado (solo dev)')
    try {
      const parsed = JSON.parse(rawBody)
      const data = parsed.data || {}
      return {
        event: parsed.event,
        timestamp: parsed.timestamp,
        data: {
          paymentId: data.paymentId || data.id,
          reference: data.externalRef || data.reference,
          status: data.status,
          usdAmount: data.usdAmount ?? data.amountUsd,
          vesAmount: data.vesAmount ?? data.amount,
          bcvRate: data.bcvRate,
        },
      }
    } catch {
      return null
    }
  }

  if (!signatureHeader) {
    console.error('[VEXPay] ❌ Falta header VexPay-Signature')
    return null
  }

  try {
    const event = vexpay.webhooks.constructEvent(rawBody, signatureHeader, secret)
    const d = event.data as unknown as Record<string, unknown>
    return {
      event: event.event,
      timestamp: event.timestamp,
      data: {
        paymentId: (d.paymentId as string) || (d.id as string),
        reference: (d.externalRef as string) || (d.reference as string),
        status: d.status as string,
        usdAmount: typeof d.usdAmount === 'number' ? d.usdAmount : undefined,
        vesAmount: typeof d.vesAmount === 'number' ? d.vesAmount : (typeof d.amount === 'number' ? d.amount : undefined),
        bcvRate: typeof d.bcvRate === 'number' ? d.bcvRate : undefined,
      },
    }
  } catch (err) {
    console.error('[VEXPay] ❌ Error verificando webhook:', err)
    return null
  }
}
