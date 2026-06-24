import { Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  useAddColumn,
  useCreateProcess,
  useDeleteBoard,
  useDeleteColumn,
  useDeleteProcess,
  useHiringBoard,
  useReorderColumns,
  useUpdateProcess,
  useUpsertCell,
} from '../../hooks/useHiring'
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal'
import { AddColumnModal } from './AddColumnModal'
import { AddProcessModal } from './AddProcessModal'
import { HiringTable } from './HiringTable'

interface HiringBoardPanelProps {
  boardId: string
  onBoardDeleted: () => void
}

export function HiringBoardPanel({ boardId, onBoardDeleted }: HiringBoardPanelProps) {
  const { data: board, isLoading, isError } = useHiringBoard(boardId)
  const addColumn = useAddColumn(boardId)
  const deleteColumn = useDeleteColumn(boardId)
  const reorderColumns = useReorderColumns(boardId)
  const createProcess = useCreateProcess(boardId)
  const updateProcess = useUpdateProcess(boardId)
  const deleteProcess = useDeleteProcess(boardId)
  const upsertCell = useUpsertCell(boardId)
  const deleteBoard = useDeleteBoard()

  const [addColumnOpen, setAddColumnOpen] = useState(false)
  const [addProcessOpen, setAddProcessOpen] = useState(false)
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false)

  const isMutating =
    addColumn.isPending ||
    deleteColumn.isPending ||
    reorderColumns.isPending ||
    createProcess.isPending ||
    updateProcess.isPending ||
    deleteProcess.isPending ||
    upsertCell.isPending

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--color-muted)]">
        <Loader2 className="animate-spin" size={28} />
      </div>
    )
  }

  if (isError || !board) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-danger)]">
        Failed to load board
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--color-bg)]">
      <div className="flex justify-end px-5 py-2">
        <button
          type="button"
          onClick={() => setDeleteBoardOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)]"
        >
          <Trash2 size={14} />
          Delete board
        </button>
      </div>

      <HiringTable
        board={board}
        isUpdating={isMutating}
        onAddColumn={() => setAddColumnOpen(true)}
        onDeleteColumn={(columnId) => deleteColumn.mutate(columnId)}
        onReorderColumns={(orderedIds, rollback) =>
          reorderColumns.mutate(orderedIds, { onError: rollback })
        }
        onAddProcess={() => setAddProcessOpen(true)}
        onUpdateProcess={(processId, payload) =>
          updateProcess.mutate({ processId, payload })
        }
        onDeleteProcess={(processId) => deleteProcess.mutate(processId)}
        onUpsertCell={(processId, columnId, payload) =>
          upsertCell.mutate({ processId, columnId, payload })
        }
      />

      <AddColumnModal
        open={addColumnOpen}
        stepKinds={board.step_kinds}
        isPending={addColumn.isPending}
        onClose={() => setAddColumnOpen(false)}
        onSubmit={(payload) => {
          addColumn.mutate(payload, {
            onSuccess: () => setAddColumnOpen(false),
          })
        }}
      />

      <AddProcessModal
        open={addProcessOpen}
        isPending={createProcess.isPending}
        onClose={() => setAddProcessOpen(false)}
        onSubmit={(payload) => {
          createProcess.mutate(payload, {
            onSuccess: () => setAddProcessOpen(false),
          })
        }}
      />

      <DeleteConfirmModal
        open={deleteBoardOpen}
        heading="Delete board?"
        title={board.title}
        message={`“${board.title}” and all applications in it will be removed permanently.`}
        isPending={deleteBoard.isPending}
        onClose={() => setDeleteBoardOpen(false)}
        onConfirm={() => {
          deleteBoard.mutate(boardId, {
            onSuccess: () => {
              setDeleteBoardOpen(false)
              onBoardDeleted()
            },
          })
        }}
      />
    </div>
  )
}
