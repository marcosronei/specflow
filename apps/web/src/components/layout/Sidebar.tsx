import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/projects', label: 'Projects', icon: '📁' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">⚡ SpecFlow</h1>
        <p className="text-xs text-muted-foreground mt-1">Spec-Driven Development</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              location.pathname === item.path
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">v0.1.0</p>
      </div>
    </aside>
  )
}
