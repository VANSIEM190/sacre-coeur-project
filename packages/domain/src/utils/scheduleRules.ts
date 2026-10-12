import { DomainError } from "../errors.ts";

export function validateTimeRange(startTime: string, endTime: string): void {
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
  if (!timePattern.test(startTime) || !timePattern.test(endTime))
    throw new DomainError("Heure invalide.");
  if (startTime.slice(0, 5) >= endTime.slice(0, 5))
    throw new DomainError("L'heure de fin doit suivre l'heure de début.");
}

export function timeRangesOverlap(
  first: { startTime: string; endTime: string },
  second: { startTime: string; endTime: string },
): boolean {
  return (
    first.startTime.slice(0, 5) < second.endTime.slice(0, 5) &&
    first.endTime.slice(0, 5) > second.startTime.slice(0, 5)
  );
}
