import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, FileText, GraduationCap, Megaphone, ShieldCheck } from 'lucide-react'
import schoolBuilding from '@/assets/imgAcc.jpg'
import studentsGroup from '@/assets/students-group.jpg'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

const faqs = [
  { q: "Comment se passe l'inscription d'un nouvel élève ?", a: "Le formulaire d'inscription se remplit en ligne. Une fois soumis, l'administration valide le dossier après vérification." },
  { q: 'Quels sont les modes de paiement du minerval ?', a: "Le paiement s'effectue physiquement à la caisse de l'école. Un reçu numérique est ensuite généré sur l'espace de l'élève." },
  { q: 'Comment télécharger le bulletin scolaire ?', a: 'Les bulletins sont disponibles au format PDF dès que la tranche de minerval correspondante est soldée.' },
  { q: 'Comment un enseignant accède-t-il à son espace ?', a: "L’administration remet un matricule d’activation à l’enseignant. Il l’utilise une seule fois pour choisir son mot de passe, puis se connecte avec son adresse e-mail." },
]

const featureCards = [
  { icon: Megaphone, title: 'Annonces en temps réel', text: "Restez informé des événements et changements d'horaires instantanément." },
  { icon: FileText, title: 'Bulletins & Cours', text: 'Téléchargez vos documents pédagogiques en PDF après validation du minerval.' },
  { icon: GraduationCap, title: 'Espace Enseignant', text: 'Fiches de cotation, calcul automatique des points et accès aux horaires.' },
  { icon: ShieldCheck, title: 'Validation Admin', text: "Toutes les inscriptions sont vérifiées par l'administration avant activation." },
]

export function HomeHero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return <header className="relative overflow-hidden pb-32 pt-20">
    <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <span className="mb-6 inline-block text-xs font-bold uppercase tracking-[0.3em] text-sacred-red">CS.S.D.J — Depuis 2017</span>
        <h1 className="mb-8 font-display text-6xl leading-[0.9] md:text-7xl lg:text-8xl">L'excellence au <span className="italic text-sacred-red">service</span> de la foi.</h1>
        <p className="mb-10 max-w-xl text-lg leading-relaxed opacity-60 md:text-xl">Système de gestion scolaire nouvelle génération pour le Sacré Cœur de Jésus. Une plateforme unifiée pour l'administration, les enseignants et les élèves.</p>
        <div className="mb-12 flex flex-wrap items-center gap-4">
          {!isAuthenticated && <Link to="/inscription" className="inline-flex items-center gap-2 rounded-full bg-sacred-red px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sacred-red/30 transition-transform hover:scale-105">S'inscrire en tant que parent <ArrowRight className="size-4" /></Link>}
          <Link to="/ecole" className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold transition-all hover:bg-card">Découvrir l'école</Link>
        </div>
        <div className="flex items-center gap-6"><img src={studentsGroup} alt="Nos élèves" className="size-16 rounded-full object-cover outline-4 outline-background shadow-xl" width={64} height={64} loading="lazy" /><div><p className="font-bold">+2 500 élèves</p><p className="text-sm opacity-50">Inscrits cette année scolaire</p></div></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative hidden lg:block">
        <div className="absolute -right-10 -top-10 size-72 rounded-full bg-sacred-gold/20 blur-3xl" /><div className="absolute -bottom-10 -left-10 size-72 rounded-full bg-sacred-red/10 blur-3xl" />
        <img src={schoolBuilding} alt="Bâtiment principal de l'école" className="relative w-full rounded-4xl object-cover shadow-2xl" width={640} height={800} />
      </motion.div>
    </div>
  </header>
}

export function PlatformSection() {
  return <section className="bg-card py-24"><div className="mx-auto max-w-7xl px-6">
    <motion.div {...fadeUp} className="mb-16 max-w-2xl"><span className="mb-4 block text-xs font-bold uppercase tracking-widest text-sacred-red">Plateforme</span><h2 className="font-display text-4xl md:text-5xl">Tout ce dont l'école a besoin, au même endroit.</h2></motion.div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{featureCards.map((card, index) => <motion.article key={card.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }} className="rounded-3xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-xl"><div className="mb-5 grid size-12 place-items-center rounded-2xl bg-sacred-red/10 text-sacred-red"><card.icon className="size-6" /></div><h3 className="mb-2 font-display text-2xl">{card.title}</h3><p className="text-sm leading-relaxed opacity-60">{card.text}</p></motion.article>)}</div>
  </div></section>
}

