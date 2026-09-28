import { Download, Eye, FileText, Loader2, Save, Star, Trash2 } from 'lucide-react'
import {
  forwardRef,
  lazy,
  Suspense,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { cvApi } from '../../api/cv'
import { useCv, useDeleteCv, useUpdateCv } from '../../hooks/useCv'
import { formatDate, formatFileSize } from '../../utils/format'
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal'
import { UnsavedChangesModal } from '../ui/UnsavedChangesModal'

const CvPdfPreview = lazy(() =>
  import('./CvPdfPreview').then((module) => ({ default: module.CvPdfPreview })),
)

export interface CvPanelHandle {
  confirmLeave: (proceed: () => void) => void
}

interface CvPanelProps {
  cvId: string | null
  onDeleted: () => void
  onDirtyChange?: (dirty: boolean) => void
}

type Tab = 'preview' | 'details'

export const CvPanel = forwardRef<CvPanelHandle, CvPanelProps>(function CvPanel(
  { cvId, onDeleted, onDirtyChange },
  ref,
) {
  const { data: cv, isLoading, isError } = useCv(cvId)
  const updateCv = useUpdateCv(cvId ?? '')
  const deleteCv = useDeleteCv()

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [tab, setTab] = useState<Tab>('details')
  const [dirty, setDirty] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [unsavedOpen, setUnsavedOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const cvRef = useRef(cv)
  cvRef.current = cv

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  useEffect(() => {
    if (!dirty) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    if (!cv) return
    setTitle(cv.title)
    setNotes(cv.notes ?? '')
    setDirty(false)
    setTab('details')
    setUnsavedOpen(false)
    setPendingAction(null)
  }, [cv])

  useImperativeHandle(ref, () => ({
    confirmLeave(proceed) {
      if (!dirty) {
        proceed()
        return
      }
      setPendingAction(() => proceed)
      setUnsavedOpen(true)
    },
  }))

  const markDirty = () => setDirty(true)

  const resetDraft = () => {
    const current = cvRef.current
    if (current) {
      setTitle(current.title)
      setNotes(current.notes ?? '')
    }
    setDirty(false)
  }

  const completePending = () => {
    const action = pendingAction
    setPendingAction(null)
    setUnsavedOpen(false)
    action?.()
  }

  const guardAction = (action: () => void) => {
    if (!dirty) {
      action()
      return
    }
    setPendingAction(() => action)
    setUnsavedOpen(true)
  }

  const handleSave = async () => {
    await updateCv.mutateAsync({
      title,
      notes: notes.trim() || null,
    })
    setDirty(false)
  }

  if (!cvId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-10 shadow-[0_0_60px_var(--color-accent-glow)]">
          <p className="text-5xl">📄</p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Pick a CV version</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
            Select a version from the sidebar to view metadata, download the PDF, or mark it as
            your current resume.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--color-muted)]">
        <Loader2 className="animate-spin" size={28} />
      </div>
    )
  }

  if (isError || !cv) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--color-danger)]">
        Failed to load CV version
      </div>
    )
  }

  const handleSetCurrent = async () => {
    if (cv.is_current) return
    await updateCv.mutateAsync({ is_current: true })
  }

  const handleUnsetCurrent = async () => {
    if (!cv.is_current) return
    await updateCv.mutateAsync({ is_current: false })
  }

  const handleDelete = async () => {
    await deleteCv.mutateAsync(cv.id)
    setDeleteOpen(false)
    onDeleted()
  }

  const handleSaveAndContinue = async () => {
    await handleSave()
    completePending()
  }

  const handleDiscardAndContinue = () => {
    resetDraft()
    completePending()
  }

  return (
    <>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] px-6 py-4">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              markDirty()
            }}
            className="min-w-0 flex-1 bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-[var(--color-muted)]"
            placeholder="CV title"
          />

          {cv.is_current ? (
            <button
              type="button"
              disabled={updateCv.isPending}
              onClick={() => void handleUnsetCurrent()}
              title="Remove current flag"
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-glow)] px-3 py-1 text-xs font-medium text-[var(--color-accent)] transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-muted)] disabled:opacity-50"
            >
              <Star size={12} className="fill-current" />
              Current
            </button>
          ) : (
            <button
              type="button"
              disabled={updateCv.isPending}
              onClick={() => void handleSetCurrent()}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
            >
              <Star size={14} />
              Set current
            </button>
          )}

          <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            <TabButton
              active={tab === 'details'}
              onClick={() => {
                if (tab === 'details') return
                guardAction(() => setTab('details'))
              }}
              icon={<FileText size={14} />}
            >
              Details
            </TabButton>
            <TabButton
              active={tab === 'preview'}
              onClick={() => {
                if (tab === 'preview') return
                guardAction(() => setTab('preview'))
              }}
              icon={<Eye size={14} />}
            >
              Preview
            </TabButton>
          </div>

          <button
            type="button"
            onClick={() => void cvApi.download(cv.id, cv.original_filename)}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <Download size={15} />
            Download
          </button>

          <button
            type="button"
            disabled={!dirty || updateCv.isPending}
            onClick={() => void handleSave()}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-40"
          >
            <Save size={15} />
            Save
          </button>

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-muted)] transition hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
            aria-label="Delete CV"
          >
            <Trash2 size={16} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          {tab === 'preview' ? (
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center text-[var(--color-muted)]">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              }
            >
              <CvPdfPreview cvId={cv.id} title={cv.title} filename={cv.original_filename} />
            </Suspense>
          ) : (
            <div className="mx-auto w-full max-w-2xl space-y-6 overflow-y-auto">
              <dl className="grid grid-cols-2 gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
                <MetaItem label="Filename" value={cv.original_filename} />
                <MetaItem label="Size" value={formatFileSize(cv.file_size)} />
                <MetaItem label="Uploaded" value={formatDate(cv.created_at)} />
                <MetaItem label="Updated" value={formatDate(cv.updated_at)} />
              </dl>

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  Notes
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value)
                    markDirty()
                  }}
                  rows={6}
                  placeholder="What changed in this version?"
                  className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed outline-none focus:border-[var(--color-accent)]"
                />
              </label>
            </div>
          )}
        </div>
      </section>

      <DeleteConfirmModal
        open={deleteOpen}
        title={cv.title}
        heading="Delete CV version?"
        message={`“${cv.title}” and its PDF will be removed permanently.`}
        isPending={deleteCv.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />

      <UnsavedChangesModal
        open={unsavedOpen}
        isPending={updateCv.isPending}
        onClose={() => {
          setUnsavedOpen(false)
          setPendingAction(null)
        }}
        onDiscard={handleDiscardAndContinue}
        onSave={() => void handleSaveAndContinue()}
      />
    </>
  )
})

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="mt-1 truncate font-medium">{value}</dd>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
