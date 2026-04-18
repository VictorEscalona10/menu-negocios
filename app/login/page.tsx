// app/login/page.tsx
import { LoginForm } from "./LoginForm"

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {
    return (
        <div className="flex-1 flex flex-col w-full px-4 sm:px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
            <LoginForm initialMessage={searchParams?.message} />
        </div>
    )
}