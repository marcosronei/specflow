import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
}

export default function Header() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'SpecFlow'

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Local Mode</span>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
          S
        </div>
      </div>
    </header>
  )
}
