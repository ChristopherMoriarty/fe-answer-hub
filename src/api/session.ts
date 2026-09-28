import { ACCESS_TOKEN_KEY, API_BASE, REFRESH_TOKEN_KEY } from './config'

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

type SessionListener = () => void

const listeners = new Set<SessionListener>()

export function subscribeSession(listener: SessionListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emitSession() {
  for (const listener of listeners) listener()
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function hasSession() {
  return Boolean(getAccessToken() && localStorage.getItem(REFRESH_TOKEN_KEY))
}

export function setSession(tokens: TokenPair) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  emitSession()
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  emitSession()
}

export function isAccessExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number }
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now() + 5_000
  } catch {
    return true
  }
}

let refreshing: Promise<boolean> | null = null

export function refreshSession() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return Promise.resolve(false)
  if (!refreshing) {
    refreshing = (async () => {
      const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!response.ok) {
        clearSession()
        return false
      }
      setSession((await response.json()) as TokenPair)
      return true
    })().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    let detail = 'Invalid credentials'
    try {
      const body = (await response.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      // keep the fallback message
    }
    throw new Error(detail)
  }
  setSession((await response.json()) as TokenPair)
}
