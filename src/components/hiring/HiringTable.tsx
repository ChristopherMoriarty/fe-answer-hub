import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { HiringBoardDetail, HiringColumn, HiringProcess, HiringResult, StepStatus } from '../../types/hiring'
import { formatShortDate } from '../../utils/format'
import {
  buildAppliedCellPayload,
  getCell,
  isAppliedColumn,
  RESULT_LABELS,
  resultTone,
  statusTone,
  STEP_STATUS_LABELS,
} from '../../utils/hiring'
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal'

const FIXED_FIELDS = ['company', 'source', 'result'] as const
type FixedField = (typeof FIXED_FIELDS)[number]

const FIXED_LABELS: Record<FixedField, string> = {
  company: 'Company',
  source: 'Source',
  result: 'Result',
}

const COL_WIDTH: Record<FixedField, number> = {
  company: 168,
  source: 148,
  result: 156,
}
const STEP_COL_WIDTH = 148
const ACTIONS_WIDTH = 48

function fixedId(field: FixedField) {
  return `fixed:${field}`
}

function isFixedColumnId(id: string): id is `fixed:${FixedField}` {
  return id === fixedId('company') || id === fixedId('source') || id === fixedId('result')
}

function parseFixedField(id: string): FixedField {
  return id.replace('fixed:', '') as FixedField
}

function defaultLayout(columns: HiringColumn[]) {
  const sorted = [...columns].sort((left, right) => left.sort_order - right.sort_order)
  const applied = sorted.find((column) => column.step_kind === 'applied')
  const otherSteps = sorted
    .filter((column) => column.step_kind !== 'applied')
    .map((column) => column.id)

  return [
    ...(applied ? [applied.id] : []),
    fixedId('company'),
    fixedId('source'),
    ...otherSteps,
    fixedId('result'),
  ]
}

function mergeLayout(saved: string[], columns: HiringColumn[]) {
  const stepIds = columns.map((column) => column.id)
  const known = new Set<string>([...FIXED_FIELDS.map(fixedId), ...stepIds])
  const layout: string[] = []

  for (const id of saved) {
    if (known.has(id) && !layout.includes(id)) layout.push(id)
  }

  for (const id of defaultLayout(columns)) {
    if (!layout.includes(id)) layout.push(id)
  }

  return normalizeLayout(layout, columns)
}

function normalizeLayout(layout: string[], columns: HiringColumn[]) {
  const appliedId = columns.find((column) => column.step_kind === 'applied')?.id
  const resultId = fixedId('result')

  let next = [...layout]

  if (next.includes(resultId)) {
    next = next.filter((id) => id !== resultId)
    next.push(resultId)
  }

  if (appliedId && next.includes(appliedId)) {
    next = next.filter((id) => id !== appliedId)
    next.unshift(appliedId)
  }

  return next
}

const LAYOUT_STORAGE_KEY = 'hiring-layout:v2'

function loadLayout(boardId: string, columns: HiringColumn[]) {
  try {
    const raw = localStorage.getItem(`${LAYOUT_STORAGE_KEY}:${boardId}`)
    if (!raw) return defaultLayout(columns)
    return mergeLayout(JSON.parse(raw) as string[], columns)
  } catch {
    return defaultLayout(columns)
  }
}

function saveLayout(boardId: string, layout: string[]) {
  localStorage.setItem(`${LAYOUT_STORAGE_KEY}:${boardId}`, JSON.stringify(layout))
}

function extractStepOrder(layout: string[]) {
  return layout.filter((id) => !isFixedColumnId(id))
}

function columnWidth(id: string) {
  if (isFixedColumnId(id)) return COL_WIDTH[parseFixedField(id)]
  return STEP_COL_WIDTH
}

interface HiringTableProps {
  board: HiringBoardDetail
  isUpdating?: boolean
  onAddColumn: () => void
  onDeleteColumn: (columnId: string) => void
  onReorderColumns: (orderedIds: string[], rollback: () => void) => void
  onAddProcess: () => void
  onUpdateProcess: (
    processId: string,
    payload: {
      company?: string
      source?: string
      result?: HiringResult
      offer_details?: string | null
      notes?: string | null
    },
  ) => void
  onDeleteProcess: (processId: string) => void
  onUpsertCell: (
    processId: string,
    columnId: string,
    payload: { status: StepStatus; event_date?: string | null },
  ) => void
}

interface CellEditorState {
  processId: string
  columnId: string
  top: number
  left: number
}

