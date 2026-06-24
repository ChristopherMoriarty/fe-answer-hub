import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Modal } from '../ui/Modal'

interface CreateBoardModalProps {
  open: boolean
  isPending?: boolean
  onClose: () => void
  onSubmit: (title: string) => void
}

export function CreateBoardModal({
  open,
  isPending = false,
  onClose,
  onSubmit,
}: CreateBoardModalProps) {
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle('')
  }, [open])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New board"
      description="Track applications for a role or stack, e.g. Python or Backend."
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
            form="create-board-form"
            disabled={isPending || !title.trim()}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            Create
          </button>
        </>
      }
    >
      <form id="create-board-form" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Title
          </span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Python"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>
      </form>
    </Modal>
  )
}
