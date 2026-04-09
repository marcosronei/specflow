import { Link, useParams } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'
import { useFeatureStore } from '../stores/featureStore'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const project = useProjectStore((state) => state.projects.find((p) => p.id === id))
  const { features, addFeature } = useFeatureStore()
  const projectFeatures = features.filter((f) => f.projectId === id)

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found.</p>
        <Link to="/projects" className="text-primary hover:underline mt-2 inline-block">
          Back to Projects
        </Link>
      </div>
    )
  }

  const handleAddFeature = () => {
    if (!id) return
    addFeature({
      id: crypto.randomUUID(),
      projectId: id,
      name: `Feature ${projectFeatures.length + 1}`,
      slug: `feature-${projectFeatures.length + 1}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground">Projects</Link>
        <span>/</span>
        <span className="text-foreground">{project.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        <button
          onClick={handleAddFeature}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          + New Feature
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {[
          { label: 'Path', value: project.path },
          { label: 'Branch', value: project.mainBranch },
          { label: 'Agent', value: project.defaultAgent },
          { label: 'Features', value: projectFeatures.length.toString() },
        ].map((item) => (
          <div key={item.label} className="rounded-md border border-border p-3">
            <p className="text-muted-foreground text-xs">{item.label}</p>
            <p className="font-medium mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold mb-4">Features</h3>
        {projectFeatures.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground text-sm">No features yet. Add your first feature!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectFeatures.map((feature) => (
              <Link
                key={feature.id}
                to={`/projects/${id}/features/${feature.id}`}
                className="flex items-center justify-between rounded-md border border-border p-4 hover:border-primary transition-colors"
              >
                <div>
                  <p className="font-medium">{feature.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">/{feature.slug}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  feature.status === 'draft' ? 'bg-secondary text-secondary-foreground' :
                  feature.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {feature.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
