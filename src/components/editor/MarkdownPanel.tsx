import { Eye, Languages, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { SectionBrowser } from './SectionBrowser'
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal'
import { Modal } from '../ui/Modal'
import {
  useDeleteNode,
  useDeleteNodeTranslation,
  useNode,
  useNodeTree,
  useUpdateNode,
  useUpsertNodeTranslation,
} from '../../hooks/useNodes'
import { DEFAULT_CONTENT_LANGUAGE, type NodeTreeItem } from '../../types/node'
import { findNode } from '../../utils/tree'

interface MarkdownPanelProps {
  nodeId: string | null
  treeItems: NodeTreeItem[]
  onSelect: (id: string) => void
  onAddChild: (parentId: string) => void
  onDeleted: () => void
}

type Tab = 'edit' | 'preview'

function pickLanguage(languages: string[], preferred: string | null): string {
  if (preferred && languages.includes(preferred)) return preferred
  if (languages.includes(DEFAULT_CONTENT_LANGUAGE)) return DEFAULT_CONTENT_LANGUAGE
  return languages[0] ?? DEFAULT_CONTENT_LANGUAGE
}

export function MarkdownPanel({
  nodeId,
  treeItems,
  onSelect,
  onAddChild,
  onDeleted,
}: MarkdownPanelProps) {
  const { data: treeData } = useNodeTree()
  const { data: node, isLoading, isError } = useNode(nodeId)
  const updateNode = useUpdateNode(nodeId ?? '')
  const upsertTranslation = useUpsertNodeTranslation(nodeId ?? '')
  const deleteTranslation = useDeleteNodeTranslation(nodeId ?? '')
  const deleteNode = useDeleteNode()

  const contentLanguages = treeData?.content_languages ?? {
    [DEFAULT_CONTENT_LANGUAGE]: 'Ukrainian',
  }

  const [tab, setTab] = useState<Tab>('preview')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [activeLanguage, setActiveLanguage] = useState(DEFAULT_CONTENT_LANGUAGE)
  const [dirty, setDirty] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addLanguageOpen, setAddLanguageOpen] = useState(false)
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null)
  const [deleteLanguage, setDeleteLanguage] = useState<string | null>(null)

  useEffect(() => {
    if (!node) return
    const nextLanguage = pickLanguage(node.languages, activeLanguage)
    const translation = node.translations.find((item) => item.language === nextLanguage)
    const nextContent = translation?.content_md ?? ''
    setTitle(node.title)
    setActiveLanguage(nextLanguage)
    setContent(nextContent)
    setDirty(false)
    setTab(nextContent.trim() ? 'preview' : 'edit')
    // Reset editor state when the selected node changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id, node?.updated_at])

  useEffect(() => {
    if (!node || dirty) return
    const translation = node.translations.find((item) => item.language === activeLanguage)
    const nextContent = translation?.content_md ?? ''
    setContent(nextContent)
    if (!dirty) {
      setTab(nextContent.trim() ? 'preview' : 'edit')
    }
  }, [activeLanguage, node, dirty])

  const availableToAdd = useMemo(() => {
    const existing = new Set(node?.languages ?? [])
    return Object.entries(contentLanguages).filter(([code]) => !existing.has(code))
  }, [contentLanguages, node?.languages])

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

  const isLeaf = node.languages.length > 0 || dirty
  const treeNode = findNode(treeItems, node.id)
  const isSection = !isLeaf && treeNode !== null

  const switchLanguage = (language: string) => {
    if (language === activeLanguage) return
    if (dirty) {
      setPendingLanguage(language)
      return
    }
    setActiveLanguage(language)
  }

  const handleStartWriting = async (language: string) => {
    setActiveLanguage(language)
    setContent('# ')
    setDirty(true)
    setTab('edit')
    setAddLanguageOpen(false)
  }

  const handleSave = async () => {
    const trimmed = content.trim()
    if (!trimmed) return

    if (title !== node.title) {
      await updateNode.mutateAsync({ title })
    }
    await upsertTranslation.mutateAsync({
      language: activeLanguage,
      payload: { content_md: trimmed },
    })
    setDirty(false)
    setTab('preview')
  }

  const handleAddLanguage = async (language: string) => {
    if (dirty) {
      setPendingLanguage(language)
      setAddLanguageOpen(false)
      return
    }
    await upsertTranslation.mutateAsync({
      language,
      payload: { content_md: '# ' },
    })
    setActiveLanguage(language)
    setContent('# ')
    setDirty(false)
    setTab('edit')
    setAddLanguageOpen(false)
  }

  const confirmLanguageSwitch = async (saveFirst: boolean) => {
    if (!pendingLanguage) return
    if (saveFirst) {
      await handleSave()
    } else {
      setDirty(false)
    }

    const exists = node.languages.includes(pendingLanguage)
    if (!exists) {
      await upsertTranslation.mutateAsync({
        language: pendingLanguage,
        payload: { content_md: '# ' },
      })
    }
    setActiveLanguage(pendingLanguage)
    setPendingLanguage(null)
  }

  const handleDeleteLanguage = async () => {
    if (!deleteLanguage) return
    const remaining = node.languages.filter((code) => code !== deleteLanguage)
    await deleteTranslation.mutateAsync(deleteLanguage)
    setDeleteLanguage(null)
    setActiveLanguage(pickLanguage(remaining, null))
    setDirty(false)
  }

  const handleDelete = async () => {
    await deleteNode.mutateAsync(node.id)
    setDeleteOpen(false)
    onDeleted()
  }

  const saving = updateNode.isPending || upsertTranslation.isPending
  const languageLabel = (code: string) =>
    contentLanguages[code] ? `${contentLanguages[code]} (${code.toUpperCase()})` : code.toUpperCase()

  return (
    <>
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] px-6 py-4">
          {tab === 'preview' && !isSection ? (
            <h1 className="answer-title min-w-0 flex-1">{title || 'Untitled'}</h1>
          ) : (
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setDirty(true)
              }}
              className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-3 py-2 text-xl font-semibold tracking-tight outline-none transition placeholder:text-[var(--color-muted)] hover:border-[var(--color-border)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)]"
              placeholder="Topic title"
            />
          )}

          {!isSection && (
            <>
              <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
                <TabButton
                  active={tab === 'preview'}
                  onClick={() => setTab('preview')}
                  icon={<Eye size={14} />}
                >
                  Preview
                </TabButton>
                <TabButton
                  active={tab === 'edit'}
                  onClick={() => setTab('edit')}
                  icon={<Pencil size={14} />}
                >
                  Edit
                </TabButton>
              </div>

              <button
                type="button"
                disabled={!dirty || saving || !content.trim()}
                onClick={() => void handleSave()}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-40"
              >
                <Save size={15} />
                Save
              </button>
            </>
          )}

          {isSection && dirty && (
            <button
              type="button"
              disabled={updateNode.isPending || !title.trim()}
              onClick={() =>
                void updateNode.mutateAsync({ title }).then(() => setDirty(false))
              }
              className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-40"
            >
              <Save size={15} />
              Save
            </button>
          )}

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-muted)] transition hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
            aria-label="Delete"
          >
            <Trash2 size={16} />
          </button>
        </header>

        {isLeaf && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-6 py-2">
            <Languages size={14} className="text-[var(--color-muted)]" />
            {node.languages.map((code) => (
              <div key={code} className="flex items-center">
                <button
                  type="button"
                  onClick={() => switchLanguage(code)}
                  className={`rounded-l-md px-3 py-1.5 text-xs font-medium transition ${
                    activeLanguage === code
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-on)]'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  } ${node.languages.length === 1 ? 'rounded-r-md' : ''}`}
                >
                  {code.toUpperCase()}
                </button>
                {node.languages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDeleteLanguage(code)}
                    className={`rounded-r-md border-l border-[var(--color-border)] px-1.5 py-1.5 text-[var(--color-muted)] transition hover:text-[var(--color-danger)] ${
                      activeLanguage === code
                        ? 'bg-[var(--color-accent)] text-[var(--color-accent-on)]/80'
                        : 'bg-[var(--color-surface-2)]'
                    }`}
                    aria-label={`Remove ${code}`}
                    title={`Remove ${languageLabel(code)}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            {availableToAdd.length > 0 && (
              <button
                type="button"
                onClick={() => setAddLanguageOpen(true)}
                className="flex items-center gap-1 rounded-md border border-dashed border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <Plus size={12} />
                Language
              </button>
            )}
            <span className="ml-auto text-xs text-[var(--color-muted)]">
              {languageLabel(activeLanguage)}
            </span>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto ${tab === 'preview' && !isSection ? 'answer-reader' : 'p-6'}`}>
          {isSection && treeNode ? (
            <SectionBrowser
              section={treeNode}
              items={treeItems}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onStartWriting={() => void handleStartWriting(DEFAULT_CONTENT_LANGUAGE)}
            />
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
            <div className="answer-reader-stage">
              <article className="markdown-body answer-card">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                ) : (
                  <p className="text-[var(--color-muted)]">Nothing to preview yet.</p>
                )}
              </article>
            </div>
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

      <DeleteConfirmModal
        open={deleteLanguage !== null}
        title={deleteLanguage ? languageLabel(deleteLanguage) : ''}
        heading="Remove language?"
        message={
          deleteLanguage
            ? `“${languageLabel(deleteLanguage)}” version will be removed. Other languages stay.`
            : undefined
        }
        isPending={deleteTranslation.isPending}
        onClose={() => setDeleteLanguage(null)}
        onConfirm={() => void handleDeleteLanguage()}
      />

      <Modal
        open={addLanguageOpen}
        onClose={() => setAddLanguageOpen(false)}
        title="Add language"
        description="Create another language version of this answer."
        footer={
          <button
            type="button"
            onClick={() => setAddLanguageOpen(false)}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
        }
      >
        <div className="grid gap-2">
          {availableToAdd.map(([code, label]) => (
            <button
              key={code}
              type="button"
              disabled={upsertTranslation.isPending}
              onClick={() => void handleAddLanguage(code)}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-left text-sm transition hover:border-[var(--color-accent)]"
            >
              <span className="font-medium">{label}</span>
              <span className="ml-2 text-[var(--color-muted)]">{code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={pendingLanguage !== null}
        onClose={() => setPendingLanguage(null)}
        title="Unsaved changes"
        description="Save the current language before switching?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPendingLanguage(null)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmLanguageSwitch(false)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm transition hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
            >
              Don&apos;t save
            </button>
            <button
              type="button"
              disabled={saving || !content.trim()}
              onClick={() => void confirmLanguageSwitch(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Save & switch
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-muted)]">
          You have unsaved edits in {activeLanguage.toUpperCase()}.
        </p>
      </Modal>
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
