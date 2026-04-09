import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../lib/api'

interface Project {
  id: string
  name: string
  path: string
  description?: string
  defaultAgent: string
  mainBranch: string
  createdAt: string
  _count?: { features: number }
}

interface NewProjectForm {
  name: string
  path: string
  description: string
  defaultAgent: 'copilot' | 'claude'
  mainBranch: string
}

export default function Projects() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewProjectForm>({
    name: '',
    path: '',
    description: '',
    defaultAgent: 'copilot',
    mainBranch: 'main',
  })
  const [formError, setFormError] = useState('')

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: NewProjectForm) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowModal(false)
      setForm({ name: '', path: '', description: '', defaultAgent: 'copilot', mainBranch: 'main' })
      setFormError('')
    },
    onError: (err: unknown) => {
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
          : 'Failed to create project'
      setFormError(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.path.trim()) {
      setFormError('Name and path are required')
      return
    }
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground mt-1">Manage your SpecFlow projects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Project
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-lg border border-border p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-4xl mb-4">📁</p>
          <p className="font-medium mb-1">No projects yet</p>
          <p className="text-muted-foreground text-sm mb-4">Create your first project to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="relative rounded-lg border border-border p-4 hover:border-primary transition-colors group">
              <Link to={`/projects/${project.id}`} className="block">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{project.name}</h3>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                    {project.defaultAgent}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {project.description || 'No description'}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">{project.path}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>🌿 {project.mainBranch}</span>
                  <span>✨ {project._count?.features ?? 0} features</span>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (confirm(`Delete "${project.name}"?`)) {
                    deleteMutation.mutate(project.id)
                  }
                }}
                className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 text-xs text-destructive hover:underline transition-opacity"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">New Project</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Project Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="My Awesome Project"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Repository Path *</label>
                <input
                  type="text"
                  value={form.path}
                  onChange={(e) => setForm({ ...form, path: e.target.value })}
                  placeholder="/Users/you/projects/my-project"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Must be a valid Git repository directory</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this project..."
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Default Agent</label>
                  <select
                    value={form.defaultAgent}
                    onChange={(e) => setForm({ ...form, defaultAgent: e.target.value as 'copilot' | 'claude' })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="copilot">Copilot</option>
                    <option value="claude">Claude</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Main Branch</label>
                  <input
                    type="text"
                    value={form.mainBranch}
                    onChange={(e) => setForm({ ...form, mainBranch: e.target.value })}
                    placeholder="main"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              {formError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{formError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError('') }}
                  className="flex-1 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
