// app/dashboard/settings/pago/page.tsx
export const dynamic = 'force-dynamic';

// Página de retorno después de un pago exitoso en VEXPay
// En desarrollo (sin webhook), esta página activa la suscripción directamente
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ status?: string; ref?: string }>
}

export default async function PagoPage({ searchParams }: Props) {
  const { status, ref } = await searchParams

  // Si no hay parámetros válidos, redirigir a dashboard
  if (status !== 'success' || !ref) {
    redirect('/dashboard')
  }

  // Autenticar al usuario
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar el pago por referencia
  const payment = await prisma.subscriptionPayment.findFirst({
    where: {
      gatewayRef: ref,
      gateway: 'VEXPAY',
    },
    include: {
      store: true,
      plan: true,
    },
  })

  if (!payment || payment.store.userId !== user.id) {
    redirect('/dashboard')
  }

  // En desarrollo (o si el webhook aún no terminó de impactar la BD antes del redirect):
  // Si el pago está PENDING y VEXPay redirigió al successUrl, activamos la suscripción.
  if (payment.status === 'PENDING') {
    const gracePeriodEndsAt = new Date(payment.periodEndsAt.getTime() + 5 * 24 * 60 * 60 * 1000)

    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: 'APPROVED' },
    })

    await prisma.store.update({
      where: { id: payment.storeId },
      data: {
        planId: payment.planId,
        subscriptionStatus: 'ACTIVE',
        currentPeriodEnd: payment.periodEndsAt,
        gracePeriodEndsAt,
        isActive: true,
        subscriptionUpdatedAt: new Date(),
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 max-w-md w-full text-center space-y-5">
        {/* Ícono de éxito */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-emerald-600 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-zinc-950">
            ¡Pago confirmado!
          </h1>
          <p className="text-sm text-zinc-500">
            Tu suscripción al <span className="font-bold text-zinc-700">{payment.plan.name}</span> ha sido
            activada por 30 días.
          </p>
        </div>

        {/* Resumen */}
        <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/70 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Negocio</span>
            <span className="font-bold text-zinc-800">{payment.store.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Plan</span>
            <span className="font-bold text-zinc-800">{payment.plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Monto</span>
            <span className="font-bold text-zinc-800">${payment.amountUsd} USD</span>
          </div>
          {payment.amountBs && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Monto en Bs</span>
              <span className="font-bold text-zinc-800">
                Bs. {payment.amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {payment.bcvRate && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Tasa BCV</span>
              <span className="font-mono text-zinc-600">{payment.bcvRate.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500">Referencia</span>
            <span className="font-mono text-[10px] text-zinc-500">{ref}</span>
          </div>
        </div>

        {/* Botón de regreso */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ir al Panel de Control
        </Link>
      </div>
    </div>
  )
}

