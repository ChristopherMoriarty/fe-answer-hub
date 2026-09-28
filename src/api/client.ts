import { API_BASE } from './config'
import { getAccessToken, refreshSession } from './session'

export { API_BASE }

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function authorizedFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: withAuth(init?.headers),
  })
  if (response.status !== 401 || path.startsWith('/api/v1/auth/')) {
    return response
  }

  const refreshed = await refreshSession()
  if (!refreshed) return response

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: withAuth(init?.headers),
  })
}

function withAuth(headers?: HeadersInit) {
  const next = new Headers(headers)
  const accessToken = getAccessToken()
  if (accessToken) next.set('Authorization', `Bearer ${accessToken}`)
  return next
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
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
  const response = await authorizedFetch(path, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(await parseErrorResponse(response), response.status)
  }

  return (await response.json()) as T
}

export async function apiBlob(path: string): Promise<Blob> {
  const response = await authorizedFetch(path)

  if (!response.ok) {
    throw new ApiError(await parseErrorResponse(response), response.status)
  }

  return response.blob()
}
