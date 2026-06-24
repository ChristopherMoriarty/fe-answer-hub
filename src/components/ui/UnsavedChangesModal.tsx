import { Loader2 } from 'lucide-react'

import { Modal } from './Modal'

interface UnsavedChangesModalProps {
  open: boolean
  isPending?: boolean
  onClose: () => void
  onDiscard: () => void
  onSave: () => void
}

export function UnsavedChangesModal({
  open,
  isPending = false,
  onClose,
  onDiscard,
  onSave,
}: UnsavedChangesModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Unsaved changes"
      description="Save your edits before leaving this CV version?"
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
            type="button"
            onClick={onDiscard}
            disabled={isPending}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)] transition hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-50"
          >
            Don&apos;t save
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            Save
          </button>
        </>
      }
    >
      <p className="text-sm text-[var(--color-muted)]">
        Your title or notes changes will be lost if you leave without saving.
      </p>
    </Modal>
  )
}
