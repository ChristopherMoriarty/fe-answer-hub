import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, Briefcase, FileText, Loader2, LogOut, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { clearSession } from './api/session'
import { LoginScreen } from './components/auth/LoginScreen'

import { BoardList } from './components/hiring/BoardList'
import { CreateBoardModal } from './components/hiring/CreateBoardModal'
import { HiringBoardPanel } from './components/hiring/HiringBoardPanel'
import { CvList } from './components/cv/CvList'
import { CvPanel, type CvPanelHandle } from './components/cv/CvPanel'
import { UploadCvModal } from './components/cv/UploadCvModal'
import { MarkdownPanel } from './components/editor/MarkdownPanel'
import { NodeTree } from './components/tree/NodeTree'
import { CreateNodeModal, type NodeKind } from './components/ui/CreateNodeModal'
import { ThemeSwitcher } from './components/ui/ThemeSwitcher'
import { useCvList, useUploadCv } from './hooks/useCv'
import { useCreateBoard, useHiringBoards } from './hooks/useHiring'
import { useCreateNode, useNodeTree, useReorderNodes } from './hooks/useNodes'
import { useSession } from './hooks/useSession'
import { useTheme } from './hooks/useTheme'
import { DEFAULT_CONTENT_LANGUAGE } from './types/node'
import { findNode } from './utils/tree'

type AppView = 'topics' | 'cv' | 'applications'

type CreateContext =
  | { mode: 'root' }
  | { mode: 'child'; parentId: string; parentTitle: string }

export default function App() {
  const authed = useSession()
  const queryClient = useQueryClient()

  if (!authed) return <LoginScreen />

  return (
    <Workspace
      onLogout={() => {
        clearSession()
        queryClient.clear()
      }}
    />
  )
}

