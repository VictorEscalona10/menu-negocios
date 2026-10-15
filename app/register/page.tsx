// app/register/page.tsx
import { RegisterForm } from "./RegisterForm"

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ email?: string; slug?: string }>
}) {
    const params = await searchParams
    return (
        <div className="flex-1 flex flex-col w-full px-4 sm:px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen py-8">
            <RegisterForm initialEmail={params?.email || ""} />
        </div>
    )
}
