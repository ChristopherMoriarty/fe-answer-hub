import type { HiringColumn, HiringProcess, HiringResult, StepStatus } from '../types/hiring'

export const RESULT_LABELS: Record<HiringResult, string> = {
  in_progress: 'In progress',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  ghosted: 'Ghosted',
  on_hold: 'On hold',
  offer: 'Offer',
}

export const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  empty: '—',
  scheduled: 'Scheduled',
  passed: 'Passed',
  failed: 'Failed',
  skipped: 'Skipped',
  cancelled: 'Cancelled',
}

export function getCell(process: HiringProcess, columnId: string) {
  return process.cells.find((cell) => cell.column_id === columnId)
}

export function isAppliedColumn(column: Pick<HiringColumn, 'step_kind'>) {
  return column.step_kind === 'applied'
}

export function buildAppliedCellPayload(eventDate: string | null) {
  return {
    status: (eventDate ? 'passed' : 'empty') as StepStatus,
    event_date: eventDate,
  }
}

export function statusTone(status: StepStatus): string {
  switch (status) {
    case 'passed':
      return 'text-[var(--color-success)]'
    case 'failed':
      return 'text-[var(--color-danger)]'
    case 'scheduled':
      return 'text-[var(--color-accent)]'
    default:
      return 'text-[var(--color-muted)]'
  }
}

export function resultTone(result: HiringResult): string {
  switch (result) {
    case 'offer':
      return 'text-[var(--color-success)]'
    case 'rejected':
    case 'ghosted':
      return 'text-[var(--color-danger)]'
    case 'on_hold':
      return 'text-[var(--color-accent)]'
    default:
      return 'text-[var(--color-muted)]'
  }
}
