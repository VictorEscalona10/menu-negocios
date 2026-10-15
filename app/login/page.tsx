// app/login/page.tsx
import { LoginForm } from "./LoginForm"

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>
}) {
    const params = await searchParams
    return (
        <div className="flex-1 flex flex-col w-full px-4 sm:px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
            <LoginForm initialMessage={params?.message} />
        </div>
    )
}