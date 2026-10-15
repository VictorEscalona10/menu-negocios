"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    CheckCircle2, 
    RefreshCw, 
    AlertCircle, 
    ArrowLeft 
} from "lucide-react"
import { signUpAction, verifyOtpAction, resendOtpAction } from "@/src/actions/auth"

export function RegisterForm({ initialEmail = "" }: { initialEmail?: string }) {
    // Estado de los pasos: 'register' = formulario inicial, 'verify' = introducción de código OTP
    const [step, setStep] = useState<"register" | "verify">("register")
    
    // Campos del formulario
    const [email, setEmail] = useState(initialEmail)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [otpCode, setOtpCode] = useState("")
    
    // Estados de UI
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    
    // Temporizador de reenvío
    const [cooldown, setCooldown] = useState(0)
    const otpInputRef = useRef<HTMLInputElement>(null)

    // Manejo del contador de reenvío
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setInterval(() => {
            setCooldown((prev) => Math.max(0, prev - 1))
        }, 1000)
        return () => clearInterval(timer)
    }, [cooldown])

    // Auto-focus al pasar al paso de verificación
    useEffect(() => {
        if (step === "verify" && otpInputRef.current) {
            otpInputRef.current.focus()
        }
    }, [step])

    // Validación y envío de registro (Paso 1)
    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMsg("")
        setSuccessMsg("")

        const cleanEmail = email.trim().toLowerCase()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        
        if (!cleanEmail) {
            setErrorMsg("Por favor, ingresa tu correo electrónico.")
            return
        }

        if (!emailRegex.test(cleanEmail)) {
            setErrorMsg("Ingresa una dirección de correo válida (ejemplo: usuario@correo.com).")
            return
        }

        if (password.length < 6) {
            setErrorMsg("La contraseña debe tener al menos 6 caracteres.")
            return
        }

        if (password !== confirmPassword) {
            setErrorMsg("Las contraseñas no coinciden. Por favor, revísalas.")
            return
        }

        setIsPending(true)
        const formData = new FormData()
        formData.append("email", cleanEmail)
        formData.append("password", password)

        try {
            const res = await signUpAction(formData)
            if (res?.error) {
                setErrorMsg(res.error)
            } else if (res?.success) {
                setStep("verify")
                setCooldown(60) // 60 segundos de cooldown para reenvío
                setSuccessMsg("¡Código enviado! Revisa tu bandeja de entrada o spam.")
            }
        } catch (err: any) {
            // Manejar la redirección de Next.js si Supabase inició sesión automáticamente
            if (err.message && err.message.includes('NEXT_REDIRECT')) {
                throw err
            }
            if (err.digest && err.digest.startsWith('NEXT_REDIRECT')) {
                throw err
            }
            setErrorMsg("Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo.")
        } finally {
            setIsPending(false)
        }
    }

    // Validación y verificación de código OTP (Paso 2)
    const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMsg("")
        setSuccessMsg("")

        const cleanCode = otpCode.trim().replace(/\D/g, "")
        if (cleanCode.length !== 6) {
            setErrorMsg("Por favor, introduce el código numérico completo de 6 dígitos.")
            return
        }

        setIsPending(true)

        try {
            const res = await verifyOtpAction({
                email: email.trim().toLowerCase(),
                token: cleanCode
            })
            if (res?.error) {
                setErrorMsg(res.error)
            }
        } catch (err: any) {
            // Permitir que Next.js ejecute la redirección hacia el dashboard / onboarding
            if (err.message && err.message.includes('NEXT_REDIRECT')) {
                throw err
            }
            if (err.digest && err.digest.startsWith('NEXT_REDIRECT')) {
                throw err
            }
            setErrorMsg("Código inválido o expirado. Por favor, intenta de nuevo.")
        } finally {
            setIsPending(false)
        }
    }

    // Reenviar código OTP
    const handleResendOtp = async () => {
        if (cooldown > 0 || isPending) return
        setErrorMsg("")
        setSuccessMsg("")
        setIsPending(true)

        try {
            const res = await resendOtpAction({ email: email.trim().toLowerCase() })
            if (res?.error) {
                setErrorMsg(res.error)
            } else {
                setCooldown(60)
                setSuccessMsg("Hemos enviado un nuevo código a tu correo.")
            }
        } catch (err) {
            setErrorMsg("No se pudo reenviar el código. Inténtalo nuevamente.")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex-1 flex flex-col w-full justify-center text-foreground bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100">
            
            {/* Cabecera de la marca */}
            <div className="text-center mb-3">
                <Link href="/" className="inline-flex items-center gap-2 group mb-4">
                    <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
                        K
                    </div>
                    <span className="font-extrabold text-2xl tracking-tight text-[#1D1D1F]">
                        komy<span className="text-[#FF453A]">.</span>
                    </span>
                </Link>

                {step === "register" ? (
                    <>
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Crea tu Cuenta</h1>
                        <p className="text-zinc-500 font-medium mt-1.5 text-sm sm:text-base leading-relaxed">
                            Crea tu menú digital hoy y comienza a vender directamente por WhatsApp.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-900">
                            <Mail className="w-6 h-6 stroke-[2]" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Revisa tu Correo</h1>
                        <p className="text-zinc-500 font-medium mt-1 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                            Enviamos un código de 6 dígitos a <strong className="text-zinc-900 font-semibold">{email}</strong>.
                        </p>
                    </>
                )}
            </div>

            {/* ════════════════════════════════════════════════
                PASO 1: FORMULARIO DE REGISTRO
               ════════════════════════════════════════════════ */}
            {step === "register" ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 mt-2">
                    {/* Campo Correo Electrónico */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-zinc-800 ml-1" htmlFor="register-email">
                            Correo electrónico
                        </label>
                        <div className="relative">
                            <input
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-5 py-3.5 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium placeholder-zinc-400 text-sm sm:text-base"
                                name="email"
                                id="register-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@negocio.com"
                                required
                            />
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Mail className="w-5 h-5 text-zinc-400" />
                            </div>
                        </div>
                    </div>

                    {/* Campo Contraseña */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-sm font-bold text-zinc-800" htmlFor="register-password">
                                Contraseña
                            </label>
                            <span className="text-[11px] font-semibold text-zinc-400">Mín. 6 caracteres</span>
                        </div>
                        <div className="relative">
                            <input
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-12 py-3.5 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium placeholder-zinc-400 text-sm sm:text-base"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="register-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={6}
                                required
                            />
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Lock className="w-5 h-5 text-zinc-400" />
                            </div>
                            <button
                                type="button"
                                className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Campo Confirmar Contraseña */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-zinc-800 ml-1" htmlFor="register-confirm-password">
                            Confirmar contraseña
                        </label>
                        <div className="relative">
                            <input
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-12 py-3.5 text-zinc-900 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all font-medium placeholder-zinc-400 text-sm sm:text-base"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                id="register-confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={6}
                                required
                            />
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Lock className="w-5 h-5 text-zinc-400" />
                            </div>
                            <button
                                type="button"
                                className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Botón de Envío */}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-black text-white rounded-2xl px-4 py-4 text-sm font-bold shadow-sm hover:bg-zinc-800 hover:-translate-y-0.5 mt-2 active:scale-95 transition-all disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Enviando código de verificación...</span>
                            </>
                        ) : (
                            <>
                                <span>Crear Cuenta y Recibir Código</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            ) : (
                /* ════════════════════════════════════════════════
                   PASO 2: VERIFICACIÓN CON CÓDIGO OTP (6 DÍGITOS)
                   ════════════════════════════════════════════════ */
                <form onSubmit={handleVerifySubmit} className="space-y-5 mt-2">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block text-center" htmlFor="otp-input">
                            Código de verificación
                        </label>
                        <div className="relative max-w-[280px] mx-auto">
                            <input
                                ref={otpInputRef}
                                id="otp-input"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                                    setOtpCode(val)
                                }}
                                placeholder="000000"
                                className="w-full bg-zinc-50 border-2 border-zinc-200 focus:border-black rounded-2xl py-4 text-center font-mono text-3xl font-extrabold tracking-[0.4em] text-zinc-900 outline-none transition-all shadow-inner focus:bg-white"
                                required
                            />
                        </div>
                        <p className="text-[12px] text-zinc-400 text-center font-medium">
                            Escribe los 6 dígitos que recibiste por correo.
                        </p>
                    </div>

                    {/* Botón de Verificación por Código */}
                    <button
                        type="submit"
                        disabled={isPending || otpCode.length !== 6}
                        className="w-full bg-black text-white rounded-2xl px-4 py-4 text-sm font-bold shadow-sm hover:bg-zinc-800 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Verificando código...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Verificar y Continuar</span>
                            </>
                        )}
                    </button>

                    {/* Acciones adicionales: Reenviar código y Cambiar correo */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-zinc-500 font-semibold border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={() => {
                                setStep("register")
                                setErrorMsg("")
                                setSuccessMsg("")
                            }}
                            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-black transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Cambiar correo</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={cooldown > 0 || isPending}
                            className={`inline-flex items-center gap-1.5 transition-colors ${
                                cooldown > 0 
                                    ? "text-zinc-400 cursor-not-allowed" 
                                    : "text-zinc-900 hover:underline cursor-pointer"
                            }`}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
                            <span>
                                {cooldown > 0 ? `Reenviar código en ${cooldown}s` : "Reenviar código"}
                            </span>
                        </button>
                    </div>
                </form>
            )}

            {/* Mensajes de Alerta: Error */}
            {errorMsg && (
                <div className="bg-red-50 text-red-800 py-3.5 px-4 rounded-xl border border-red-200 flex items-start gap-3 mt-4 text-xs sm:text-sm animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{errorMsg}</span>
                </div>
            )}

            {/* Mensajes de Alerta: Éxito */}
            {successMsg && !errorMsg && (
                <div className="bg-emerald-50 text-emerald-800 py-3 px-4 rounded-xl border border-emerald-200 flex items-center gap-2.5 mt-4 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Enlace hacia el Login */}
            <div className="text-center pt-4 mt-2 border-t border-zinc-100">
                <p className="text-sm text-zinc-500 font-medium">
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className="text-black font-bold hover:underline transition-all">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    )
}
