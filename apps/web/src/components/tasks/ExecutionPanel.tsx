import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { taskExecutionApi } from '../../lib/api'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  agent: string
}

interface ExecutionPanelProps {
  task: Task
  open: boolean
  onClose: () => void
  onReviewChanges: (workspaceId: string) => void
}

type ExecutionStatus = 'idle' | 'running' | 'completed' | 'failed'

export default function ExecutionPanel({ task, open, onClose, onReviewChanges }: ExecutionPanelProps) {
  const queryClient = useQueryClient()
  const [agent, setAgent] = useState<'claude' | 'copilot'>('claude')
  const [status, setStatus] = useState<ExecutionStatus>('idle')
  const [output, setOutput] = useState<string[]>([])
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [exitCode, setExitCode] = useState<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusRef = useRef<ExecutionStatus>('idle')

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const executeMutation = useMutation({
    mutationFn: () => taskExecutionApi.execute(task.id, agent),
    onSuccess: (data) => {
      setStatus('running')
      setWorkspaceId(data.workspaceId)
      connectWebSocket(data.wsUrl)
      toast.success('Agent started!')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Failed to start agent'
      toast.error(msg)
    },
  })

  const stopMutation = useMutation({
    mutationFn: () => taskExecutionApi.stop(task.id),
    onSuccess: () => {
      setStatus('idle')
      disconnectWebSocket()
      toast.info('Agent stopped')
    },
  })

  function connectWebSocket(wsUrl: string) {
    disconnectWebSocket()
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'output') {
            setOutput((prev) => [...prev, msg.data])
          } else if (msg.type === 'complete') {
            const code = msg.exitCode as number
            setExitCode(code)
            setStatus(code === 0 ? 'completed' : 'failed')
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
          } else if (msg.type === 'error') {
            setOutput((prev) => [...prev, `ERROR: ${msg.message}`])
            setStatus('failed')
          }
        } catch {}
      }

      ws.onclose = () => {
        if (statusRef.current === 'running') {
          reconnectTimerRef.current = setTimeout(() => connectWebSocket(wsUrl), 2000)
        }
      }

      ws.onerror = () => {
        setOutput((prev) => [...prev, 'WebSocket connection error'])
      }
    } catch {}
  }

  function disconnectWebSocket() {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
      wsRef.current = null
    }
  }

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    if (!open) disconnectWebSocket()
  }, [open])

  useEffect(() => {
    return () => disconnectWebSocket()
  }, [])

  function handleRun() {
    setOutput([])
    setExitCode(null)
    setStatus('idle')
    executeMutation.mutate()
  }

  function handleStop() {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop' }))
    }
    stopMutation.mutate()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-2xl bg-background border-l border-border flex flex-col h-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-sm truncate max-w-[300px]">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">{task.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value as 'claude' | 'copilot')}
              disabled={status === 'running'}
              className="text-xs border border-border rounded bg-background px-2 py-1 focus:outline-none disabled:opacity-50"
            >
              <option value="claude">Claude Code</option>
              <option value="copilot">GitHub Copilot</option>
            </select>
            {status !== 'running' ? (
              <button
                onClick={handleRun}
                disabled={executeMutation.isPending}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                ▶ Run
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
              >
                ⏹ Stop
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-accent rounded text-muted-foreground">✕</button>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-4 py-2 border-b border-border flex items-center gap-2">
          {status === 'running' && (
            <span className="flex items-center gap-1.5 text-xs text-yellow-500">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              Running...
            </span>
          )}
          {status === 'completed' && (
            <span className="flex items-center gap-1.5 text-xs text-green-500">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              ✓ Completed (exit code: {exitCode})
            </span>
          )}
          {status === 'failed' && (
            <span className="flex items-center gap-1.5 text-xs text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              ✗ Failed (exit code: {exitCode})
            </span>
          )}
          {status === 'idle' && (
            <span className="text-xs text-muted-foreground">Ready to run</span>
          )}
          {output.length > 0 && (
            <button
              onClick={() => setOutput([])}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Terminal */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-auto bg-black p-4 font-mono text-xs text-green-400 leading-relaxed"
        >
          {output.length === 0 ? (
            <span className="text-zinc-600">Terminal output will appear here...</span>
          ) : (
            output.map((line, i) => (
              <div
                key={i}
                className={`${line.startsWith('ERROR') || line.startsWith('[stderr]') ? 'text-red-400' : 'text-green-400'}`}
              >
                {line}
              </div>
            ))
          )}
          {status === 'running' && (
            <span className="text-zinc-500 animate-pulse">█</span>
          )}
        </div>

        {/* Footer */}
        {(status === 'completed' || status === 'failed') && workspaceId && (
          <div className="p-4 border-t border-border flex items-center gap-2">
            {status === 'completed' ? (
              <button
                onClick={() => onReviewChanges(workspaceId)}
                className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
              >
                Review Changes →
              </button>
            ) : (
              <button
                onClick={() => onReviewChanges(workspaceId)}
                className="flex-1 px-3 py-2 text-sm border border-border rounded hover:bg-accent text-muted-foreground"
              >
                View Workspace
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
