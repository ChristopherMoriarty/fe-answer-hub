import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
} from 'lucide-react'
import { useRef, useState } from 'react'

import { DeleteConfirmModal } from '../ui/DeleteConfirmModal'
import { useDeleteNode } from '../../hooks/useNodes'
import type { NodeTreeItem } from '../../types/node'
import {
  resolveReorderPayload,
  willNestOnDrop,
} from '../../utils/tree'

interface NodeTreeProps {
  items: NodeTreeItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddRoot: () => void
  onAddChild: (parentId: string) => void
  onReorder: (payload: { parent_id: string | null; ordered_ids: string[] }) => void
  onDeleted: (id: string) => void
  reorderError?: string | null
}

interface TreeNodeProps {
  node: NodeTreeItem
  depth: number
  selectedId: string | null
  overId: string | null
  dragActiveId: string | null
  items: NodeTreeItem[]
  onSelect: (id: string) => void
  onAddChild: (parentId: string) => void
  onDelete: (node: { id: string; title: string }) => void
  didDragRef: React.MutableRefObject<boolean>
}

function stopDragPointer(event: React.PointerEvent) {
  event.stopPropagation()
}

function SortableTreeNode({
  node,
  depth,
  selectedId,
  overId,
  dragActiveId,
  items,
  onSelect,
  onAddChild,
  onDelete,
  didDragRef,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)

  const isSelected = selectedId === node.id
  const hasChildren = node.children.length > 0
  const isLeaf = node.has_content
  const isSection = !isLeaf
  const isDragging = dragActiveId === node.id
  const isOver = overId === node.id && !isDragging
  const willNest =
    isOver &&
    dragActiveId !== null &&
    willNestOnDrop(items, dragActiveId, node.id)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: node.id })

  const rowStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    paddingLeft: `${depth * 14 + 8}px`,
    ...(isSortableDragging
      ? {
          zIndex: 50,
          position: 'relative',
          opacity: 0.92,
        }
      : {}),
  }

  return (
    <div className="relative">
      {isOver && (
        <div
          className={`pointer-events-none absolute inset-x-2 top-0 z-10 h-0.5 rounded-full ${
            willNest ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-accent)]/70'
          }`}
        />
      )}

      <div
        ref={setNodeRef}
        style={rowStyle}
        {...listeners}
        {...attributes}
        role="button"
        tabIndex={0}
        aria-grabbed={isSortableDragging}
        onClick={() => {
          if (didDragRef.current) return
          onSelect(node.id)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect(node.id)
          }
        }}
        className={`group relative mb-0.5 flex cursor-grab touch-none select-none items-center gap-0.5 rounded-lg py-1.5 pr-2 active:cursor-grabbing ${
          isSelected
            ? 'bg-[var(--color-accent-glow)] text-[var(--color-text)] ring-1 ring-inset ring-[var(--color-accent)]/40'
            : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
        } ${
          isSortableDragging
            ? 'shadow-[0_8px_24px_rgb(0_0_0_/_35%)] ring-1 ring-[var(--color-accent)]'
            : ''
        } ${
          isOver && isSection && willNest
            ? 'ring-1 ring-[var(--color-accent)] ring-inset'
            : ''
        }`}
      >
        <span
          className="flex h-7 w-5 shrink-0 items-center justify-center"
          onPointerDown={stopDragPointer}
        >
          <button
            type="button"
            className="flex h-full w-full items-center justify-center rounded hover:text-[var(--color-text)]"
            onClick={(event) => {
              event.stopPropagation()
              if (hasChildren) setExpanded((value) => !value)
            }}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {hasChildren ? (
              expanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )
            ) : (
              <span className="w-3.5" />
            )}
          </button>
        </span>

        <span className="flex min-w-0 flex-1 items-center gap-2 py-0.5 pl-0.5 text-left text-sm">
          {isSection ? (
            expanded && hasChildren ? (
              <FolderOpen size={15} className="shrink-0" />
            ) : (
              <Folder size={15} className="shrink-0" />
            )
          ) : (
            <FileText size={15} className="shrink-0 text-[var(--color-accent)]" />
          )}
          <span className="truncate">{node.title}</span>
          {isOver && isSection && willNest && (
            <span className="ml-auto shrink-0 text-[10px] font-medium uppercase tracking-wide text-[var(--color-accent)]">
              inside
            </span>
          )}
        </span>

        <span className="invisible flex shrink-0 items-center group-hover:visible">
          {isSection && (
            <button
              type="button"
              className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)]"
              onPointerDown={stopDragPointer}
              onClick={(event) => {
                event.stopPropagation()
                onAddChild(node.id)
              }}
              aria-label="Add child"
            >
              <Plus size={14} />
            </button>
          )}
          <button
            type="button"
            className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-danger)]"
            onPointerDown={stopDragPointer}
            onClick={(event) => {
              event.stopPropagation()
              onDelete({ id: node.id, title: node.title })
            }}
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </span>
      </div>

      {hasChildren && expanded && (
        <SortableTreeList
          items={node.children}
          allItems={items}
          depth={depth + 1}
          selectedId={selectedId}
          overId={overId}
          dragActiveId={dragActiveId}
          onSelect={onSelect}
          onAddChild={onAddChild}
          onDelete={onDelete}
          didDragRef={didDragRef}
        />
      )}
    </div>
  )
}

