const API_BASE = import.meta.env.VITE_API_URL ?? ''

export { API_BASE }

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new ApiError(await parseErrorResponse(response), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function parseErrorResponse(response: Response): Promise<string> {
  let detail = response.statusText
  try {
    const body = (await response.json()) as { detail?: string }
    if (body.detail) detail = body.detail
  } catch {
    // ignore parse errors
  }
  return detail
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(await parseErrorResponse(response), response.status)
  }

  return (await response.json()) as T
}