export function HiringTable({
  board,
  isUpdating = false,
  onAddColumn,
  onDeleteColumn,
  onReorderColumns,
  onAddProcess,
  onUpdateProcess,
  onDeleteProcess,
  onUpsertCell,
}: HiringTableProps) {
  const [cellEditor, setCellEditor] = useState<CellEditorState | null>(null)
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null)
  const [deleteProcessId, setDeleteProcessId] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const stepColumnMap = useMemo(
    () => new Map(board.columns.map((column) => [column.id, column])),
    [board.columns],
  )

  const [layout, setLayout] = useState(() => loadLayout(board.id, board.columns))

  useEffect(() => {
    setLayout(loadLayout(board.id, board.columns))
  }, [board.id])

  useEffect(() => {
    setLayout((current) => mergeLayout(current, board.columns))
  }, [board.columns.map((column) => column.id).join(',')])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = layout.indexOf(String(active.id))
    const newIndex = layout.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    const previous = layout
    const next = arrayMove(layout, oldIndex, newIndex)
    setLayout(next)
    saveLayout(board.id, next)

    const nextSteps = extractStepOrder(next)
    const prevSteps = extractStepOrder(previous)
    if (nextSteps.join() === prevSteps.join()) return

    onReorderColumns(nextSteps, () => {
      setLayout(previous)
      saveLayout(board.id, previous)
    })
  }

  useEffect(() => {
    if (!cellEditor) return

    const close = (event: MouseEvent) => {
      const popover = document.getElementById('hiring-cell-editor')
      if (popover?.contains(event.target as Node)) return
      setCellEditor(null)
    }

    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [cellEditor])

  const deleteColumn = board.columns.find((column) => column.id === deleteColumnId)
  const deleteProcess = board.processes.find((process) => process.id === deleteProcessId)

  const openCellEditor = (
    event: React.MouseEvent<HTMLButtonElement>,
    processId: string,
    columnId: string,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setCellEditor({
      processId,
      columnId,
      top: rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 280),
    })
  }

  const editingProcess = cellEditor
    ? board.processes.find((process) => process.id === cellEditor.processId)
    : null
  const editingColumn = cellEditor ? stepColumnMap.get(cellEditor.columnId) : undefined
  const editingCell = editingProcess && cellEditor
    ? getCell(editingProcess, cellEditor.columnId)
    : undefined

  return (
    <div ref={tableRef} className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{board.title}</h2>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            {board.processes.length} application{board.processes.length === 1 ? '' : 's'}
            {' · '}
            {board.columns.length} step{board.columns.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUpdating && <Loader2 size={16} className="animate-spin text-[var(--color-muted)]" />}
          <button
            type="button"
            onClick={onAddProcess}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <Plus size={16} />
            Add row
          </button>
          <button
            type="button"
            onClick={onAddColumn}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)]"
          >
            <Plus size={16} />
            Add column
          </button>
        </div>
      </div>

      <div className="tree-scroll min-h-0 flex-1 px-4 pb-4">
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[inset_0_1px_0_rgb(255_255_255/4%)]">
          <div className="tree-scroll overflow-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleColumnDragEnd}
            >
              <table className="w-max min-w-full table-fixed border-collapse text-base">
                <colgroup>
                  {layout.map((id) => (
                    <col key={id} style={{ width: columnWidth(id) }} />
                  ))}
                  <col style={{ width: ACTIONS_WIDTH }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                    <SortableContext items={layout} strategy={horizontalListSortingStrategy}>
                      {layout.map((id) => {
                        if (isFixedColumnId(id)) {
                          return <SortableFixedHeader key={id} field={parseFixedField(id)} />
                        }
                        const column = stepColumnMap.get(id)
                        if (!column) return null
                        return (
                          <SortableStepHeader
                            key={id}
                            column={column}
                            onDelete={() => setDeleteColumnId(id)}
                          />
                        )
                      })}
                    </SortableContext>
                    <th className="bg-[var(--color-surface-2)]" />
                  </tr>
                </thead>
                <tbody>
                  {board.processes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={layout.length + 1}
                        className="px-5 py-14 text-center text-base text-[var(--color-muted)]"
                      >
                        No applications yet. Add a row to start tracking companies.
                      </td>
                    </tr>
                  ) : (
                    board.processes.map((process) => (
                      <ProcessRow
                        key={process.id}
                        process={process}
                        layout={layout}
                        stepColumnMap={stepColumnMap}
                        onUpdate={onUpdateProcess}
                        onDelete={() => setDeleteProcessId(process.id)}
                        onOpenCell={openCellEditor}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </DndContext>
          </div>
        </div>
      </div>

      {cellEditor && editingProcess && editingColumn && (
        <CellEditorPopover
          top={cellEditor.top}
          left={cellEditor.left}
          columnTitle={editingColumn.title}
          dateOnly={isAppliedColumn(editingColumn)}
          status={(editingCell?.status ?? 'empty') as StepStatus}
          eventDate={editingCell?.event_date ?? ''}
          onClose={() => setCellEditor(null)}
          onSave={(payload) => {
            onUpsertCell(cellEditor.processId, cellEditor.columnId, payload)
            setCellEditor(null)
          }}
        />
      )}

      <DeleteConfirmModal
        open={deleteColumnId !== null}
        heading="Remove column?"
        title={deleteColumn?.title ?? ''}
        message={
          deleteColumn
            ? `“${deleteColumn.title}” and all cell values in this column will be removed.`
            : undefined
        }
        onClose={() => setDeleteColumnId(null)}
        onConfirm={() => {
          if (deleteColumnId) onDeleteColumn(deleteColumnId)
          setDeleteColumnId(null)
        }}
      />

      <DeleteConfirmModal
        open={deleteProcessId !== null}
        heading="Delete application?"
        title={deleteProcess?.company ?? ''}
        message={
          deleteProcess
            ? `“${deleteProcess.company}” will be removed from this board.`
            : undefined
        }
        onClose={() => setDeleteProcessId(null)}
        onConfirm={() => {
          if (deleteProcessId) onDeleteProcess(deleteProcessId)
          setDeleteProcessId(null)
        }}
      />
    </div>
  )
}

const headerClass =
  'border-r border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-3 text-left text-sm font-semibold text-[var(--color-muted)]'

function SortableFixedHeader({ field }: { field: FixedField }) {
  const id = fixedId(field)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <th
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.65 : 1,
      }}
      className={headerClass}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="cursor-grab rounded p-0.5 text-[var(--color-muted)] transition hover:text-[var(--color-text)] active:cursor-grabbing"
          aria-label={`Drag ${FIXED_LABELS[field]} column`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <span>{FIXED_LABELS[field]}</span>
      </div>
    </th>
  )
}

