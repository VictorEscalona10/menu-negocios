"use client"

import { useState } from "react"
import { signInAction } from "@/src/actions/auth"

export function LoginForm({ initialMessage }: { initialMessage?: string }) {
    const [isPending, setIsPending] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [errorMsg, setErrorMsg] = useState(initialMessage || "")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setIsPending(true)
        setErrorMsg("")
        
        try {
            const res = await signInAction(formData)
            if (res?.error) {
                setErrorMsg(res.error)
            }
        } catch (err: any) {
            if (err.message && err.message.includes('NEXT_REDIRECT')) {
                throw err; // Let Next.js handle redirects
            }
            if (err.digest && err.digest.startsWith('NEXT_REDIRECT')) {
                throw err;
            }
            setErrorMsg("Ocurrió un error inesperado al intentar iniciar sesión.")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col w-full justify-center gap-5 text-foreground bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100">
            <div className="text-center mb-4">
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Bienvenido de Vuelta</h1>
                <p className="text-zinc-500 font-medium mt-2 leading-relaxed">Inicia sesión en tu cuenta para acceder al panel de administración.</p>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-800 ml-1" htmlFor="email">Correo electrónico</label>
                <div className="relative">
                    <input
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-5 py-3.5 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium placeholder-zinc-400"
                        name="email"
                        id="email"
                        type="email"
                        placeholder="tu@correo.com"
                        required
                    />
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-800 ml-1" htmlFor="password">Contraseña</label>
                <div className="relative">
                    <input
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-12 py-3.5 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium placeholder-zinc-400"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        placeholder="••••••••"
                        required
                    />
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <button 
                        type="button"
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                        )}
                    </button>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-black text-white rounded-2xl px-4 py-4 text-sm font-bold shadow-sm hover:bg-zinc-800 hover:-translate-y-0.5 mt-2 active:scale-95 transition-all disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isPending ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Iniciando Sesión...
                    </>
                ) : "Entrar al Panel"}
            </button>

            {errorMsg && (
                <div className="bg-red-50 text-red-800 py-3.5 px-4 rounded-xl border border-red-200 flex flex-col sm:flex-row items-center sm:items-start gap-3 animate-in fade-in slide-in-from-top-1 text-center sm:text-left">
                    <div className="bg-red-100 p-1.5 rounded-full shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-semibold text-sm">
                        {errorMsg}
                    </span>
                </div>
            )}
        </form>
    )
}
