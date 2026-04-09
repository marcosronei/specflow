import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'

interface GitPanelProps {
  projectPath: string
  open: boolean
  onClose: () => void
}

interface GitStatus {
  current: string
  modified: string[]
  created: string[]
  deleted: string[]
  not_added: string[]
  staged: string[]
  ahead: number
  behind: number
}

export default function GitPanel({ projectPath, open, onClose }: GitPanelProps) {
  const [commitMessage, setCommitMessage] = useState('')
  const [newBranch, setNewBranch] = useState('')
  const [showNewBranch, setShowNewBranch] = useState(false)

  const { data: statusData, refetch: refetchStatus } = useQuery<GitStatus>({
    queryKey: ['git-status', projectPath],
    queryFn: () => api.get('/api/git/status', { params: { path: projectPath } }).then((r) => r.data.data),
    enabled: open && !!projectPath,
  })

  const { data: branchData } = useQuery<{ branches: string[]; current: string }>({
    queryKey: ['git-branches', projectPath],
    queryFn: () => api.get('/api/git/branches', { params: { path: projectPath } }).then((r) => r.data.data),
    enabled: open && !!projectPath,
  })

  const stageAllMutation = useMutation({
    mutationFn: () => api.post('/api/git/stage', { path: projectPath }).then((r) => r.data),
    onSuccess: () => {
      refetchStatus()
      toast.success('All files staged')
    },
    onError: () => toast.error('Failed to stage files'),
  })

  const commitMutation = useMutation({
    mutationFn: () =>
      api.post('/api/git/commit', { path: projectPath, message: commitMessage }).then((r) => r.data),
    onSuccess: () => {
      refetchStatus()
      setCommitMessage('')
      toast.success('Committed!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Commit failed'),
  })

  const pushMutation = useMutation({
    mutationFn: () => api.post('/api/git/push', { path: projectPath }).then((r) => r.data),
    onSuccess: () => {
      refetchStatus()
      toast.success('Pushed to origin!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Push failed'),
  })

  const createBranchMutation = useMutation({
    mutationFn: () =>
      api.post('/api/git/branch', { path: projectPath, branch: newBranch }).then((r) => r.data),
    onSuccess: () => {
      setNewBranch('')
      setShowNewBranch(false)
      toast.success(`Branch "${newBranch}" created`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to create branch'),
  })

  if (!open) return null

  const allChanged = [
    ...(statusData?.modified || []),
    ...(statusData?.created || []),
    ...(statusData?.deleted || []),
    ...(statusData?.not_added || []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-80 bg-background border-l border-border flex flex-col h-full shadow-xl overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-sm">🔀 Git Panel</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded text-muted-foreground">✕</button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Status section */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Status</h4>
            {allChanged.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing to commit</p>
            ) : (
              <div className="space-y-1">
                {allChanged.map((file) => (
                  <div key={file} className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-4 ${
                        statusData?.created.includes(file)
                          ? 'text-green-500'
                          : statusData?.deleted.includes(file)
                          ? 'text-red-500'
                          : 'text-yellow-500'
                      }`}
                    >
                      {statusData?.created.includes(file)
                        ? 'A'
                        : statusData?.deleted.includes(file)
                        ? 'D'
                        : 'M'}
                    </span>
                    <span className="font-mono truncate text-xs">{file}</span>
                  </div>
                ))}
              </div>
            )}
            {allChanged.length > 0 && (
              <button
                onClick={() => stageAllMutation.mutate()}
                disabled={stageAllMutation.isPending}
                className="mt-2 w-full px-2 py-1.5 text-xs border border-border rounded hover:bg-accent disabled:opacity-50"
              >
                Stage All
              </button>
            )}
          </div>

          {/* Commit section */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Commit</h4>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              rows={3}
              className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => commitMutation.mutate()}
              disabled={!commitMessage || commitMutation.isPending}
              className="mt-1 w-full px-2 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
            >
              {commitMutation.isPending ? 'Committing...' : 'Commit'}
            </button>
          </div>

          {/* Push section */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Push</h4>
            <div className="text-xs text-muted-foreground mb-2">
              <span className="font-mono">● {statusData?.current || branchData?.current || 'main'}</span>
              {statusData?.ahead !== undefined && statusData.ahead > 0 && (
                <span className="ml-2 text-blue-500">↑ {statusData.ahead} ahead</span>
              )}
            </div>
            <button
              onClick={() => pushMutation.mutate()}
              disabled={pushMutation.isPending}
              className="w-full px-2 py-1.5 text-xs border border-border rounded hover:bg-accent disabled:opacity-50"
            >
              {pushMutation.isPending ? 'Pushing...' : '⬆ Push to origin'}
            </button>
          </div>

          {/* Branches section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branches</h4>
              <button
                onClick={() => setShowNewBranch(!showNewBranch)}
                className="text-xs text-primary hover:underline"
              >
                + New
              </button>
            </div>
            {showNewBranch && (
              <div className="flex gap-1 mb-2">
                <input
                  type="text"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  placeholder="branch-name"
                  className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && newBranch && createBranchMutation.mutate()}
                />
                <button
                  onClick={() => newBranch && createBranchMutation.mutate()}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
                >
                  Create
                </button>
              </div>
            )}
            <div className="space-y-1">
              {(branchData?.branches || []).slice(0, 10).map((b) => (
                <div
                  key={b}
                  className={`text-xs px-2 py-1 rounded ${
                    b === branchData?.current ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {b === branchData?.current ? '● ' : '  '}{b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
