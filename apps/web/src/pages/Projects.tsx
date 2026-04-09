import { Link } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'

export default function Projects() {
  const { projects, addProject } = useProjectStore()

  const handleNewProject = () => {
    addProject({
      id: crypto.randomUUID(),
      name: `New Project ${projects.length + 1}`,
      path: `/projects/new-${projects.length + 1}`,
      description: 'A new SpecFlow project',
      defaultAgent: 'copilot',
      mainBranch: 'main',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground mt-1">Manage your SpecFlow projects</p>
        </div>
        <button
          onClick={handleNewProject}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-4xl mb-4">📁</p>
          <p className="text-muted-foreground">No projects yet. Create your first project!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block rounded-lg border border-border p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{project.name}</h3>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                  {project.defaultAgent}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {project.description || 'No description'}
              </p>
              <p className="text-xs text-muted-foreground mt-3">{project.path}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
