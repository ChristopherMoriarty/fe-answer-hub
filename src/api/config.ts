export const API_BASE = import.meta.env.VITE_API_URL ?? ''

function requiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

export const ACCESS_TOKEN_KEY = requiredEnv(
  'VITE_ACCESS_TOKEN_KEY',
  import.meta.env.VITE_ACCESS_TOKEN_KEY,
)

export const REFRESH_TOKEN_KEY = requiredEnv(
  'VITE_REFRESH_TOKEN_KEY',
  import.meta.env.VITE_REFRESH_TOKEN_KEY,
)
