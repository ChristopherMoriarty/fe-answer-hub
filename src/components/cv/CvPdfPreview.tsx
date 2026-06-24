import { Download, ExternalLink, FileText, Loader2, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

import { cvApi } from '../../api/cv'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

interface CvPdfPreviewProps {
  cvId: string
  title: string
  filename: string
}

const MIN_ZOOM = 0.6
const MAX_ZOOM = 1.8
const ZOOM_STEP = 0.15

export function CvPdfPreview({ cvId, title, filename }: CvPdfPreviewProps) {
  const previewUrl = cvApi.previewUrl(cvId)
  const downloadUrl = cvApi.downloadUrl(cvId)
  const stageRef = useRef<HTMLDivElement>(null)

  const [numPages, setNumPages] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [baseWidth, setBaseWidth] = useState(720)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setNumPages(0)
    setZoom(1)
    setLoading(true)
    setError(null)
  }, [cvId])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const updateWidth = () => {
      setBaseWidth(Math.max(320, stage.clientWidth - 64))
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const pageWidth = baseWidth * zoom
  const pages = numPages > 0 ? Array.from({ length: numPages }, (_, index) => index + 1) : []

  return (
    <div className="cv-preview-shell mx-auto flex h-full min-h-0 w-full max-w-5xl flex-1 flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-glow)] text-[var(--color-accent)]">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-[var(--color-muted)]">{filename}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {numPages > 0 && (
            <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium tabular-nums text-[var(--color-muted)]">
              {numPages} {numPages === 1 ? 'page' : 'pages'}
            </span>
          )}

          <ToolbarGroup>
            <ToolbarButton
              label="Zoom out"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
            >
              <ZoomOut size={16} />
            </ToolbarButton>
            <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums text-[var(--color-muted)]">
              {Math.round(zoom * 100)}%
            </span>
            <ToolbarButton
              label="Zoom in"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
            >
              <ZoomIn size={16} />
            </ToolbarButton>
          </ToolbarGroup>

          <a href={downloadUrl} className="cv-toolbar-link" download={filename}>
            <Download size={14} />
            Download
          </a>

          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="cv-toolbar-link">
            <ExternalLink size={14} />
            Open
          </a>
        </div>
      </div>

      <div
        ref={stageRef}
        className="cv-preview-stage relative min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[var(--color-border)] p-4 sm:p-8"
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--color-surface)]/90 backdrop-blur-sm">
            <Loader2 className="animate-spin text-[var(--color-accent)]" size={28} />
            <p className="text-sm text-[var(--color-muted)]">Rendering PDF…</p>
          </div>
        )}

        {error && (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-[var(--color-danger)]">Could not render PDF</p>
            <p className="max-w-sm text-sm text-[var(--color-muted)]">{error}</p>
          </div>
        )}

        {!error && (
          <div className="cv-preview-canvas mx-auto flex w-fit flex-col items-center">
            <Document
              key={cvId}
              file={previewUrl}
              loading={null}
              onLoadSuccess={({ numPages: total }) => {
                setNumPages(total)
                setLoading(false)
              }}
              onLoadError={(loadError) => {
                setError(loadError.message)
                setLoading(false)
              }}
            >
              {pages.map((pageNumber) => (
                <Page
                  key={`page-${pageNumber}`}
                  pageNumber={pageNumber}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="cv-preview-page"
                  loading={
                    <div className="flex h-[50vh] w-full items-center justify-center rounded-xl bg-white">
                      <Loader2 className="animate-spin text-[var(--color-accent)]" size={24} />
                    </div>
                  }
                />
              ))}
            </Document>
          </div>
        )}
      </div>
    </div>
  )
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      {children}
    </div>
  )
}

function ToolbarButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] disabled:opacity-35"
    >
      {children}
    </button>
  )
}