export function HistorySection() {
  const statistics = [{ value: '2016', label: 'Année de fondation' }, { value: '8+', label: "Années d'enseignement" }, { value: '1 500+', label: 'Élèves actifs' }, { value: '30+', label: 'Enseignants' }]
  return <section className="py-24"><div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
    <motion.div {...fadeUp}><span className="mb-4 block text-xs font-bold uppercase tracking-widest text-sacred-red">Notre histoire</span><h2 className="mb-6 font-display text-4xl md:text-5xl">Plus de <span className="italic text-sacred-red">8 ans</span> au service de la jeunesse.</h2><p className="mb-4 leading-relaxed opacity-70">Le Complexe Scolaire Sacré-Cœur de Jésus est une école nouvellement créée dont les travaux de construction ont débuté en février 2017. Les sœurs ont souhaité répondre aux attentes des parents qui désirent une formation efficace et excellente pour leurs enfants.</p><p className="mb-4 leading-relaxed opacity-70">Au nord, l'école est bordée par l'avenue Kikwit et la route Nationale N°1 ; au sud par le collège Ngindu ; à l'est par l'église Kimbanguiste ; à l'ouest par l'avenue Garage et l'école Gamaliel.</p><p className="leading-relaxed opacity-70">Le complexe compte quatre bâtiments : le premier comprend six salles de classe et une salle de maternelle ; le deuxième, quatre salles de classe et trois bureaux administratifs ; le troisième, cinq salles de classe et des installations sanitaires ; le quatrième, six salles de classe. Chaque salle est équipée d'un tableau et de pupitres aux normes pédagogiques. Le personnel enseignant et administratif est qualifié, expérimenté et bien formé.</p></motion.div>
    <motion.div {...fadeUp} className="grid grid-cols-2 gap-4">{statistics.map(item => <div key={item.value} className="flex aspect-square flex-col justify-end rounded-3xl border border-border bg-sacred-red-soft p-6"><p className="mb-2 font-display text-5xl text-sacred-red">{item.value}</p><p className="text-sm opacity-60">{item.label}</p></div>)}</motion.div>
  </div></section>
}

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  return <motion.article initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.05 }} className="overflow-hidden rounded-2xl border border-border bg-background">
    <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/40"><span className="font-medium">{question}</span><ChevronDown className={isOpen ? 'size-5 shrink-0 rotate-180 transition-transform' : 'size-5 shrink-0 transition-transform'} /></button>
    <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} className="overflow-hidden"><p className="px-6 pb-5 text-sm leading-relaxed opacity-70">{answer}</p></motion.div>
  </motion.article>
}

export function FaqSection() {
  return <section className="border-y border-border bg-card py-24"><div className="mx-auto max-w-4xl px-6">
    <motion.div {...fadeUp} className="mb-16 text-center"><span className="mb-4 block text-xs font-bold uppercase tracking-widest text-sacred-red">FAQ</span><h2 className="font-display text-4xl md:text-5xl">Questions fréquentes</h2></motion.div>
    <div className="space-y-3">{faqs.map((faq, index) => <FaqItem key={faq.q} question={faq.q} answer={faq.a} index={index} />)}</div>
  </div></section>
}

export function ContactSection() {
  return <section className="py-24"><div className="mx-auto max-w-5xl px-6"><motion.div {...fadeUp} className="relative overflow-hidden rounded-4xl bg-sacred-red p-12 text-center text-white md:p-16">
    <div className="absolute -right-20 -top-20 size-72 rounded-full bg-sacred-gold/20 blur-3xl" /><div className="relative"><h2 className="mb-4 font-display text-4xl md:text-5xl">Une question ? Contactez-nous.</h2><p className="mx-auto mb-8 max-w-xl opacity-80">Notre secrétariat est disponible du lundi au vendredi de 8h à 16h.</p><div className="mx-auto grid max-w-2xl gap-4 text-left sm:grid-cols-3">
      <ContactCard label="Téléphone">+243 810 860 751</ContactCard><ContactCard label="Email">contact@sacrecoeur.edu</ContactCard><ContactCard label="Adresse">Av. INDONDO/KIKWIT N°36/40 Q/ MPASSA2 C/ N'SELE KINSHASA, RDC</ContactCard>
    </div></div>
  </motion.div></div></section>
}

function ContactCard({ label, children }: { label: string; children: string }) {
  return <div className="rounded-2xl bg-white/10 p-4"><p className="mb-1 text-xs uppercase tracking-widest opacity-60">{label}</p><p className="break-all text-xs font-medium">{children}</p></div>
}
