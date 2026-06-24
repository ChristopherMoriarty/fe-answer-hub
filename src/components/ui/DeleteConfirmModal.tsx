import { Loader2 } from 'lucide-react'

import { Modal } from './Modal'

interface DeleteConfirmModalProps {
  open: boolean
  title: string
  heading?: string
  message?: string
  isPending?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({
  open,
  title,
  heading = 'Delete topic?',
  message,
  isPending = false,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const description =
    message ?? `“${title}” and all nested items will be removed permanently.`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={heading}
      description={description}
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
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-danger)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            Delete
          </button>
        </>
      }
    >
      <p className="text-sm text-[var(--color-muted)]">This action cannot be undone.</p>
    </Modal>
  )
}
