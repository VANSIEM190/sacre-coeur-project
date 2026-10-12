import { Link } from 'react-router-dom'
export function NotFound() {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-7xl font-bold text-foreground">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2><p className="mt-2 text-sm text-muted-foreground">Cette page n'existe pas ou a été déplacée.</p><Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Retour à l'accueil</Link></div></div>
}

