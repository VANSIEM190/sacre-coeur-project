import { Link } from 'react-router-dom'

export function PublicFooter() {
  return (
    <footer className="bg-sacred-navy text-white py-20 mt-24">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
        <div className="col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-8 bg-sacred-red rounded-full" />
            <span className="font-display text-2xl tracking-tight">
              Sacré Cœur de Jésus
            </span>
          </div>
          <p className="opacity-50 text-sm max-w-sm leading-relaxed">
            Institution d'enseignement d'excellence dédiée à la formation
            intégrale de la jeunesse. Foi, Travail, Discipline.
          </p>
        </div>

        <div>
          <h5 className="text-xs uppercase tracking-widest font-bold mb-6 opacity-60">
            Navigation
          </h5>
          <ul className="space-y-4 text-sm">
            <li>
              <Link
                to="/ecole"
                className="hover:text-sacred-gold transition-colors opacity-80"
              >
                L'École
              </Link>
            </li>
            <li>
              <Link
                to="/autorites"
                className="hover:text-sacred-gold transition-colors opacity-80"
              >
                Autorités
              </Link>
            </li>
            <li>
              <Link
                to="/support"
                className="hover:text-sacred-gold transition-colors opacity-80"
              >
                Support
              </Link>
            </li>
            <li>
              <Link
                to="/confidentialite"
                className="hover:text-sacred-gold transition-colors opacity-80"
              >
                Confidentialité
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs uppercase tracking-widest font-bold mb-6 opacity-60">
            Contact
          </h5>
          <p className="text-sm opacity-70 mb-2">
            Avenue de l'Enseignement, 45
          </p>
          <p className="text-sm opacity-70 mb-2">Kinshasa, RDC</p>
          <p className="text-sm opacity-70">contact@sacrecoeur.edu</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16 mt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-xs opacity-40 uppercase tracking-wider">
          © {new Date().getFullYear()} Sacré Cœur de Jésus
        </p>
        <p className="text-xs opacity-40 italic">
          fait par Van'siem ancien éléve de l'école
        </p>
      </div>
    </footer>
  )
}
