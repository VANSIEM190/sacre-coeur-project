import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ALUMNI_TESTIMONIALS } from "../data/testimonials";

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const testimonial = ALUMNI_TESTIMONIALS[activeIndex];
  const canNavigate = ALUMNI_TESTIMONIALS.length > 1;

  const showPrevious = () => {
    setActiveIndex((index) => (index - 1 + ALUMNI_TESTIMONIALS.length) % ALUMNI_TESTIMONIALS.length);
  };

  const showNext = () => {
    setActiveIndex((index) => (index + 1) % ALUMNI_TESTIMONIALS.length);
  };

  if (!testimonial) return null;

  return (
    <section aria-labelledby="testimonials-title" className="bg-sacred-navy py-20 text-white md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-9">
          <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-sacred-gold">
            Témoignages
          </span>
          <h2 id="testimonials-title" className="font-display text-3xl font-bold md:text-4xl">
            Ce que disent nos anciens
          </h2>
        </div>

        <div className="grid items-stretch gap-8 md:grid-cols-2 md:gap-10">
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl bg-sacred-red/20 md:min-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.img
                key={testimonial.image}
                src={testimonial.image}
                alt={testimonial.imageAlt}
                className="absolute inset-0 size-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-sacred-navy/45 via-transparent to-transparent" />
            <button
              type="button"
              onClick={showPrevious}
              disabled={!canNavigate}
              aria-label="Photo précédente"
              className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-sacred-navy/20 text-white backdrop-blur-sm transition hover:bg-sacred-red disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNext}
              disabled={!canNavigate}
              aria-label="Photo suivante"
              className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-sacred-navy/20 text-white backdrop-blur-sm transition hover:bg-sacred-red disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col justify-center py-4 md:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <blockquote className="mb-8 text-xl font-semibold leading-relaxed md:text-2xl md:leading-relaxed">
                  “{testimonial.quote}”
                </blockquote>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="mt-1 text-sm text-white/75">{testimonial.cohort}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center gap-2" aria-label="Choisir un témoignage">
              {ALUMNI_TESTIMONIALS.map((item, index) => (
                <button
                  key={`${item.name}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  disabled={!canNavigate}
                  aria-label={`Afficher le témoignage ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  className={`h-2.5 rounded-full transition-all disabled:cursor-default ${
                    index === activeIndex ? "w-8 bg-sacred-gold" : "w-2.5 bg-white/45 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
