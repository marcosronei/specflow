import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { workspacesApi } from '../../lib/api'
import { toast } from 'sonner'

interface DiffFile {
  filePath: string
  content: string
  status: 'added' | 'modified' | 'deleted'
}

interface DiffData {
  raw: string
  files: DiffFile[]
}

interface Workspace {
  id: string
  branch?: string
  status: string
}

interface DiffViewerProps {
  workspace: Workspace
  onMerge?: () => void
  onDiscard?: () => void
}

const STATUS_ICONS: Record<string, string> = {
  added: '🟢',
  modified: '🟡',
  deleted: '🔴',
}

function parseDiffLines(content: string): Array<{ type: 'add' | 'remove' | 'context' | 'header'; text: string }> {
  return content.split('\n').map((line) => {
    if (line.startsWith('+') && !line.startsWith('+++')) return { type: 'add', text: line.slice(1) }
    if (line.startsWith('-') && !line.startsWith('---')) return { type: 'remove', text: line.slice(1) }
    if (line.startsWith('@@')) return { type: 'header', text: line }
    return { type: 'context', text: line.startsWith(' ') ? line.slice(1) : line }
  })
}

export default function DiffViewer({ workspace, onMerge, onDiscard }: DiffViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [commitMessage, setCommitMessage] = useState('')
  const [showCommit, setShowCommit] = useState(false)

  const { data: diffData, isLoading, refetch } = useQuery<DiffData>({
    queryKey: ['diff', workspace.id],
    queryFn: () => workspacesApi.diff(workspace.id),
    enabled: !!workspace.id,
  })

  const commitMutation = useMutation({
    mutationFn: () => workspacesApi.commit(workspace.id, commitMessage),
    onSuccess: () => {
      toast.success('Changes committed!')
      setCommitMessage('')
      setShowCommit(false)
      refetch()
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Commit failed'),
  })

  const pushMutation = useMutation({
    mutationFn: () => workspacesApi.push(workspace.id),
    onSuccess: () => toast.success('Pushed to origin!'),
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Push failed'),
  })

  const mergeMutation = useMutation({
    mutationFn: () => workspacesApi.merge(workspace.id),
    onSuccess: () => {
      toast.success('Merged successfully!')
      onMerge?.()
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Merge failed'),
  })

  const discardMutation = useMutation({
    mutationFn: () => workspacesApi.discard(workspace.id),
    onSuccess: () => {
      toast.success('Workspace discarded')
      onDiscard?.()
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Discard failed'),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    )
  }

  const files = diffData?.files || []
  const activeFile = files.find((f) => f.filePath === selectedFile)
  const diffLines = activeFile ? parseDiffLines(activeFile.content) : []

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Branch:</span>
          <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">{workspace.branch || 'N/A'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            workspace.status === 'running'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : workspace.status === 'completed'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-secondary text-secondary-foreground'
          }`}>{workspace.status}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowCommit(!showCommit)}
            className="px-3 py-1.5 text-xs border border-border rounded hover:bg-accent"
          >
            💾 Commit
          </button>
          <button
            onClick={() => pushMutation.mutate()}
            disabled={pushMutation.isPending}
            className="px-3 py-1.5 text-xs border border-border rounded hover:bg-accent disabled:opacity-50"
          >
            {pushMutation.isPending ? '⏳' : '⬆'} Push
          </button>
          <button
            onClick={() => mergeMutation.mutate()}
            disabled={mergeMutation.isPending}
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
          >
            {mergeMutation.isPending ? '⏳' : '🔀'} Merge
          </button>
          <button
            onClick={() => {
              if (confirm('Discard all changes?')) discardMutation.mutate()
            }}
            disabled={discardMutation.isPending}
            className="px-3 py-1.5 text-xs bg-destructive text-destructive-foreground rounded hover:opacity-90 disabled:opacity-50"
          >
            🗑 Discard
          </button>
        </div>
      </div>

      {/* Commit form */}
      {showCommit && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="flex-1 px-3 py-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => commitMutation.mutate()}
            disabled={!commitMessage || commitMutation.isPending}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
          >
            {commitMutation.isPending ? 'Committing...' : 'Commit'}
          </button>
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-3xl mb-3">📂</p>
          <p className="font-medium">No changes yet</p>
          <p className="text-sm text-muted-foreground mt-1">Run an agent to start implementing!</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden flex h-[500px]">
          {/* File list sidebar */}
          <div className="w-64 border-r border-border bg-card overflow-auto flex-shrink-0">
            <div className="p-2 text-xs font-medium text-muted-foreground border-b border-border">
              {files.length} file{files.length !== 1 ? 's' : ''} changed
            </div>
            {files.map((file) => (
              <button
                key={file.filePath}
                onClick={() => setSelectedFile(file.filePath)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center gap-2 ${
                  selectedFile === file.filePath ? 'bg-accent' : ''
                }`}
              >
                <span>{STATUS_ICONS[file.status] || '📄'}</span>
                <span className="truncate font-mono">{file.filePath}</span>
              </button>
            ))}
          </div>

          {/* Diff content */}
          <div className="flex-1 overflow-auto bg-background">
            {!activeFile ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a file to view changes
              </div>
            ) : (
              <pre className="p-4 text-xs font-mono leading-5">
                {diffLines.map((line, i) => (
                  <div
                    key={i}
                    className={`px-1 ${
                      line.type === 'add'
                        ? 'bg-green-900/30 text-green-400'
                        : line.type === 'remove'
                        ? 'bg-red-900/30 text-red-400'
                        : line.type === 'header'
                        ? 'text-blue-400 bg-blue-900/20'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <span className="select-none mr-2 text-zinc-600">{String(i + 1).padStart(4, ' ')}</span>
                    {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}{line.text}
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
