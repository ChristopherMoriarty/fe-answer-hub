export type HiringResult =
  | 'in_progress'
  | 'rejected'
  | 'withdrawn'
  | 'ghosted'
  | 'on_hold'
  | 'offer'

export type StepStatus =
  | 'empty'
  | 'scheduled'
  | 'passed'
  | 'failed'
  | 'skipped'
  | 'cancelled'

export interface HiringBoardSummary {
  id: string
  title: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface HiringBoardListResponse {
  items: HiringBoardSummary[]
}

export interface HiringColumn {
  id: string
  step_kind: string
  custom_title: string | null
  title: string
  sort_order: number
}

export interface HiringStepValue {
  column_id: string
  status: StepStatus
  event_date: string | null
}

export interface HiringProcess {
  id: string
  company: string
  source: string
  result: HiringResult
  offer_details: string | null
  notes: string | null
  sort_order: number
  cells: HiringStepValue[]
}

export interface HiringBoardDetail {
  id: string
  title: string
  sort_order: number
  columns: HiringColumn[]
  processes: HiringProcess[]
  step_kinds: Record<string, string>
}

export interface CreateBoardPayload {
  title: string
}

export interface AddColumnPayload {
  step_kind: string
  custom_title?: string
}

export interface CreateProcessPayload {
  company: string
  source?: string
  result?: HiringResult
  offer_details?: string | null
  notes?: string | null
}

export interface UpdateProcessPayload {
  company?: string
  source?: string
  result?: HiringResult
  offer_details?: string | null
  notes?: string | null
}

export interface UpsertCellPayload {
  status: StepStatus
  event_date?: string | null
}
