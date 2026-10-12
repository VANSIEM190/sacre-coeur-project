import type { EleveDetails } from "@sacre-coeur/domain/types";

export const getStudentFullName = (student: Partial<EleveDetails>) =>
  [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