function SortableTreeList({
  items,
  allItems,
  depth,
  selectedId,
  overId,
  dragActiveId,
  onSelect,
  onAddChild,
  onDelete,
  didDragRef,
}: {
  items: NodeTreeItem[]
  allItems: NodeTreeItem[]
  depth: number
  selectedId: string | null
  overId: string | null
  dragActiveId: string | null
  onSelect: (id: string) => void
  onAddChild: (parentId: string) => void
  onDelete: (node: { id: string; title: string }) => void
  didDragRef: React.MutableRefObject<boolean>
}) {
  return (
    <SortableContext items={items.map((node) => node.id)} strategy={verticalListSortingStrategy}>
      <div>
        {items.map((node) => (
          <SortableTreeNode
            key={node.id}
            node={node}
            depth={depth}
            selectedId={selectedId}
            overId={overId}
            dragActiveId={dragActiveId}
            items={allItems}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onDelete={onDelete}
            didDragRef={didDragRef}
          />
        ))}
      </div>
    </SortableContext>
  )
}

function parseOverId(overId: string | null): string | null {
  if (!overId) return null
  return overId.startsWith('folder:') ? overId.slice('folder:'.length) : overId
}

export function NodeTree({
  items,
  selectedId,
  onSelect,
  onAddRoot,
  onAddChild,
  onReorder,
  onDeleted,
  reorderError,
}: NodeTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const didDragRef = useRef(false)
  const deleteNode = useDeleteNode()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  )

  const handleDragStart = (_event: DragStartEvent) => {
    didDragRef.current = true
    setActiveId(String(_event.active.id))
    setOverId(null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    setOverId(null)

    const { active, over } = event
    if (over && active.id !== over.id) {
      const payload = resolveReorderPayload(items, String(active.id), String(over.id))
      if (payload) {
        onReorder(payload)
      }
    }

    requestAnimationFrame(() => {
      didDragRef.current = false
    })
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setOverId(null)
    requestAnimationFrame(() => {
      didDragRef.current = false
    })
  }

  const displayOverId = parseOverId(overId)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    await deleteNode.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
    onDeleted(deleteTarget.id)
  }

  return (
    <>
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Topics
          </p>
          <p className="text-sm text-[var(--color-text)]">Interview map</p>
        </div>
        <button
          type="button"
          onClick={onAddRoot}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2 text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          aria-label="Add root section"
        >
          <Plus size={16} />
        </button>
      </div>

      {reorderError && (
        <p className="border-b border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-danger)]">
          {reorderError}
        </p>
      )}

      {items.length === 0 ? (
        <p className="tree-scroll flex-1 px-3 py-6 text-sm leading-relaxed text-[var(--color-muted)]">
          No topics yet. Create a section like <strong>Backend</strong> to start.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="tree-scroll flex-1 overflow-y-auto p-2">
            <SortableTreeList
              items={items}
              allItems={items}
              depth={0}
              selectedId={selectedId}
              overId={displayOverId}
              dragActiveId={activeId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={setDeleteTarget}
              didDragRef={didDragRef}
            />
          </div>
        </DndContext>
      )}
    </aside>

    <DeleteConfirmModal
      open={deleteTarget !== null}
      title={deleteTarget?.title ?? ''}
      isPending={deleteNode.isPending}
      onClose={() => setDeleteTarget(null)}
      onConfirm={() => void handleDeleteConfirm()}
    />
    </>
  )
}
