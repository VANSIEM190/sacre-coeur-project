import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Book, MessageCircle, Phone } from 'lucide-react'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

const guides = [
  {
    title: "S'inscrire en tant qu'élève",
    text: "Remplissez le formulaire d'inscription puis attendez la validation de l'administration.",
  },
  {
    title: "Se connecter en tant qu'enseignant",
    text: "Utilisez l'email reçu et l'ID enseignant communiqué par l'administration.",
  },
  {
    title: 'Télécharger un bulletin',
    text: 'Rendez-vous dans votre espace élève, section Points, après que la tranche de minerval soit soldée.',
  },
  {
    title: 'Payer le minerval',
    text: "Le paiement se fait à la caisse de l'école. Un reçu numérique est généré automatiquement.",
  },
  {
    title: 'Modifier vos informations',
    text: "Contactez l'administration pour toute modification de votre profil.",
  },
  {
    title: 'Récupérer votre mot de passe',
    text: "Adressez-vous à l'administration qui pourra réinitialiser vos accès.",
  },
]

function SupportPage() {
  useEffect(() => {
    document.title = 'Support — Sacré Cœur de Jésus'
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
            className="text-center mb-16"
          >
            <span className="text-sacred-red font-bold text-xs uppercase tracking-widest mb-4 block">
              Aide & Support
            </span>
            <h1 className="font-display text-5xl md:text-7xl mb-6">
              Nous sommes là pour vous aider.
            </h1>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 mb-16">
            {[
              { icon: Phone, t: 'Par téléphone', v: '+243 810 860 751' },
              {
                icon: MessageCircle,
                t: 'Par email',
                v: 'support@sacrecoeur.edu',
              },
              { icon: Book, t: 'Sur place', v: 'Bureau du secrétariat' },
            ].map((c, i) => (
              <motion.div
                key={c.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-6 rounded-3xl bg-card border border-border text-center"
              >
                <div className="size-12 mx-auto rounded-2xl bg-sacred-red/10 text-sacred-red grid place-items-center mb-4">
                  <c.icon className="size-6" />
                </div>
                <p className="text-xs uppercase tracking-widest opacity-60 mb-1">
                  {c.t}
                </p>
                <p className="font-semibold">{c.v}</p>
              </motion.div>
            ))}
          </div>

          <h2 className="font-display text-3xl mb-8">Guide d'utilisation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {guides.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                <h3 className="font-semibold mb-2">{g.title}</h3>
                <p className="text-sm opacity-70 leading-relaxed">{g.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

export default SupportPage
