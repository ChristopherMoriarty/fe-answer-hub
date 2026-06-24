import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Modal } from '../ui/Modal'

interface AddColumnModalProps {
  open: boolean
  stepKinds: Record<string, string>
  isPending?: boolean
  onClose: () => void
  onSubmit: (payload: { step_kind: string; custom_title?: string }) => void
}

export function AddColumnModal({
  open,
  stepKinds,
  isPending = false,
  onClose,
  onSubmit,
}: AddColumnModalProps) {
  const [stepKind, setStepKind] = useState('applied')
  const [customTitle, setCustomTitle] = useState('')

  useEffect(() => {
    if (!open) return
    setStepKind('applied')
    setCustomTitle('')
  }, [open])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (stepKind === 'custom' && !customTitle.trim()) return
    onSubmit({
      step_kind: stepKind,
      custom_title: stepKind === 'custom' ? customTitle.trim() : undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add step column"
      description="Choose an interview stage to track in this board."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-column-form"
            disabled={isPending || (stepKind === 'custom' && !customTitle.trim())}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            Add column
          </button>
        </>
      }
    >
      <form id="add-column-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Step type
          </span>
          <select
            value={stepKind}
            onChange={(e) => setStepKind(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)]"
          >
            {Object.entries(stepKinds).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {stepKind === 'custom' && (
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Custom title
            </span>
            <input
              autoFocus
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Take-home assignment"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </label>
        )}
      </form>
    </Modal>
  )
}