function SortableStepHeader({
  column,
  onDelete,
}: {
  column: HiringColumn
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  })

  return (
    <th
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.65 : 1,
      }}
      className={`group ${headerClass}`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="cursor-grab rounded p-0.5 text-[var(--color-muted)] transition hover:text-[var(--color-text)] active:cursor-grabbing"
          aria-label={`Drag ${column.title} column`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <span className="min-w-0 flex-1 truncate">{column.title}</span>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-0.5 text-[var(--color-muted)] opacity-0 transition hover:bg-[var(--color-surface)] hover:text-[var(--color-danger)] group-hover:opacity-100"
          aria-label={`Remove ${column.title} column`}
        >
          <X size={14} />
        </button>
      </div>
    </th>
  )
}

function ProcessRow({
  process,
  layout,
  stepColumnMap,
  onUpdate,
  onDelete,
  onOpenCell,
}: {
  process: HiringProcess
  layout: string[]
  stepColumnMap: Map<string, HiringColumn>
  onUpdate: HiringTableProps['onUpdateProcess']
  onDelete: () => void
  onOpenCell: (event: React.MouseEvent<HTMLButtonElement>, processId: string, columnId: string) => void
}) {
  const [company, setCompany] = useState(process.company)
  const [source, setSource] = useState(process.source)
  const [offerDetails, setOfferDetails] = useState(process.offer_details ?? '')

  useEffect(() => {
    setCompany(process.company)
    setSource(process.source)
    setOfferDetails(process.offer_details ?? '')
  }, [process.company, process.source, process.offer_details])

  const inputClass =
    'w-full rounded-md bg-transparent px-2 py-2 text-base outline-none transition placeholder:text-[var(--color-muted)] focus:bg-[var(--color-surface-2)]'

  return (
    <tr className="group/row border-b border-[var(--color-border)]/80 last:border-b-0 hover:bg-[var(--color-surface-2)]/35">
      {layout.map((id) => {
        if (isFixedColumnId(id)) {
          const field = parseFixedField(id)
          if (field === 'company') {
            return (
              <td key={id} className="border-r border-[var(--color-border)]/70 px-2 py-2 align-middle">
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onBlur={() => {
                    const trimmed = company.trim()
                    if (trimmed && trimmed !== process.company) {
                      onUpdate(process.id, { company: trimmed })
                    } else {
                      setCompany(process.company)
                    }
                  }}
                  className={`${inputClass} font-medium`}
                />
              </td>
            )
          }
          if (field === 'source') {
            return (
              <td key={id} className="border-r border-[var(--color-border)]/70 px-2 py-2 align-middle">
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  onBlur={() => {
                    if (source !== process.source) {
                      onUpdate(process.id, { source: source.trim() })
                    }
                  }}
                  className={inputClass}
                />
              </td>
            )
          }
          return (
            <td key={id} className="border-r border-[var(--color-border)]/70 px-2 py-2 align-middle">
              <div className="space-y-1">
                <select
                  value={process.result}
                  onChange={(e) => {
                    const result = e.target.value as HiringResult
                    onUpdate(process.id, {
                      result,
                      offer_details: result === 'offer' ? process.offer_details : null,
                    })
                  }}
                  className={`w-full rounded-md bg-transparent px-2 py-2 text-sm font-medium outline-none focus:bg-[var(--color-surface-2)] ${resultTone(process.result)}`}
                >
                  {(Object.keys(RESULT_LABELS) as HiringResult[]).map((value) => (
                    <option key={value} value={value}>
                      {RESULT_LABELS[value]}
                    </option>
                  ))}
                </select>
                {process.result === 'offer' && (
                  <input
                    value={offerDetails}
                    onChange={(e) => setOfferDetails(e.target.value)}
                    onBlur={() => {
                      const trimmed = offerDetails.trim()
                      if (trimmed !== (process.offer_details ?? '')) {
                        onUpdate(process.id, { offer_details: trimmed || null })
                      }
                    }}
                    placeholder="Offer details"
                    className={`${inputClass} text-sm`}
                  />
                )}
              </div>
            </td>
          )
        }

        const column = stepColumnMap.get(id)
        if (!column) return null

        const cell = getCell(process, column.id)
        const isApplied = isAppliedColumn(column)

        if (isApplied) {
          const hasDate = Boolean(cell?.event_date)
          return (
            <td key={id} className="border-r border-[var(--color-border)]/70 px-2 py-2 align-middle">
              <button
                type="button"
                onClick={(event) => onOpenCell(event, process.id, column.id)}
                className={`flex min-h-11 w-full items-center justify-center rounded-lg border px-2 py-2 text-center transition ${
                  hasDate
                    ? 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-2)]'
                    : 'border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/30 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-2)]/60'
                }`}
              >
                {hasDate ? formatShortDate(cell!.event_date!) : '—'}
              </button>
            </td>
          )
        }

        const status = (cell?.status ?? 'empty') as StepStatus
        const isEmpty = status === 'empty' && !cell?.event_date

        return (
          <td key={id} className="border-r border-[var(--color-border)]/70 px-2 py-2 align-middle">
            <button
              type="button"
              onClick={(event) => onOpenCell(event, process.id, column.id)}
              className={`flex min-h-11 w-full flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition ${
                isEmpty
                  ? 'border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/30 text-[var(--color-muted)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-2)]/60'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50 hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-2)]'
              }`}
            >
              <span className={`text-sm font-medium ${isEmpty ? '' : statusTone(status)}`}>
                {isEmpty ? '—' : STEP_STATUS_LABELS[status]}
              </span>
              {cell?.event_date && (
                <span className="mt-0.5 text-xs text-[var(--color-muted)]">
                  {formatShortDate(cell.event_date)}
                </span>
              )}
            </button>
          </td>
        )
      })}
      <td className="px-1 py-2 text-center align-middle">
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-[var(--color-muted)] opacity-0 transition group-hover/row:opacity-100 hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)]"
          aria-label={`Delete ${process.company}`}
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  )
}

