import { Link, useParams } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'
import { useFeatureStore } from '../stores/featureStore'

const PHASES = ['spec', 'plan', 'execute', 'review'] as const

export default function FeatureDetail() {
  const { id, featureId } = useParams<{ id: string; featureId: string }>()
  const project = useProjectStore((state) => state.projects.find((p) => p.id === id))
  const feature = useFeatureStore((state) => state.features.find((f) => f.id === featureId))

  if (!project || !feature) {
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${id}`} className="hover:text-foreground">{project.name}</Link>
        <span>/</span>
        <span className="text-foreground">{feature.name}</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold">{feature.name}</h2>
        <p className="text-muted-foreground mt-1">/{feature.slug}</p>
      </div>

      <div className="flex gap-2">
        {PHASES.map((phase, index) => (
          <div
            key={phase}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {index + 1}. {phase.charAt(0).toUpperCase() + phase.slice(1)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-3">📝 Spec</h3>
          <div className="min-h-32 bg-muted rounded-md p-3 text-sm text-muted-foreground">
            No spec defined yet. Use AI to generate a spec for this feature.
          </div>
          <button className="mt-3 w-full px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors">
            🤖 Generate Spec with AI
          </button>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-3">🗺️ Plan</h3>
          <div className="min-h-32 bg-muted rounded-md p-3 text-sm text-muted-foreground">
            No plan defined yet. Generate a plan after the spec is approved.
          </div>
          <button className="mt-3 w-full px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors">
            🤖 Generate Plan with AI
          </button>
        </div>

        <div className="rounded-lg border border-border p-6 md:col-span-2">
          <h3 className="font-semibold mb-3">✅ Tasks</h3>
          <div className="text-center py-8 border border-dashed border-border rounded-md">
            <p className="text-sm text-muted-foreground">No tasks yet. Generate tasks from the plan.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
