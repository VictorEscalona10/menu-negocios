const TRIPO_BASE_URL = 'https://openapi.tripo3d.ai/v3'
const TRIPO_MODEL_VERSION = 'v3.1-20260211'

export type TripoTaskStatus =
    | 'queued'
    | 'running'
    | 'success'
    | 'failed'
    | 'banned'
    | 'expired'
    | 'cancelled'
    | 'unknown'

export interface TripoTask {
    task_id: string
    type: string
    status: TripoTaskStatus
    progress?: number
    output?: {
        model_url?: string
        rendered_image_url?: string
    }
}

interface TripoResponse<T> {
    code: number
    message?: string
    data: T
}

function getApiKey(): string {
    const key = process.env.TRIPO_API_KEY
    if (!key) throw new Error('Falta la variable de entorno TRIPO_API_KEY')
    return key
}

async function tripoRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${TRIPO_BASE_URL}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${getApiKey()}`,
            ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
            ...init?.headers,
        },
        cache: 'no-store',
    })

    let body: TripoResponse<T> | null = null
    try {
        body = await res.json()
    } catch {
        // respuesta sin JSON
    }

    if (!res.ok || !body || body.code !== 0) {
        const detail = body?.message || `HTTP ${res.status}`
        throw new Error(`Error de la API de Tripo: ${detail}`)
    }

    return body.data
}

export async function createImageToModel(imageUrl: string): Promise<string> {
    const data = await tripoRequest<{ task_id: string }>('/generation/image-to-model', {
        method: 'POST',
        body: JSON.stringify({
            input: imageUrl,
            model: TRIPO_MODEL_VERSION,
            texture: true,
            pbr: true,
            face_limit: 50000,
        }),
    })
    return data.task_id
}

export async function createMultiviewToModel(imageUrls: string[]): Promise<string> {
    const views: Array<Record<string, string>> = [
        { front: imageUrls[0] },
        { back: imageUrls[1] },
    ]
    if (imageUrls[2]) views.push({ right: imageUrls[2] })

    const data = await tripoRequest<{ task_id: string }>('/generation/multiview-to-model', {
        method: 'POST',
        body: JSON.stringify({
            inputs: views,
            model: TRIPO_MODEL_VERSION,
            texture: true,
            pbr: true,
            face_limit: 50000,
        }),
    })
    return data.task_id
}

export async function getTask(taskId: string): Promise<TripoTask> {
    return tripoRequest<TripoTask>(`/tasks/${taskId}`)
}

export async function downloadFile(url: string): Promise<ArrayBuffer> {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`No se pudo descargar el archivo (HTTP ${res.status})`)
    return res.arrayBuffer()
}
