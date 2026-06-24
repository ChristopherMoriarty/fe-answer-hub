import { FileText, Folder, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Modal } from '../ui/Modal'

export type NodeKind = 'section' | 'leaf'

interface CreateNodeModalProps {
  open: boolean
  parentTitle?: string | null
  allowLeaf?: boolean
  isPending?: boolean
  onClose: () => void
  onSubmit: (payload: { title: string; kind: NodeKind }) => void
}

export function CreateNodeModal({
  open,
  parentTitle,
  allowLeaf = true,
  isPending = false,
  onClose,
  onSubmit,
}: CreateNodeModalProps) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<NodeKind>('section')

  useEffect(() => {
    if (!open) return
    setTitle('')
    setKind(allowLeaf ? 'leaf' : 'section')
  }, [open, allowLeaf])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit({ title: trimmed, kind: allowLeaf ? kind : 'section' })
  }

  const description = parentTitle
    ? `Inside “${parentTitle}”`
    : 'Top-level section for grouping topics'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={parentTitle ? 'New topic' : 'New section'}
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
            type="submit"
            form="create-node-form"
            disabled={isPending || !title.trim()}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            Create
          </button>
        </>
      }
    >
      <form id="create-node-form" onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Name
          </span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={parentTitle ? 'e.g. Data types' : 'e.g. Backend'}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />
        </label>

        {allowLeaf && (
          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Type
            </span>
            <div className="grid grid-cols-2 gap-2">
              <KindOption
                active={kind === 'section'}
                onClick={() => setKind('section')}
                icon={<Folder size={18} />}
                label="Section"
                hint="Groups subtopics"
              />
              <KindOption
                active={kind === 'leaf'}
                onClick={() => setKind('leaf')}
                icon={<FileText size={18} />}
                label="Answer"
                hint="Markdown content"
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}

function KindOption({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-bright)]'
      }`}
    >
      <div className={`mb-2 ${active ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}>
        {icon}
      </div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-0.5 text-xs text-[var(--color-muted)]">{hint}</p>
    </button>
  )
}
