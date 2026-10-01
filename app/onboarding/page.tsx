// app/onboarding/page.tsx
export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import OnboardingWizard from './OnboardingWizard'

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Si ya posee una tienda registrada, va directo a su dashboard
    const store = await prisma.store.findUnique({
        where: { userId: user.id }
    })

    if (store) {
        return redirect('/dashboard')
    }

    return <OnboardingWizard userEmail={user.email || ''} />
}