function Workspace({ onLogout }: { onLogout: () => void }) {
  const { theme, setTheme } = useTheme()
  const [view, setView] = useState<AppView>('topics')

  const { data: treeData, isLoading: treeLoading, isError: treeError } = useNodeTree()
  const { data: cvData, isLoading: cvLoading, isError: cvError } = useCvList()
  const { data: boardsData, isLoading: boardsLoading, isError: boardsError } = useHiringBoards()

  const createNode = useCreateNode()
  const reorderNodes = useReorderNodes()
  const uploadCv = useUploadCv()
  const createBoard = useCreateBoard()

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null)
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [createContext, setCreateContext] = useState<CreateContext | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [createBoardOpen, setCreateBoardOpen] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const cvPanelRef = useRef<CvPanelHandle>(null)

  const guardCvLeave = (proceed: () => void) => {
    cvPanelRef.current?.confirmLeave(proceed)
  }

  const handleSelectCv = (id: string) => {
    if (id === selectedCvId) return
    guardCvLeave(() => setSelectedCvId(id))
  }

  const handleChangeView = (next: AppView) => {
    if (next === view) return
    if (view === 'cv') {
      guardCvLeave(() => setView(next))
      return
    }
    setView(next)
  }

  const boards = useMemo(() => boardsData?.items ?? [], [boardsData?.items])

  useEffect(() => {
    if (view !== 'applications' || boards.length === 0) return
    if (selectedBoardId && boards.some((board) => board.id === selectedBoardId)) return
    setSelectedBoardId(boards[0].id)
  }, [view, boards, selectedBoardId])

  const handleOpenUpload = () => {
    guardCvLeave(() => setUploadOpen(true))
  }

  const parentTitle = useMemo(() => {
    if (!createContext || createContext.mode !== 'child' || !treeData?.items) return null
    return createContext.parentTitle
  }, [createContext, treeData?.items])

  const handleCreate = async ({
    title,
    kind,
    language,
  }: {
    title: string
    kind: NodeKind
    language: string
  }) => {
    if (!createContext) return

    const node = await createNode.mutateAsync({
      title,
      parent_id: createContext.mode === 'child' ? createContext.parentId : null,
      ...(kind === 'leaf'
        ? {
            language: language || DEFAULT_CONTENT_LANGUAGE,
            content_md: '#\n',
          }
        : {}),
    })

    setCreateContext(null)
    setSelectedNodeId(node.id)
  }

  const openChildModal = (parentId: string) => {
    const parent = treeData?.items ? findNode(treeData.items, parentId) : null
    setCreateContext({
      mode: 'child',
      parentId,
      parentTitle: parent?.title ?? 'Section',
    })
  }

  const handleReorder = (payload: { parent_id: string | null; ordered_ids: string[] }) => {
    setReorderError(null)
    reorderNodes.mutate(payload, {
      onError: (error) => {
        setReorderError(error.message)
      },
    })
  }

  const handleUploadCv = async (payload: {
    title: string
    file: File
    notes?: string
    is_current: boolean
  }) => {
    const cv = await uploadCv.mutateAsync(payload)
    setUploadOpen(false)
    setSelectedCvId(cv.id)
  }

  const handleCreateBoard = async (title: string) => {
    const board = await createBoard.mutateAsync({ title })
    setCreateBoardOpen(false)
    setSelectedBoardId(board.id)
  }

  const isLoading =
    view === 'topics' ? treeLoading : view === 'cv' ? cvLoading : boardsLoading
  const isError =
    view === 'topics' ? treeError : view === 'cv' ? cvError : boardsError

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/60 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-on)]">
            <Zap size={16} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Answer Hub</h1>
            <p className="text-[11px] text-[var(--color-muted)]">Interview prep workspace</p>
          </div>
        </div>

        <nav className="ml-4 flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          <ViewTab
            active={view === 'topics'}
            onClick={() => handleChangeView('topics')}
            icon={<BookOpen size={14} />}
          >
            Topics
          </ViewTab>
          <ViewTab
            active={view === 'cv'}
            onClick={() => handleChangeView('cv')}
            icon={<FileText size={14} />}
          >
            CV
          </ViewTab>
          <ViewTab
            active={view === 'applications'}
            onClick={() => handleChangeView('applications')}
            icon={<Briefcase size={14} />}
          >
            Applications
          </ViewTab>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitcher theme={theme} onChange={setTheme} />
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-[var(--color-muted)]">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-[var(--color-danger)]">Cannot reach API</p>
            <p className="text-sm text-[var(--color-muted)]">
              Make sure backend is running on <code className="font-mono">localhost:8000</code>
            </p>
          </div>
        ) : view === 'topics' ? (
          <>
            <NodeTree
              items={treeData?.items ?? []}
              selectedId={selectedNodeId}
              onSelect={setSelectedNodeId}
              onAddRoot={() => setCreateContext({ mode: 'root' })}
              onAddChild={openChildModal}
              onReorder={handleReorder}
              onDeleted={(id) => {
                if (selectedNodeId === id) setSelectedNodeId(null)
              }}
              reorderError={reorderError}
            />
            <MarkdownPanel
              nodeId={selectedNodeId}
              treeItems={treeData?.items ?? []}
              onSelect={setSelectedNodeId}
              onAddChild={openChildModal}
              onDeleted={() => setSelectedNodeId(null)}
            />
          </>
        ) : view === 'cv' ? (
          <>
            <CvList
              items={cvData?.items ?? []}
              selectedId={selectedCvId}
              onSelect={handleSelectCv}
              onUpload={handleOpenUpload}
            />
            <CvPanel ref={cvPanelRef} cvId={selectedCvId} onDeleted={() => setSelectedCvId(null)} />
          </>
        ) : (
          <>
            <BoardList
              items={boards}
              selectedId={selectedBoardId}
              onSelect={setSelectedBoardId}
              onCreate={() => setCreateBoardOpen(true)}
            />
            {selectedBoardId ? (
              <HiringBoardPanel
                boardId={selectedBoardId}
                onBoardDeleted={() => setSelectedBoardId(null)}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                <Briefcase size={32} className="text-[var(--color-muted)]" />
                <p className="text-sm text-[var(--color-muted)]">
                  Create a board to track interview applications.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <CreateNodeModal
        open={createContext !== null}
        parentTitle={createContext?.mode === 'child' ? parentTitle : null}
        allowLeaf={createContext?.mode === 'child'}
        contentLanguages={treeData?.content_languages}
        isPending={createNode.isPending}
        onClose={() => setCreateContext(null)}
        onSubmit={(payload) => void handleCreate(payload)}
      />

      <UploadCvModal
        open={uploadOpen}
        isPending={uploadCv.isPending}
        onClose={() => setUploadOpen(false)}
        onSubmit={(payload) => void handleUploadCv(payload)}
      />

      <CreateBoardModal
        open={createBoardOpen}
        isPending={createBoard.isPending}
        onClose={() => setCreateBoardOpen(false)}
        onSubmit={(title) => void handleCreateBoard(title)}
      />
    </div>
  )
}

function ViewTab({
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
