import { Loader2, Zap } from 'lucide-react'
import { useState } from 'react'

import { login } from '../../api/session'
import { useTheme } from '../../hooks/useTheme'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'

export function LoginScreen() {
  const { theme, setTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/60 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-on)]">
            <Zap size={16} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Answer Hub</h1>
            <p className="text-[11px] text-[var(--color-muted)]">Interview prep workspace</p>
          </div>
        </div>
        <div className="ml-auto">
          <ThemeSwitcher theme={theme} onChange={setTheme} />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
        >
          <h2 className="text-base font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Use the account already stored in the database.
          </p>

          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Email
            </span>
            <input
              autoFocus
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </label>

          {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
          >
            {pending && <Loader2 size={15} className="animate-spin" />}
            Sign in
          </button>
        </form>
      </main>
    </div>
  )
}
