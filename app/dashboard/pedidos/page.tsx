// app/dashboard/pedidos/page.tsx
export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSubscriptionInfo } from '@/lib/subscription'
import PedidosKitchenClient from './PedidosKitchenClient'
import PlanUpgradePrompt from '../components/PlanUpgradePrompt'

export default async function PedidosPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const store = await prisma.store.findUnique({
        where: { userId: user.id },
        include: { plan: true },
    })

    if (!store) {
        return redirect('/dashboard')
    }

    const subscription = getSubscriptionInfo(store)
    if (subscription.isBlocked) {
        return redirect('/dashboard')
    }

    if (!subscription.canAccessLiveKitchen) {
        return (
            <PlanUpgradePrompt
                storeId={store.id}
                featureName="Pantalla de Cocina y Pedidos en Vivo"
                featureDescription="Visualiza en tiempo real las comandas que entran desde WhatsApp, mesas con código QR o meseros en tu cocina. Cambia estados a preparando, listo o entregado con alertas sonoras."
                featureType="pedidos"
            />
        )
    }

    return <PedidosKitchenClient />
}
