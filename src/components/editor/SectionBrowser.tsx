import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Languages,
  Plus,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import type { NodeTreeItem } from '../../types/node'
import { findNode, findParentId } from '../../utils/tree'

interface SectionBrowserProps {
  section: NodeTreeItem
  items: NodeTreeItem[]
  onSelect: (id: string) => void
  onAddChild: (parentId: string) => void
  onStartWriting: () => void
}

function buildBreadcrumbs(items: NodeTreeItem[], nodeId: string): NodeTreeItem[] {
  const path: NodeTreeItem[] = []
  let currentId: string | null = nodeId

  while (currentId) {
    const node = findNode(items, currentId)
    if (!node) break
    path.unshift(node)
    const parentId = findParentId(items, currentId)
    currentId = parentId === undefined ? null : parentId
  }

  return path
}

function countDescendants(node: NodeTreeItem): { answers: number; sections: number } {
  let answers = 0
  let sections = 0

  for (const child of node.children) {
    if (child.has_content) {
      answers += 1
    } else {
      sections += 1
      const nested = countDescendants(child)
      answers += nested.answers
      sections += nested.sections
    }
  }

  return { answers, sections }
}

function TreeBranch({
  node,
  depth,
  onSelect,
  defaultExpanded = true,
}: {
  node: NodeTreeItem
  depth: number
  onSelect: (id: string) => void
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const isAnswer = node.has_content
  const hasChildren = node.children.length > 0

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [node.id, defaultExpanded])

  return (
    <li>
      <div
        className="group flex items-center gap-1 rounded-xl transition hover:bg-[var(--color-surface-2)]"
        style={{ paddingLeft: `${depth * 1.1 + 0.5}rem` }}
      >
        {isAnswer || !hasChildren ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[var(--color-muted)] opacity-40">
            {isAnswer ? null : <span className="h-px w-3 bg-[var(--color-border-bright)]" />}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-left"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isAnswer
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-on)]'
                : 'bg-[var(--color-surface)] text-[var(--color-muted)] group-hover:text-[var(--color-accent)]'
            }`}
          >
            {isAnswer ? (
              <FileText size={15} />
            ) : expanded ? (
              <FolderOpen size={15} />
            ) : (
              <Folder size={15} />
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium tracking-tight">
              {node.title}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
              <span>{isAnswer ? 'Answer' : 'Section'}</span>
              {!isAnswer && hasChildren && (
                <span>· {node.children.length} direct</span>
              )}
              {isAnswer && node.languages.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Languages size={10} />
                  {node.languages.map((code) => code.toUpperCase()).join(' · ')}
                </span>
              )}
            </span>
          </span>

          <ChevronRight
            size={14}
            className="shrink-0 text-[var(--color-muted)] opacity-0 transition group-hover:opacity-100"
          />
        </button>
      </div>

      {!isAnswer && hasChildren && expanded && (
        <ul className="relative">
          <div
            className="pointer-events-none absolute bottom-2 top-0 w-px bg-[var(--color-border)]"
            style={{ left: `${depth * 1.1 + 1.35}rem` }}
          />
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function SectionBrowser({
  section,
  items,
  onSelect,
  onAddChild,
  onStartWriting,
}: SectionBrowserProps) {
  const breadcrumbs = buildBreadcrumbs(items, section.id)
  const children = section.children
  const canBecomeAnswer = children.length === 0
  const stats = countDescendants(section)

  return (
    <div className="section-browser mx-auto w-full max-w-4xl">
      <nav className="mb-5 flex flex-wrap items-center gap-1 text-sm text-[var(--color-muted)]">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <span key={crumb.id} className="flex items-center gap-1">
              {index > 0 && <ChevronRight size={14} className="opacity-40" />}
              {isLast ? (
                <span className="rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 font-medium text-[var(--color-text)]">
                  {crumb.title}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(crumb.id)}
                  className="rounded-md px-1.5 py-0.5 transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                >
                  {crumb.title}
                </button>
              )}
            </span>
          )
        })}
      </nav>

      <div className="section-hero mb-5 overflow-hidden rounded-3xl border border-[var(--color-border)]">
        <div className="relative flex flex-wrap items-end justify-between gap-5 px-6 py-6 sm:px-7">
          <div className="relative z-10 min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] backdrop-blur">
              <FolderOpen size={13} className="text-[var(--color-accent)]" />
              Folder tree
            </div>
            <h2 className="text-3xl font-bold tracking-tight">{section.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <span className="rounded-full bg-[var(--color-surface)]/80 px-2.5 py-1">
                {children.length} direct
              </span>
              {stats.sections > 0 && (
                <span className="rounded-full bg-[var(--color-surface)]/80 px-2.5 py-1">
                  {stats.sections} nested folder{stats.sections === 1 ? '' : 's'}
                </span>
              )}
              {stats.answers > 0 && (
                <span className="rounded-full bg-[var(--color-surface)]/80 px-2.5 py-1">
                  {stats.answers} answer{stats.answers === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAddChild(section.id)}
            className="relative z-10 flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent-on)] shadow-[0_10px_30px_var(--color-accent-glow)] transition hover:bg-[var(--color-accent-dim)]"
          >
            <Plus size={16} />
            Add topic
          </button>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-accent)]">
            <Folder size={26} />
          </div>
          <h3 className="mt-5 text-lg font-semibold tracking-tight">Empty section</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
            Create a subtopic to build the tree, or turn this folder into an answer page.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onAddChild(section.id)}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Add topic
            </button>
            {canBecomeAnswer && (
              <button
                type="button"
                onClick={onStartWriting}
                className="rounded-xl bg-[var(--color-accent-glow)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-on)]"
              >
                Start writing answer
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/70">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Contents
            </p>
            <button
              type="button"
              onClick={() => onAddChild(section.id)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)]"
            >
              <Plus size={13} />
              Add here
            </button>
          </div>

          <ul className="space-y-0.5 p-2 sm:p-3">
            {children.map((child) => (
              <TreeBranch
                key={child.id}
                node={child}
                depth={0}
                onSelect={onSelect}
                defaultExpanded
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
