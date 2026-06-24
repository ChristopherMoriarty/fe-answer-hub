import { Loader2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Modal } from '../ui/Modal'

interface UploadCvModalProps {
  open: boolean
  isPending?: boolean
  onClose: () => void
  onSubmit: (payload: {
    title: string
    file: File
    notes?: string
    is_current: boolean
  }) => void
}

export function UploadCvModal({
  open,
  isPending = false,
  onClose,
  onSubmit,
}: UploadCvModalProps) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [isCurrent, setIsCurrent] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setNotes('')
    setIsCurrent(true)
    setFile(null)
    setFileError(null)
  }, [open])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setFileError(null)

    if (!nextFile) {
      setFile(null)
      return
    }

    if (nextFile.type !== 'application/pdf') {
      setFile(null)
      setFileError('Only PDF files are allowed')
      return
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setFile(null)
      setFileError('PDF must be 10 MB or smaller')
      return
    }

    setFile(nextFile)
    if (!title.trim()) {
      setTitle(nextFile.name.replace(/\.pdf$/i, ''))
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!file || !title.trim()) return

    onSubmit({
      title: title.trim(),
      file,
      notes: notes.trim() || undefined,
      is_current: isCurrent,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload CV"
      description="Add a new PDF version of your resume"
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
            form="upload-cv-form"
            disabled={isPending || !title.trim() || !file}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            Upload
          </button>
        </>
      }
    >
      <form id="upload-cv-form" onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            PDF file
          </span>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-8 transition hover:border-[var(--color-accent)]">
            <Upload size={24} className="mb-2 text-[var(--color-muted)]" />
            <span className="text-sm font-medium">
              {file ? file.name : 'Choose a PDF file'}
            </span>
            <span className="mt-1 text-xs text-[var(--color-muted)]">Max 10 MB</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          {fileError && <p className="mt-2 text-xs text-[var(--color-danger)]">{fileError}</p>}
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Title
          </span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Backend v3"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional context for this version"
            className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
          />
          <span className="text-sm">
            Set as current CV
            <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
              Replaces the previous current version
            </span>
          </span>
        </label>
      </form>
    </Modal>
  )
}
