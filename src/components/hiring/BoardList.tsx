import { Briefcase, Plus } from 'lucide-react'

import { ResizableSidebar } from '../ui/ResizableSidebar'
import type { HiringBoardSummary } from '../../types/hiring'

interface BoardListProps {
  items: HiringBoardSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
}

export function BoardList({ items, selectedId, onSelect, onCreate }: BoardListProps) {
  return (
    <ResizableSidebar>
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Applications
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)]"
          aria-label="New board"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="tree-scroll flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-[var(--color-muted)]">
            No boards yet. Create one for a role or stack, e.g. Python.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                    selectedId === item.id
                      ? 'bg-[var(--color-accent-glow)] text-[var(--color-text)]'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <Briefcase
                    size={16}
                    className={`shrink-0 ${
                      selectedId === item.id
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-muted)]'
                    }`}
                  />
                  <span className="truncate text-sm font-medium">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ResizableSidebar>
  )
}
