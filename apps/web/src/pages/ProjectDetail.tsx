import { useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi, featuresApi } from '../lib/api'

interface Project {
  id: string
  name: string
  path: string
  description?: string
  defaultAgent: string
  mainBranch: string
  constitution?: string
  features?: Feature[]
  _count?: { features: number }
}

interface Feature {
  id: string
  projectId: string
  name: string
  slug: string
  branch?: string
  status: string
  createdAt: string
  _count?: { tasks: number }
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showNewFeature, setShowNewFeature] = useState(false)
  const [featureName, setFeatureName] = useState('')
  const [constitutionValue, setConstitutionValue] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<{ constitution: string }>) =>
      projectsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
  })

  const createFeatureMutation = useMutation({
    mutationFn: (name: string) => featuresApi.create({ projectId: id!, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] })
      setShowNewFeature(false)
      setFeatureName('')
    },
  })

  const handleConstitutionChange = useCallback(
    (value: string) => {
      setConstitutionValue(value)
      setSaveStatus('saving')
      const timer = setTimeout(() => {
        updateMutation.mutate({ constitution: value })
      }, 1000)
      return () => clearTimeout(timer)
    },
    [updateMutation],
  )

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found.</p>
        <Link to="/projects" className="text-primary hover:underline mt-2 inline-block">
          Back to Projects
        </Link>
      </div>
    )
  }

  const constitution = constitutionValue !== null ? constitutionValue : (project.constitution || '')
  const features = project.features || []

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground">Projects</Link>
        <span>/</span>
        <span className="text-foreground">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
            {project.defaultAgent}
          </span>
          <button
            onClick={() => setShowNewFeature(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
          >
            + New Feature
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {[
          { label: 'Path', value: project.path, mono: true },
          { label: 'Branch', value: project.mainBranch },
          { label: 'Agent', value: project.defaultAgent },
          { label: 'Features', value: String(features.length) },
        ].map((item) => (
          <div key={item.label} className="rounded-md border border-border p-3">
            <p className="text-muted-foreground text-xs">{item.label}</p>
            <p className={`font-medium mt-1 truncate ${item.mono ? 'font-mono text-xs' : ''}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Constitution */}
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">📜 Constitution</h3>
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : ''}
          </span>
        </div>
        <textarea
          value={constitution}
          onChange={(e) => handleConstitutionChange(e.target.value)}
          placeholder="Define your project principles, tech stack preferences, coding standards..."
          rows={6}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
        />
      </div>

      {/* Features List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">✨ Features ({features.length})</h3>
        </div>

        {features.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground text-sm">No features yet. Add your first feature!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {features.map((feature) => (
              <Link
                key={feature.id}
                to={`/projects/${id}/features/${feature.id}`}
                className="flex items-center justify-between rounded-md border border-border p-4 hover:border-primary transition-colors"
              >
                <div>
                  <p className="font-medium">{feature.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground font-mono">/{feature.slug}</p>
                    {feature._count?.tasks !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        {feature._count.tasks} tasks
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[feature.status] || 'bg-secondary text-secondary-foreground'}`}>
                  {feature.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Feature Modal */}
      {showNewFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">New Feature</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (featureName.trim()) createFeatureMutation.mutate(featureName)
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium block mb-1">Feature Name *</label>
                <input
                  type="text"
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  placeholder="e.g. User Authentication"
                  autoFocus
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A branch will be created automatically (e.g. 001-user-authentication)
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowNewFeature(false); setFeatureName('') }}
                  className="flex-1 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFeatureMutation.isPending || !featureName.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {createFeatureMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
