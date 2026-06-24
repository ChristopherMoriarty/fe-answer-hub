import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'abyss'

const STORAGE_KEY = 'answer-hub-theme'

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'abyss'
}

export function getStoredTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  return isTheme(saved) ? saved : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return { theme, setTheme }
}
