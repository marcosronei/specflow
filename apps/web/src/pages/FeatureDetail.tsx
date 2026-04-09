import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { featuresApi, specsApi, plansApi, tasksApi, workspacesApi } from '../lib/api'
import ExecutionPanel from '../components/tasks/ExecutionPanel'
import DiffViewer from '../components/review/DiffViewer'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Tab = 'spec' | 'plan' | 'tasks' | 'review'

const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done'] as const
type TaskStatus = (typeof TASK_STATUSES)[number]

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

interface Feature {
  id: string
  projectId: string
  name: string
  slug: string
  branch?: string
  status: string
  spec?: { id: string; contentMd: string; status: string }
  plan?: { id: string; contentMd: string }
  project?: { id: string; name: string; constitution?: string }
}

interface Task {
  id: string
  featureId: string
  title: string
  description?: string
  status: TaskStatus
  priority: string
  agent: string
  isParallel: boolean
  order: number
}

// Simple TipTap-like editor (textarea-based for simplicity)
function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={20}
      className="w-full px-3 py-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono leading-relaxed"
    />
  )
}

function SortableTaskCard({
  task,
  onUpdate,
  onDelete,
  onExecute,
}: {
  task: Task
  onUpdate: (id: string, data: Partial<Task>) => void
  onDelete: (id: string) => void
  onExecute: (task: Task) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const PRIORITY_COLORS: Record<string, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border rounded-md p-3 space-y-2 group"
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground">
          ⠿
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority] || 'bg-secondary text-secondary-foreground'}`}>
          {task.priority}
        </span>
        <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
          {task.agent}
        </span>
        {task.isParallel && (
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">[P]</span>
        )}
        <select
          value={task.status}
          onChange={(e) => onUpdate(task.id, { status: e.target.value as TaskStatus })}
          className="ml-auto text-xs border border-border rounded bg-background px-1 py-0.5 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:underline transition-opacity"
        >
          Del
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onExecute(task) }}
          className="opacity-0 group-hover:opacity-100 text-xs text-green-600 dark:text-green-400 hover:underline transition-opacity"
        >
          ▶ Execute
        </button>
      </div>
    </div>
  )
}

function KanbanBoard({ featureId, onReviewChanges }: { featureId: string; onReviewChanges?: (workspaceId: string) => void }) {
  const queryClient = useQueryClient()
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [executingTask, setExecutingTask] = useState<Task | null>(null)

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', featureId],
    queryFn: () => tasksApi.list(featureId),
  })

  const createMutation = useMutation({
    mutationFn: (data: { title: string; status: TaskStatus }) =>
      tasksApi.create(featureId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', featureId] })
      setNewTaskTitle('')
      setAddingTo(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      tasksApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', featureId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', featureId] }),
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleGenerateTasks() {
    setGenerating(true)
    try {
      await tasksApi.generate(featureId)
      queryClient.invalidateQueries({ queryKey: ['tasks', featureId] })
    } catch (err) {
      console.error('Failed to generate tasks:', err)
    } finally {
      setGenerating(false)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeTask = tasks.find((t) => t.id === active.id)
    const overTask = tasks.find((t) => t.id === over.id)
    if (!activeTask || !overTask) return

    if (activeTask.status !== overTask.status) {
      updateMutation.mutate({ id: activeTask.id, data: { status: overTask.status } })
    }
  }

  if (isLoading) {
    return <div className="h-32 bg-muted rounded animate-pulse" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
        <button
          onClick={handleGenerateTasks}
          disabled={generating}
          className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {generating ? '⏳ Generating...' : '✨ Generate Tasks'}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-2">
          {TASK_STATUSES.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order)
            return (
              <div key={status} className="bg-muted/50 rounded-lg p-3 min-w-[200px]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {STATUS_LABELS[status]}
                  </h4>
                  <span className="text-xs bg-background border border-border rounded-full px-1.5 py-0.5">
                    {columnTasks.length}
                  </span>
                </div>

                <SortableContext
                  items={columnTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {columnTasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                        onDelete={(id) => {
                          if (confirm('Delete this task?')) deleteMutation.mutate(id)
                        }}
                        onExecute={(t) => setExecutingTask(t)}
                      />
                    ))}
                  </div>
                </SortableContext>

                {addingTo === status ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (newTaskTitle.trim())
                        createMutation.mutate({ title: newTaskTitle, status })
                    }}
                    className="mt-2 space-y-2"
                  >
                    <input
                      autoFocus
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title..."
                      className="w-full px-2 py-1.5 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <div className="flex gap-1">
                      <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="flex-1 py-1 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingTo(null)}
                        className="flex-1 py-1 text-xs border border-border rounded hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingTo(status)}
                    className="mt-2 w-full py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background rounded border border-dashed border-border transition-colors"
                  >
                    + Add Task
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </DndContext>

      {executingTask && (
        <ExecutionPanel
          task={executingTask}
          open={!!executingTask}
          onClose={() => setExecutingTask(null)}
          onReviewChanges={(wsId) => {
            onReviewChanges?.(wsId)
            setExecutingTask(null)
          }}
        />
      )}
    </div>
  )
}

function SpecTab({ feature }: { feature: Feature }) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showGenerate, setShowGenerate] = useState(false)
  const [generateDesc, setGenerateDesc] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: spec } = useQuery({
    queryKey: ['spec', feature.id],
    queryFn: () => specsApi.get(feature.id),
    retry: false,
  })

  useEffect(() => {
    if (spec) setContent(spec.contentMd)
  }, [spec])

  const handleChange = useCallback((value: string) => {
    setContent(value)
    setSaveStatus('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await specsApi.save(feature.id, { contentMd: value })
        queryClient.invalidateQueries({ queryKey: ['spec', feature.id] })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('idle')
      }
    }, 1500)
  }, [feature.id, queryClient])

  async function handleGenerate() {
    if (!generateDesc.trim()) return
    setGenerating(true)
    setGenerateError('')
    try {
      const result = await specsApi.generate(feature.id, generateDesc)
      setContent(result.contentMd)
      queryClient.invalidateQueries({ queryKey: ['spec', feature.id] })
      setShowGenerate(false)
      setGenerateDesc('')
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data
          ? String((err.response.data as { error: string }).error)
          : 'Failed to generate spec'
      setGenerateError(msg)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {spec && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
              {spec.status}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : ''}
          </span>
        </div>
        <button
          onClick={() => setShowGenerate(!showGenerate)}
          className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          ✨ Generate with AI
        </button>
      </div>

      {showGenerate && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
          <h4 className="text-sm font-medium">Generate Spec with AI</h4>
          <textarea
            value={generateDesc}
            onChange={(e) => setGenerateDesc(e.target.value)}
            placeholder="Describe what you want to build..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          {generateError && (
            <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{generateError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowGenerate(false)}
              className="flex-1 px-3 py-1.5 text-xs border border-border rounded hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !generateDesc.trim()}
              className="flex-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
            >
              {generating ? '⏳ Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      <MarkdownEditor
        value={content}
        onChange={handleChange}
        placeholder="Write your spec here... or use AI to generate one."
      />
    </div>
  )
}

function PlanTab({ feature }: { feature: Feature }) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: plan } = useQuery({
    queryKey: ['plan', feature.id],
    queryFn: () => plansApi.get(feature.id),
    retry: false,
  })

  const { data: spec } = useQuery({
    queryKey: ['spec', feature.id],
    queryFn: () => specsApi.get(feature.id),
    retry: false,
  })

  useEffect(() => {
    if (plan) setContent(plan.contentMd)
  }, [plan])

  const handleChange = useCallback((value: string) => {
    setContent(value)
    setSaveStatus('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await plansApi.save(feature.id, { contentMd: value })
        queryClient.invalidateQueries({ queryKey: ['plan', feature.id] })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('idle')
      }
    }, 1500)
  }, [feature.id, queryClient])

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError('')
    try {
      const result = await plansApi.generate(feature.id)
      setContent(result.contentMd)
      queryClient.invalidateQueries({ queryKey: ['plan', feature.id] })
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data
          ? String((err.response.data as { error: string }).error)
          : 'Failed to generate plan'
      setGenerateError(msg)
    } finally {
      setGenerating(false)
    }
  }

  if (!spec) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">Create a spec first before generating a plan</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : ''}
        </span>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {generating ? '⏳ Generating...' : '✨ Generate Plan'}
        </button>
      </div>
      {generateError && (
        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{generateError}</p>
      )}
      <MarkdownEditor
        value={content}
        onChange={handleChange}
        placeholder="Write your technical plan here... or use AI to generate one based on the spec."
      />
    </div>
  )
}

function DiffViewerWrapper({ workspaceId, onBack }: { workspaceId: string; onBack: () => void }) {
  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () => workspacesApi.get(workspaceId),
    enabled: !!workspaceId,
  })

  if (isLoading) {
    return <div className="h-32 bg-muted rounded animate-pulse" />
  }

  if (!workspace) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Workspace not found.{' '}
        <button onClick={onBack} className="text-primary hover:underline">Go back</button>
      </div>
    )
  }

  return <DiffViewer workspace={workspace} onDiscard={onBack} />
}

export default function FeatureDetail() {
  const { id, featureId } = useParams<{ id: string; featureId: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('spec')
  const [reviewWorkspaceId, setReviewWorkspaceId] = useState<string | null>(null)

  const { data: feature, isLoading, error } = useQuery<Feature>({
    queryKey: ['features', featureId],
    queryFn: () => featuresApi.get(featureId!),
    enabled: !!featureId,
  })

  const TABS: { key: Tab; label: string }[] = [
    { key: 'spec', label: '📝 Spec' },
    { key: 'plan', label: '🗺️ Plan' },
    { key: 'tasks', label: '✅ Tasks' },
    { key: 'review', label: '🔍 Review' },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-64 bg-muted rounded" />
      </div>
    )
  }

  if (error || !feature) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Feature not found.</p>
        <Link to={`/projects/${id}`} className="text-primary hover:underline mt-2 inline-block">
          Back to Project
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${id}`} className="hover:text-foreground">
          {feature.project?.name || 'Project'}
        </Link>
        <span>/</span>
        <span className="text-foreground">{feature.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{feature.name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-muted-foreground font-mono">/{feature.slug}</p>
            {feature.branch && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                🌿 {feature.branch}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              feature.status === 'draft' ? 'bg-secondary text-secondary-foreground' :
              feature.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {feature.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'spec' && <SpecTab feature={feature} />}
        {activeTab === 'plan' && <PlanTab feature={feature} />}
        {activeTab === 'tasks' && (
          <KanbanBoard
            featureId={feature.id}
            onReviewChanges={(wsId) => {
              setReviewWorkspaceId(wsId)
              setActiveTab('review')
            }}
          />
        )}
        {activeTab === 'review' && (
          reviewWorkspaceId ? (
            <div className="space-y-4">
              <button
                onClick={() => setReviewWorkspaceId(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <DiffViewerWrapper workspaceId={reviewWorkspaceId} onBack={() => setReviewWorkspaceId(null)} />
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <p className="text-2xl mb-3">🔍</p>
              <p className="font-medium">Review & Diff</p>
              <p className="text-sm text-muted-foreground mt-1">
                Execute a task to generate changes, then review them here.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
