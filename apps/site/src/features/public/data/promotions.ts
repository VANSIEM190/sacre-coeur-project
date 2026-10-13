import type { SchoolPromotion } from "../types/promotion";

export const SCHOOL_PROMOTIONS: SchoolPromotion[] = [
  {
    cycle: "Cycle maternel",
    title: "École maternelle",
    description: "Un premier cadre d’apprentissage adapté aux jeunes enfants.",
  },
  {
    cycle: "Cycle primaire",
    title: "École primaire",
    levels: ["1ère", "2ème", "3ème", "4ème", "5ème", "6ème"],
    description: "Six années pour acquérir les bases et préparer la suite du parcours scolaire.",
  },
  {
    cycle: "Éducation de base",
    title: "7ème et 8ème",
    levels: ["7ème année", "8ème année"],
    description: "Le tronc commun de l’éducation de base avant l’orientation en humanités.",
  },
  {
    cycle: "Secondaire · Humanités",
    title: "Nos options",
    options: [
      "Commerciale",
      "Coupe et couture",
      "Littéraire",
      "Pédagogie générale",
      "Scientifique",
    ],
    description: "Des options pour poursuivre les études selon les intérêts et le projet de chaque élève.",
  },
];
