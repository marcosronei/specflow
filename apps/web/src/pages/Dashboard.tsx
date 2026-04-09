import { useProjectStore } from '../stores/projectStore'

export default function Dashboard() {
  const projects = useProjectStore((state) => state.projects)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome to SpecFlow</h2>
        <p className="text-muted-foreground mt-1">
          Spec-Driven Development — from spec to code, all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Projects', value: projects.length, icon: '📁', color: 'bg-blue-50' },
          { label: 'Features', value: 0, icon: '✨', color: 'bg-purple-50' },
          { label: 'Tasks', value: 0, icon: '✅', color: 'bg-green-50' },
          { label: 'AI Calls', value: 0, icon: '🤖', color: 'bg-orange-50' },
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
        <div className="rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-4">📝 Spec Phase</h3>
          <p className="text-sm text-muted-foreground">
            Define what to build. Create detailed specifications, user stories, and acceptance criteria.
          </p>
        </div>
        <div className="rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-4">🗺️ Plan Phase</h3>
          <p className="text-sm text-muted-foreground">
            Plan how to build. Generate technical plans, data models, and API specs.
          </p>
        </div>
        <div className="rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-4">🤖 Execute Phase</h3>
          <p className="text-sm text-muted-foreground">
            Execute with AI agents. GitHub Copilot and Claude Code implement the tasks.
          </p>
        </div>
        <div className="rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-4">🔍 Review Phase</h3>
          <p className="text-sm text-muted-foreground">
            Review and merge. Inspect diffs, leave comments, and push commits to GitHub.
          </p>
        </div>
      </div>
    </div>
  )
}
