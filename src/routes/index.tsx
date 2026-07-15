import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  FileText,
  GraduationCap,
  Megaphone,
  ShieldCheck,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import schoolBuilding from '@/assets/imgAcc.jpg'
import studentsGroup from '@/assets/students-group.jpg'
import { useAuthStore } from '@/stores/auth-store'

const faqs = [
  {
    q: "Comment se passe l'inscription d'un nouvel élève ?",
    a: "Le formulaire d'inscription se remplit en ligne. Une fois soumis, l'administration valide le dossier après vérification.",
  },
  {
    q: 'Quels sont les modes de paiement du minerval ?',
    a: "Le paiement s'effectue physiquement à la caisse de l'école. Un reçu numérique est ensuite généré sur l'espace de l'élève.",
  },
  {
    q: 'Comment télécharger le bulletin scolaire ?',
    a: 'Les bulletins sont disponibles au format PDF dès que la tranche de minerval correspondante est soldée.',
  },
  {
    q: 'Comment un enseignant accède-t-il à son espace ?',
    a: "L'administration génère un identifiant unique (ID enseignant). L'enseignant l'utilise pour se connecter avec son email.",
  },
]

const featureCards = [
  {
    icon: Megaphone,
    title: 'Annonces en temps réel',
    text: "Restez informé des événements et changements d'horaires instantanément.",
  },
  {
    icon: FileText,
    title: 'Bulletins & Cours',
    text: 'Téléchargez vos documents pédagogiques en PDF après validation du minerval.',
  },
  {
    icon: GraduationCap,
    title: 'Espace Enseignant',
    text: 'Fiches de cotation, calcul automatique des points et accès aux horaires.',
  },
  {
    icon: ShieldCheck,
    title: 'Validation Admin',
    text: "Toutes les inscriptions sont vérifiées par l'administration avant activation.",
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

function HomePage() {
  const userIsAuth = useAuthStore(u => u.currentUser)
  useEffect(() => {
    document.title = 'Sacré Cœur de Jésus — Accueil'
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      {/* HERO */}
      <header className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block text-sacred-red font-bold text-xs uppercase tracking-[0.3em] mb-6">
              CS.S.D.J — Depuis 2017
            </span>
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9] mb-8">
              L'excellence au{' '}
              <span className="italic text-sacred-red">service</span> de la foi.
            </h1>
            <p className="text-lg md:text-xl opacity-60 leading-relaxed mb-10 max-w-xl">
              Système de gestion scolaire nouvelle génération pour le Sacré Cœur
              de Jésus. Une plateforme unifiée pour l'administration, les
              enseignants et les élèves.
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-12">
              {!userIsAuth && (
                <Link
                  to="/inscription"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-sacred-red text-white text-sm font-semibold shadow-lg shadow-sacred-red/30 hover:scale-105 transition-transform"
                >
                  S'inscrire étant que parent <ArrowRight className="size-4" />
                </Link>
              )}
              <Link
                to="/ecole"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border text-sm font-semibold hover:bg-card transition-all"
              >
                Découvrir l'école
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <img
                src={studentsGroup}
                alt="Nos élèves"
                className="size-16 rounded-full object-cover outline-4 outline-background shadow-xl"
                width={64}
                height={64}
                loading="lazy"
              />
              <div>
                <p className="font-bold">+2 500 Élèves</p>
                <p className="text-sm opacity-50">
                  Inscrits cette année scolaire
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -top-10 -right-10 size-72 bg-sacred-gold/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -left-10 size-72 bg-sacred-red/10 blur-3xl rounded-full" />
            <img
              src={schoolBuilding}
              alt="Bâtiment principal de l'école"
              className="relative w-full  object-cover rounded-4xl shadow-2xl"
              width={640}
              height={800}
            />
          </motion.div>
        </div>
      </header>

      {/* FEATURE CARDS */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="max-w-2xl mb-16">
            <span className="text-sacred-red font-bold text-xs uppercase tracking-widest mb-4 block">
              Plateforme
            </span>
            <h2 className="font-display text-4xl md:text-5xl">
              Tout ce dont l'école a besoin, au même endroit.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-6 rounded-3xl bg-background border border-border hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="size-12 rounded-2xl bg-sacred-red/10 text-sacred-red grid place-items-center mb-5">
                  <c.icon className="size-6" />
                </div>
                <h3 className="font-display text-2xl mb-2">{c.title}</h3>
                <p className="text-sm opacity-60 leading-relaxed">{c.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTORIQUE */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp}>
            <span className="text-sacred-red font-bold text-xs uppercase tracking-widest mb-4 block">
              Notre histoire
            </span>
            <h2 className="font-display text-4xl md:text-5xl mb-6">
              Plus de <span className="italic text-sacred-red">8 ans</span> au
              service de la jeunesse.
            </h2>
            <p className="opacity-70 leading-relaxed mb-4">
              Le complexe scolaire sacré coeur de jésus est une école
              nouvellement créée dont les travaux des constructions ont débutés
              au mois de février 2017. En effet, les soeurs ont voulu répondre
              aux cri et soucis des parents désirants une formation efficace et
              excellente pour leurs enfants espoirs de demain.
            </p>
            <p className="opacity-70 leading-relaxed mb-4">
              Parlant de sa situation géographique, le complexe scolaire sacré
              coeur de jésus se présente de la manière suivante : Au Nord par
              l'avenue Kikwit et la route Nationale N°1 Au Sud par le collège
              ngindu A l'Est par l'église Kimbanguiste A l'Oust par l'avenue
              Garageet l'école Gamaliel
            </p>
            <p className="opacity-70 leading-relaxed">
              Le complexe scolaire sacré coeur de jésus compte en son sein
              Quatre bâtiments dont chacun dispose : Le premier : Six salles de
              classe et une salle est une salle pour le maternelle le second :
              Quatre salles de classes et trois bureaux administratifs le
              toisième : cinq salles de classe , y compris les installations
              sanitaires le Quatrième : dispose 6 salles de classes. soulignons
              que chaque salle de classe est équipée d'un bon tableau nior et de
              pupitre aux normes pédagogiques. Quant à son personnel enseignant
              et administratif, le complexe scolaire sacré coeur de jésus ne
              souffre d'aucine insuffisance son corps enseignant et
              pédagogiquement qualifié, expérimenté et bien formé
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="grid grid-cols-2 gap-4">
            {[
              { n: '2016', l: 'Année de fondation' },
              { n: '8+', l: "Années d'enseignement" },
              { n: '1 500+', l: 'Élèves actifs' },
              { n: '30+', l: 'Enseignants' },
            ].map(s => (
              <div
                key={s.n}
                className="aspect-square rounded-3xl bg-sacred-red-soft border border-border p-6 flex flex-col justify-end"
              >
                <p className="font-display text-5xl text-sacred-red mb-2">
                  {s.n}
                </p>
                <p className="text-sm opacity-60">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-sacred-red font-bold text-xs uppercase tracking-widest mb-4 block">
              FAQ
            </span>
            <h2 className="font-display text-4xl md:text-5xl">
              Questions fréquentes
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <FaqItem key={f.q} faq={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            {...fadeUp}
            className="rounded-4xl bg-sacred-red text-white p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 size-72 bg-sacred-gold/20 blur-3xl rounded-full" />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-5xl mb-4">
                Une question ? Contactez-nous.
              </h2>
              <p className="opacity-80 max-w-xl mx-auto mb-8">
                Notre secrétariat est disponible du lundi au vendredi de 8h à
                16h.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest opacity-60 mb-1">
                    Téléphone
                  </p>
                  <p className="font-medium text-xs">+243 810 860 751</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest opacity-60 mb-1">
                    Email
                  </p>
                  <p className="font-medium text-xs break-all">
                    info@cssacrecoeurdejesus.edu
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest opacity-60 mb-1">
                    Adresse
                  </p>
                  <p className="font-medium text-xs">
                    Av. INDONDO/KIKWIT N°36/40 Q/ MPASSA2 C/ N'SELE KINSHASA ,
                    RDC{' '}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

function FaqItem({
  faq,
  index,
}: {
  faq: { q: string; a: string }
  index: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-background overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="font-medium">{faq.q}</span>
        <ChevronDown
          className={`size-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-5 text-sm opacity-70 leading-relaxed">{faq.a}</p>
      </motion.div>
    </motion.div>
  )
}

export default HomePage
