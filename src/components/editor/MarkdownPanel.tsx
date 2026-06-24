import { Eye, Loader2, Pencil, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { DeleteConfirmModal } from '../ui/DeleteConfirmModal'
import { useDeleteNode, useNode, useUpdateNode } from '../../hooks/useNodes'

interface MarkdownPanelProps {
  nodeId: string | null
  onDeleted: () => void
}

type Tab = 'edit' | 'preview'

export function MarkdownPanel({ nodeId, onDeleted }: MarkdownPanelProps) {
  const { data: node, isLoading, isError } = useNode(nodeId)
  const updateNode = useUpdateNode(nodeId ?? '')
  const deleteNode = useDeleteNode()

  const [tab, setTab] = useState<Tab>('edit')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!node) return
    setTitle(node.title)
    setContent(node.content_md ?? '')
    setDirty(false)
  }, [node])

  if (!nodeId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-10 shadow-[0_0_60px_var(--color-accent-glow)]">
          <p className="text-5xl">📚</p>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Pick a topic</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
            Select a leaf in the tree to read or edit your interview answer. Sections group
            topics — only leaves hold markdown.
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

  if (isError || !node) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--color-danger)]">
        Failed to load topic
      </div>
    )
  }

  const isLeaf = node.content_md !== null || dirty

  const handleSave = async () => {
    await updateNode.mutateAsync({
      title,
      content_md: content || null,
    })
    setDirty(false)
  }

  const handleDelete = async () => {
    await deleteNode.mutateAsync(node.id)
    setDeleteOpen(false)
    onDeleted()
  }

  return (
    <>
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] px-6 py-4">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setDirty(true)
          }}
          className="min-w-0 flex-1 bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-[var(--color-muted)]"
          placeholder="Topic title"
        />

        <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          <TabButton active={tab === 'edit'} onClick={() => setTab('edit')} icon={<Pencil size={14} />}>
            Edit
          </TabButton>
          <TabButton active={tab === 'preview'} onClick={() => setTab('preview')} icon={<Eye size={14} />}>
            Preview
          </TabButton>
        </div>

        <button
          type="button"
          disabled={!dirty || updateNode.isPending}
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
          aria-label="Delete"
        >
          <Trash2 size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {!isLeaf && !dirty ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              This is a section. Add subtopics with <strong>+</strong> in the sidebar, or start
              writing to turn it into an answer.
            </p>
            <button
              type="button"
              className="mt-4 text-sm text-[var(--color-accent)] underline-offset-4 hover:underline"
              onClick={() => {
                setContent('# ')
                setDirty(true)
                setTab('edit')
              }}
            >
              Start writing answer
            </button>
          </div>
        ) : tab === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setDirty(true)
            }}
            className="h-full min-h-[60vh] w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 font-mono text-sm leading-relaxed text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            placeholder="Write your answer in Markdown..."
            spellCheck={false}
          />
        ) : (
          <article className="markdown-body max-w-3xl">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p className="text-[var(--color-muted)]">Nothing to preview yet.</p>
            )}
          </article>
        )}
      </div>
    </section>

    <DeleteConfirmModal
      open={deleteOpen}
      title={node.title}
      isPending={deleteNode.isPending}
      onClose={() => setDeleteOpen(false)}
      onConfirm={() => void handleDelete()}
    />
    </>
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
