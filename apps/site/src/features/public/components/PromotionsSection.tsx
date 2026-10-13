import { motion } from "framer-motion";
import { ArrowUpRight, GraduationCap } from "lucide-react";
import { SCHOOL_PROMOTIONS } from "../data/promotions";
import type { SchoolPromotion } from "../types/promotion";

function PromotionCard({ promotion, index }: { promotion: SchoolPromotion; index: number }) {
  const items = promotion.levels ?? promotion.options;
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      className="flex h-full flex-col rounded-3xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="rounded-full bg-sacred-red/10 px-3 py-1 text-xs font-semibold text-sacred-red">
          {promotion.cycle}
        </span>
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sacred-gold/15 text-sacred-red">
          <GraduationCap className="size-5" aria-hidden="true" />
        </div>
      </div>
      <h3 className="mb-3 font-display text-2xl">{promotion.title}</h3>
      <p className="mb-5 text-sm leading-relaxed opacity-65">{promotion.description}</p>
      {items && (
        <ul className="mt-auto flex flex-wrap gap-2" aria-label={promotion.levels ? "Niveaux" : "Options"}>
          {items.map((item) => (
            <li key={item} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">
              {item}
            </li>
          ))}
        </ul>
      )}
      {!items && <ArrowUpRight className="mt-auto size-5 text-sacred-red" aria-hidden="true" />}
    </motion.article>
  );
}

export function PromotionsSection() {
  return (
    <section aria-labelledby="promotions-title" className="border-y border-border bg-card py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 max-w-3xl"
        >
          <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-sacred-red">Notre offre scolaire</span>
          <h2 id="promotions-title" className="mb-4 font-display text-4xl md:text-5xl">Un parcours pour chaque étape</h2>
          <p className="leading-relaxed opacity-65">
            De la maternelle aux humanités, découvrez les cycles et options proposés par notre établissement.
          </p>
        </motion.div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {SCHOOL_PROMOTIONS.map((promotion, index) => (
            <PromotionCard key={promotion.title} promotion={promotion} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
