import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

const authorities = [
  {
    name: "M. l' Abbé Henock",
    role: 'Recteur Général',
    bio: "Théologien et pédagogue, dirige l'institution depuis 2015 avec un engagement profond envers l'excellence et la foi.",
  },
  {
    name: 'M. Leonard',
    role: 'Préfèt des Études',
    bio: "Coordonne la pédagogie et veille à la qualité de l'enseignement dans toutes les classes.",
  },
  {
    name: 'M. Kambamba Didier',
    role: 'Sécraitère de lécole',
    bio: 'Supervise le cycle secondaire et accompagne les enseignants au quotidien.',
  },
  {
    name: 'Mme Sylvie Ngandu',
    role: 'Directrice du Primaire',
    bio: "Veille à l'épanouissement et à la formation initiale de nos jeunes élèves.",
  },
  {
    name: 'Père Antoine Mukendi',
    role: 'Aumônier',
    bio: "Responsable de la vie spirituelle et de l'accompagnement religieux des élèves.",
  },
  {
    name: 'Mme Esther Ilunga',
    role: 'Économe',
    bio: "Gère les finances et les ressources matérielles de l'institution.",
  },
]

function AutoritesPage() {
  useEffect(() => {
    document.title = 'Autorités — Sacré Cœur de Jésus'
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mb-16"
          >
            <span className="text-sacred-red font-bold text-xs uppercase tracking-widest mb-4 block">
              Direction
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-6">
              Les autorités de{' '}
              <span className="italic text-sacred-red">l'école</span>.
            </h1>
            <p className="text-lg opacity-70 leading-relaxed">
              Une équipe engagée au service de la formation intégrale de nos
              élèves.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {authorities.map((person, i) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="p-8 rounded-3xl bg-card border border-border hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                <div className="size-20 rounded-full bg-gradient-to-br from-sacred-red to-sacred-gold mb-6 grid place-items-center text-white font-display text-2xl shadow-lg">
                  {person.name
                    .split(' ')
                    .map(p => p[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <h3 className="font-display text-2xl mb-1">{person.name}</h3>
                <p className="text-sm text-sacred-red font-semibold mb-4 uppercase tracking-wide">
                  {person.role}
                </p>
                <p className="text-sm opacity-70 leading-relaxed">
                  {person.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

export default AutoritesPage
