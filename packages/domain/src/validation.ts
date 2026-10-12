import { DomainError } from "./errors.ts";
import type { PaymentTranche } from "./types";

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function requireUuid(value: string, label = "Identifiant"): void {
  if (!value || !isValidUuid(value))
    throw new DomainError(`${label} invalide.`);
}

export function requireText(value: string, label: string): string {
  const text = value?.trim();
  if (!text) throw new DomainError(`${label} requis.`);
  return text;
}

export function validateAmount(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new DomainError(
      "Le montant doit être un nombre fini supérieur à zéro.",
    );
  }
}

export function validateCurrency(value: string): asserts value is "USD" | "FC" {
  if (value !== "USD" && value !== "FC")
    throw new DomainError("Devise invalide : choisissez USD ou FC.");
}

export function validateTranche(
  value: number,
): asserts value is PaymentTranche {
  if (value !== 1 && value !== 2 && value !== 3)
    throw new DomainError("Tranche invalide : choisissez 1, 2 ou 3.");
}

export function validateGrade(score: number, maxScore: number): void {
  if (
    !Number.isFinite(score) ||
    !Number.isFinite(maxScore) ||
    score < 0 ||
    maxScore <= 0
  ) {
    throw new DomainError(
      "La note doit être positive ou nulle et le barème supérieur à zéro.",
    );
  }
  if (score > maxScore)
    throw new DomainError("La note ne peut pas dépasser le barème.");
}
