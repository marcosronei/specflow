import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../lib/api'

interface Project {
  id: string
  name: string
  description?: string
  defaultAgent: string
  createdAt: string
  _count?: { features: number }
  features?: Array<{
    id: string
    name: string
    status: string
    tasks?: Array<{ id: string; status: string }>
  }>
}

export default function Dashboard() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  })

  const totalFeatures = projects.reduce((sum, p) => sum + (p._count?.features ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome to SpecFlow 💫</h2>
        <p className="text-muted-foreground mt-1">
          Spec-Driven Development — from spec to code, all in one place.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: isLoading ? '...' : String(projects.length), icon: '📁', color: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Active Features', value: isLoading ? '...' : String(totalFeatures), icon: '✨', color: 'bg-purple-50 dark:bg-purple-950/20' },
          { label: 'Pending Tasks', value: '—', icon: '⏳', color: 'bg-orange-50 dark:bg-orange-950/20' },
          { label: 'Completed Tasks', value: '—', icon: '✅', color: 'bg-green-50 dark:bg-green-950/20' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg border border-border p-4 ${stat.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-2xl font-bold">{stat.value}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">📁 Recent Projects</h3>
            <Link to="/projects" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No projects yet</p>
              <Link to="/projects" className="text-xs text-primary hover:underline mt-1 inline-block">
                Create your first project →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project._count?.features ?? 0} features · {project.defaultAgent}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-4">🚀 Quick Start</h3>
          <div className="space-y-3">
            <div className="rounded-md border border-border p-3">
              <h4 className="text-sm font-medium mb-1">📝 1. Write a Spec</h4>
              <p className="text-xs text-muted-foreground">
                Define what to build with user stories, acceptance criteria, and requirements.
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h4 className="text-sm font-medium mb-1">🗺️ 2. Generate a Plan</h4>
              <p className="text-xs text-muted-foreground">
                AI generates a technical plan with architecture, data models, and API specs.
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <h4 className="text-sm font-medium mb-1">✅ 3. Execute Tasks</h4>
              <p className="text-xs text-muted-foreground">
                Break down the plan into tasks and track progress on the Kanban board.
              </p>
            </div>
          </div>
          {projects.length === 0 && (
            <Link
              to="/projects"
              className="mt-4 block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start a new project →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
