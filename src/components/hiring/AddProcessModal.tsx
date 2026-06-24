import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { HiringResult } from '../../types/hiring'
import { RESULT_LABELS } from '../../utils/hiring'
import { Modal } from '../ui/Modal'

interface AddProcessModalProps {
  open: boolean
  isPending?: boolean
  onClose: () => void
  onSubmit: (payload: {
    company: string
    source: string
    result: HiringResult
    offer_details?: string
    notes?: string
  }) => void
}

export function AddProcessModal({
  open,
  isPending = false,
  onClose,
  onSubmit,
}: AddProcessModalProps) {
  const [company, setCompany] = useState('')
  const [source, setSource] = useState('')
  const [result, setResult] = useState<HiringResult>('in_progress')
  const [offerDetails, setOfferDetails] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setCompany('')
    setSource('')
    setResult('in_progress')
    setOfferDetails('')
    setNotes('')
  }, [open])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedCompany = company.trim()
    if (!trimmedCompany) return
    onSubmit({
      company: trimmedCompany,
      source: source.trim(),
      result,
      offer_details: result === 'offer' ? offerDetails.trim() || undefined : undefined,
      notes: notes.trim() || undefined,
    })
  }

  const inputClass =
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New application"
      description="Add a company to track through your interview pipeline."
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
            form="add-process-form"
            disabled={isPending || !company.trim()}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            Add row
          </button>
        </>
      }
    >
      <form id="add-process-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Company
          </span>
          <input
            autoFocus
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Source
          </span>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. LinkedIn, referral"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Result
          </span>
          <select
            value={result}
            onChange={(e) => setResult(e.target.value as HiringResult)}
            className={inputClass}
          >
            {(Object.keys(RESULT_LABELS) as HiringResult[]).map((value) => (
              <option key={value} value={value}>
                {RESULT_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        {result === 'offer' && (
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Offer details
            </span>
            <input
              value={offerDetails}
              onChange={(e) => setOfferDetails(e.target.value)}
              placeholder="e.g. $180k base + equity"
              className={inputClass}
            />
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes"
            className={`${inputClass} resize-none`}
          />
        </label>
      </form>
    </Modal>
  )
}
