import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

const sections = [
  {
    t: 'Collecte des données',
    c: "Nous collectons uniquement les données nécessaires à la gestion scolaire : identité de l'élève, parents, dossier académique et historique de paiement.",
  },
  {
    t: 'Utilisation des données',
    c: "Vos données ne sont utilisées qu'à des fins pédagogiques, administratives et de communication entre l'école et les familles.",
  },
  {
    t: 'Partage des données',
    c: "Aucune donnée n'est partagée avec un tiers commercial. Seul le personnel autorisé y accède dans le cadre de ses fonctions.",
  },
  {
    t: 'Sécurité',
    c: 'Toutes les données sont stockées de manière sécurisée. Les accès sont protégés par authentification et journalisés.',
  },
  {
    t: 'Vos droits',
    c: "Vous pouvez demander à consulter, modifier ou supprimer vos données en contactant l'administration de l'école.",
  },
  {
    t: 'Conservation',
    c: "Les données sont conservées pendant toute la scolarité de l'élève puis archivées conformément à la réglementation.",
  },
]

function ConfidentialitePage() {
  useEffect(() => {
    document.title = 'Confidentialité — Sacré Cœur de Jésus'
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sacred-red font-bold text-xs uppercase tracking-widest mb-4 block">
              Légal
            </span>
            <h1 className="font-display text-5xl md:text-6xl mb-6">
              Politique de confidentialité
            </h1>
            <p className="opacity-60 mb-12 italic">
              Dernière mise à jour :{' '}
              {new Date().toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </motion.div>

          <div className="space-y-10">
            {sections.map((s, i) => (
              <motion.div
                key={s.t}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <h2 className="font-display text-2xl mb-3">
                  {i + 1}. {s.t}
                </h2>
                <p className="opacity-70 leading-relaxed">{s.c}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

export default ConfidentialitePage