function CellEditorPopover({
  top,
  left,
  columnTitle,
  dateOnly = false,
  status,
  eventDate,
  onClose,
  onSave,
}: {
  top: number
  left: number
  columnTitle: string
  dateOnly?: boolean
  status: StepStatus
  eventDate: string
  onClose: () => void
  onSave: (payload: { status: StepStatus; event_date?: string | null }) => void
}) {
  const [nextStatus, setNextStatus] = useState(status)
  const [nextDate, setNextDate] = useState(eventDate)

  const inputClass =
    'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-base outline-none focus:border-[var(--color-accent)]'

  return (
    <div
      id="hiring-cell-editor"
      className="fixed z-50 w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_8px_40px_rgb(0_0_0/35%)]"
      style={{ top, left }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            {dateOnly ? 'Applied' : 'Step'}
          </p>
          <p className="text-base font-medium">{columnTitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {!dateOnly && (
          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--color-muted)]">Status</span>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as StepStatus)}
              className={inputClass}
            >
              {(Object.keys(STEP_STATUS_LABELS) as StepStatus[]).map((value) => (
                <option key={value} value={value}>
                  {STEP_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm text-[var(--color-muted)]">Date</span>
          <input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            className={inputClass}
          />
        </label>

        <button
          type="button"
          onClick={() =>
            onSave(
              dateOnly
                ? buildAppliedCellPayload(nextDate || null)
                : { status: nextStatus, event_date: nextDate || null },
            )
          }
          className="w-full rounded-lg bg-[var(--color-accent)] py-2.5 text-base font-medium text-[var(--color-accent-on)] transition hover:bg-[var(--color-accent-dim)]"
        >
          Save
        </button>
      </div>
    </div>
  )
}
