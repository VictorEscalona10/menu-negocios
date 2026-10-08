'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { startModel3D, pollModel3D, deleteModel3D, type Model3DResult, type Model3DPollResult } from '@/src/actions/model3d'
import { ModelViewer } from './ModelViewer'

interface Product3DProps {
    id: string
    name: string
    model3dStatus: string | null
    model3dUrl: string | null
    model3dThumbUrl: string | null
    model3dError: string | null
    model3dSources: string[]
}

type ModalStatus = 'idle' | 'uploading' | 'processing' | 'succeeded' | 'failed'

interface Photo {
    file: File
    preview: string
}

const MAX_PHOTOS = 3
const MAX_PHOTO_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function statusFromProduct(product: Product3DProps): ModalStatus {
    switch (product.model3dStatus) {
        case 'PROCESSING': return 'processing'
        case 'SUCCEEDED': return 'succeeded'
        case 'FAILED': return 'failed'
        default: return 'idle'
    }
}

export function ConvertTo3DModal({ product }: { product: Product3DProps }) {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [status, setStatus] = useState<ModalStatus>('idle')
    const [photos, setPhotos] = useState<Photo[]>([])
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [modelUrl, setModelUrl] = useState<string | null>(null)
    const [thumbUrl, setThumbUrl] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const photosRef = useRef<Photo[]>([])
    photosRef.current = photos

    useEffect(() => {
        setMounted(true)
    }, [])

    const releasePreviews = useCallback((items: Photo[]) => {
        items.forEach(item => URL.revokeObjectURL(item.preview))
    }, [])

    const clearPhotos = useCallback(() => {
        releasePreviews(photosRef.current)
        setPhotos([])
    }, [releasePreviews])

    useEffect(() => {
        return () => releasePreviews(photosRef.current)
    }, [releasePreviews])

    const openModal = () => {
        clearPhotos()
        setError(null)
        setIsPending(false)
        setProgress(0)
        setModelUrl(product.model3dUrl)
        setThumbUrl(product.model3dThumbUrl)
        setStatus(statusFromProduct(product))
        setIsOpen(true)
    }

    const closeModal = () => {
        setIsOpen(false)
        clearPhotos()
    }

    useEffect(() => {
        if (status !== 'processing') return

        let cancelled = false

        const tick = async () => {
            try {
                const result: Model3DPollResult = await pollModel3D(product.id)
                if (cancelled) return
                if (result.status === 'PROCESSING') {
                    setProgress(result.progress)
                } else if (result.status === 'SUCCEEDED') {
                    setModelUrl(result.modelUrl)
                    setThumbUrl(result.thumbUrl)
                    setStatus('succeeded')
                } else if (result.status === 'FAILED') {
                    setError(result.error)
                    setStatus('failed')
                } else if (result.status === 'NONE') {
                    setStatus('idle')
                }
            } catch {
                // error transitorio: se reintenta en el siguiente tick
            }
        }

        tick()
        const interval = setInterval(tick, 4000)
        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [status, product.id])

    const addFiles = (files: FileList | null) => {
        if (!files) return
        const next: Photo[] = []
        for (const file of Array.from(files)) {
            if (photos.length + next.length >= MAX_PHOTOS) {
                setError(`Máximo ${MAX_PHOTOS} fotos`)
                break
            }
            if (!ALLOWED_TYPES.includes(file.type)) {
                setError('Formato no válido. Solo JPEG, PNG o WEBP.')
                continue
            }
            if (file.size > MAX_PHOTO_BYTES) {
                setError('Cada foto debe pesar 8MB o menos.')
                continue
            }
            setError(null)
            next.push({ file, preview: URL.createObjectURL(file) })
        }
        if (next.length > 0) setPhotos(prev => [...prev, ...next])
    }

    const removePhoto = (index: number) => {
        const copy = [...photosRef.current]
        URL.revokeObjectURL(copy[index].preview)
        copy.splice(index, 1)
        setPhotos(copy)
    }

    const handleConvert = async () => {
        setIsPending(true)
        setStatus('uploading')
        setError(null)

        const formData = new FormData()
        photos.forEach(photo => formData.append('photos', photo.file))

        try {
            const result: Model3DResult = await startModel3D(product.id, formData)
            if (!result.ok) {
                setError(result.error)
                setStatus(product.model3dStatus === 'SUCCEEDED' && product.model3dUrl ? 'succeeded' : 'idle')
                return
            }
            setProgress(0)
            setStatus('processing')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado')
            setStatus('idle')
        } finally {
            setIsPending(false)
        }
    }

    const handleDelete = async () => {
        setIsPending(true)
        try {
            const result: Model3DResult = await deleteModel3D(product.id)
            if (!result.ok) {
                setError(result.error)
                return
            }
            setModelUrl(null)
            setThumbUrl(null)
            setError(null)
            setProgress(0)
            setStatus('idle')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado')
        } finally {
            setIsPending(false)
        }
    }

    const hasStoredSources = product.model3dSources.length > 0

    const trigger = (
        <button
            onClick={openModal}
            className="group relative p-2 rounded-full hover:bg-violet-50 transition-colors"
            title="Convertir a 3D"
        >
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-violet-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {product.model3dStatus === 'SUCCEEDED' && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
        </button>
    )

    if (!isOpen || !mounted) return trigger

    return (
        <>
            {trigger}
            {createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={closeModal} />
            <div
                className="relative bg-white w-[92vw] sm:w-[min(65vw,1000px)] max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 animate-in zoom-in-95 duration-300 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 sm:px-8 border-b border-zinc-100 flex justify-between items-center shrink-0">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight truncate">
                                Convertir a 3D
                            </h2>
                            {product.model3dStatus === 'SUCCEEDED' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-wider shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    3D activo
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-zinc-500 font-medium mt-0.5 truncate">
                            Plating: <span className="font-bold text-zinc-800">{product.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={closeModal}
                        className="p-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-black rounded-full transition-all active:scale-90 shrink-0 ml-4"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 overflow-y-auto bg-zinc-50/30 flex-1">
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-bold flex items-start gap-3">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* IDLE: selector de fotos */}
                    {(status === 'idle' || status === 'uploading') && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider mb-1">Fotos del platillo</h3>
                                <p className="text-sm text-zinc-500 font-medium">
                                    Sube hasta {MAX_PHOTOS} fotos del mismo plato desde distintos ángulos. La primera será la vista frontal.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
                                    const photo = photos[index]
                                    if (photo) {
                                        return (
                                            <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-zinc-200 bg-white group">
                                                <img src={photo.preview} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                                                {index === 0 && (
                                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-black bg-black/70 text-white uppercase tracking-wider">
                                                        Frontal
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => removePhoto(index)}
                                                    disabled={status === 'uploading'}
                                                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-zinc-600 hover:text-red-500 rounded-full shadow transition-all disabled:opacity-50"
                                                    title="Quitar foto"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )
                                    }
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={status === 'uploading'}
                                            className="aspect-square rounded-2xl border-2 border-dashed border-zinc-300 hover:border-zinc-500 bg-white hover:bg-zinc-50 transition-all flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-zinc-700 disabled:opacity-50"
                                        >
                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="text-xs font-black uppercase tracking-wider">Foto {index + 1}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    addFiles(e.target.files)
                                    e.target.value = ''
                                }}
                            />

                            {photos.length === 0 && hasStoredSources && (
                                <p className="text-sm font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3">
                                    No has elegido fotos nuevas: se usarán las {product.model3dSources.length} foto(s) que ya tienes guardadas.
                                </p>
                            )}

                            <button
                                onClick={handleConvert}
                                disabled={isPending || (photos.length === 0 && !hasStoredSources)}
                                className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white font-black text-sm sm:text-base px-8 py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg"
                            >
                                {status === 'uploading' ? 'Subiendo fotos…' : product.model3dStatus === 'FAILED' || product.model3dStatus === 'SUCCEEDED' ? 'Regenerar en 3D' : 'Convertir en 3D'}
                            </button>
                        </div>
                    )}

                    {/* PROCESSING */}
                    {status === 'processing' && (
                        <div className="py-6 sm:py-10 flex flex-col items-center text-center gap-6">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 rounded-full border-4 border-zinc-200" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-black animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-black text-zinc-900">{progress}%</span>
                                </div>
                            </div>

                            <div className="space-y-2 w-full max-w-md">
                                <h3 className="font-black text-lg text-zinc-900">Generando tu modelo 3D…</h3>
                                <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-black rounded-full transition-all duration-700"
                                        style={{ width: `${Math.max(progress, 3)}%` }}
                                    />
                                </div>
                                <p className="text-sm text-zinc-500 font-medium">
                                    {progress < 10 ? 'En cola de procesamiento…' : progress < 90 ? 'Modelando geometría y textura…' : 'Preparando el resultado…'}
                                </p>
                            </div>

                            <p className="text-xs font-bold text-zinc-400 bg-zinc-100 rounded-xl px-4 py-2.5">
                                Puedes cerrar esta ventana. Vuelve más tarde y el estado se retomará automáticamente.
                            </p>
                        </div>
                    )}

                    {/* SUCCEEDED: visor 3D */}
                    {status === 'succeeded' && modelUrl && (
                        <div className="space-y-5">
                            <div className="relative w-full h-[45vh] min-h-[320px] rounded-2xl overflow-hidden border border-zinc-200 bg-gradient-to-b from-zinc-100 to-zinc-200">
                                <ModelViewer src={modelUrl} poster={thumbUrl} alt={`Modelo 3D de ${product.name}`} className="w-full h-full" />
                                <span className="absolute top-3 left-3 px-3 py-1.5 rounded-xl text-[11px] font-black bg-white/80 backdrop-blur text-zinc-700 uppercase tracking-wider shadow-sm pointer-events-none">
                                    Arrastra para rotar
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleConvert}
                                    disabled={isPending}
                                    className="flex-1 bg-black hover:bg-zinc-800 text-white font-black text-sm px-6 py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-40 shadow-lg"
                                >
                                    {isPending ? 'Regenerando…' : 'Regenerar modelo'}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="flex-1 bg-white hover:bg-red-50 text-red-500 font-black text-sm px-6 py-3.5 rounded-2xl border-2 border-red-100 hover:border-red-200 transition-all active:scale-95 disabled:opacity-40"
                                >
                                    Eliminar modelo 3D
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FAILED */}
                    {status === 'failed' && (
                        <div className="py-6 flex flex-col items-center text-center gap-5">
                            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="space-y-1.5 max-w-md">
                                <h3 className="font-black text-lg text-zinc-900">No se pudo generar el modelo</h3>
                                <p className="text-sm text-zinc-500 font-medium">
                                    {error || product.model3dError || 'Ocurrió un error durante la conversión.'}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                                <button
                                    onClick={handleConvert}
                                    disabled={isPending || (!hasStoredSources && photos.length === 0)}
                                    className="flex-1 bg-black hover:bg-zinc-800 text-white font-black text-sm px-6 py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-40 shadow-lg"
                                >
                                    {isPending ? 'Reintentando…' : 'Reintentar'}
                                </button>
                                <button
                                    onClick={() => { setError(null); setStatus('idle') }}
                                    disabled={isPending}
                                    className="flex-1 bg-white hover:bg-zinc-50 text-zinc-700 font-black text-sm px-6 py-3.5 rounded-2xl border-2 border-zinc-200 hover:border-zinc-300 transition-all active:scale-95"
                                >
                                    Elegir otras fotos
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
            )}
        </>
    )
}
