import { FileText, Plus, Star } from 'lucide-react'

import type { CvItem } from '../../types/cv'
import { formatDate, formatFileSize } from '../../utils/format'

interface CvListProps {
  items: CvItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onUpload: () => void
}

export function CvList({ items, selectedId, onSelect, onUpload }: CvListProps) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          CV versions
        </p>
        <button
          type="button"
          onClick={onUpload}
          className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)]"
          aria-label="Upload CV"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="tree-scroll flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-[var(--color-muted)]">
            No CV versions yet. Upload a PDF to get started.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                    selectedId === item.id
                      ? 'bg-[var(--color-accent-glow)] text-[var(--color-text)]'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <FileText
                    size={16}
                    className={`mt-0.5 shrink-0 ${
                      selectedId === item.id
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-muted)]'
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{item.title}</span>
                      {item.is_current && (
                        <Star
                          size={12}
                          className="shrink-0 fill-[var(--color-accent)] text-[var(--color-accent)]"
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--color-muted)]">
                      {formatFileSize(item.file_size)} · {formatDate(item.created_at)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
