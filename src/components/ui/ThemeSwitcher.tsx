import { Moon, Sparkles, Sun } from 'lucide-react'

import type { Theme } from '../../hooks/useTheme'

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Violet', icon: Moon },
  { id: 'abyss', label: 'Abyss', icon: Sparkles },
]

interface ThemeSwitcherProps {
  theme: Theme
  onChange: (theme: Theme) => void
}

export function ThemeSwitcher({ theme, onChange }: ThemeSwitcherProps) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5"
      role="group"
      aria-label="Theme"
    >
      {THEMES.map(({ id, label, icon: Icon }) => {
        const active = theme === id
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              active
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
