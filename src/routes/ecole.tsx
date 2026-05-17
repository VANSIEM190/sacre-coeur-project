import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import schoolBuilding from '@/assets/school-building.jpg'
import teacherClassroom from '@/assets/teacher-classroom.jpg'
import studentsGroup from '@/assets/students-group.jpg'
import schoolOffice from '@/assets/school-office.jpg'

const galleryItems = [
  {
    src: teacherClassroom,
    title: 'Nos enseignants en classe',
    text: 'Une pédagogie attentive et exigeante au quotidien.',
  },
  {
    src: studentsGroup,
    title: 'La vie des élèves',
    text: "Un environnement bienveillant qui favorise l'épanouissement.",
  },
  {
    src: schoolOffice,
    title: 'Les bureaux administratifs',
    text: 'Une équipe disponible pour accompagner chaque famille.',
  },
]

function EcolePage() {
  useEffect(() => {
    document.title = 'L'
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sacred-red font-bold text-xs uppercase tracking-widest mb-4 block">
              Présentation
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-8 max-w-3xl">
              Une école, une{' '}
              <span className="italic text-sacred-red">communauté</span>, une
              mission.
            </h1>
            <p className="text-lg opacity-70 max-w-2xl leading-relaxed">
              Pénétrez dans nos murs et découvrez l'âme du Sacré Cœur de Jésus :
              nos bâtiments, nos enseignants passionnés, nos élèves engagés et
              notre administration dévouée.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-16 rounded-[2rem] overflow-hidden aspect-[21/9] shadow-2xl"
          >
            <img
              src={schoolBuilding}
              alt="Vue principale du campus"
              className="w-full h-full object-cover"
              width={1280}
              height={548}
            />
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-20">
            {galleryItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''}`}
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width={800}
                    height={600}
                  />
                </div>
                <div>
                  <span className="font-display italic text-sacred-red text-5xl block mb-4">
                    0{i + 1}
                  </span>
                  <h2 className="font-display text-4xl mb-4">{item.title}</h2>
                  <p className="opacity-70 leading-relaxed">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video placeholder */}
      <section className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sacred-red font-bold text-xs uppercase tracking-widest mb-4 block">
              Visite virtuelle
            </span>
            <h2 className="font-display text-4xl md:text-5xl mb-8">
              Découvrez notre école en vidéo
            </h2>
            <div className="aspect-video rounded-3xl bg-sacred-navy text-white grid place-items-center relative overflow-hidden shadow-2xl">
              <img
                src={schoolBuilding}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30"
                loading="lazy"
              />
              <div className="relative size-20 rounded-full bg-sacred-red grid place-items-center cursor-pointer hover:scale-110 transition-transform shadow-xl">
                <div className="size-0 border-y-[12px] border-y-transparent border-l-[18px] border-l-white ml-1.5" />
              </div>
            </div>
            <p className="text-sm opacity-50 mt-4 italic">
              Vidéo de présentation — bientôt disponible
            </p>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

export default EcolePage
