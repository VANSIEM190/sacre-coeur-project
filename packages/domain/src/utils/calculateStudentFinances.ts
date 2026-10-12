import type { ClassFeeConfig, PaymentReceipt, PaymentTranche } from "../types";
import {
  validateAmount,
  validateCurrency,
  validateTranche,
} from "../validation.ts";

export type TrancheStatus =
  | "Non entamée"
  | "Réglée"
  | "Incomplète"
  | "Non configurée";

export interface TrancheData {
  paidUSD: number;
  paidFC: number;
  requiredUSD: number;
  requiredFC: number;
  hasFeeConfiguration: boolean;
  status: TrancheStatus;
}

/** Les appelants fournissent les reçus et tarifs de la même classe et année. Aucune conversion de devises. */
export function calculateStudentFinances(
  receipts: PaymentReceipt[],
  feeConfigs: ClassFeeConfig[],
) {
  const covers = (paid: number, required: number) =>
    paid + Number.EPSILON * Math.max(1, paid, required) >= required;
  const totals = { USD: 0, FC: 0 };
  const emptyTranche = (): TrancheData => ({
    paidUSD: 0,
    paidFC: 0,
    requiredUSD: 0,
    requiredFC: 0,
    hasFeeConfiguration: false,
    status: "Non configurée",
  });
  const tranches: Record<PaymentTranche, TrancheData> = {
    1: emptyTranche(),
    2: emptyTranche(),
    3: emptyTranche(),
  };

  for (const fee of feeConfigs) {
    validateTranche(fee.tranche);
    validateCurrency(fee.currency);
    validateAmount(fee.amount);
    const tranche = tranches[fee.tranche];
    tranche.hasFeeConfiguration = true;
    if (fee.currency === "USD") tranche.requiredUSD += fee.amount;
    else tranche.requiredFC += fee.amount;
  }

  for (const receipt of receipts) {
    validateTranche(receipt.tranche);
    validateCurrency(receipt.currency);
    validateAmount(receipt.amount);
    totals[receipt.currency] += receipt.amount;
    const tranche = tranches[receipt.tranche];
    if (receipt.currency === "USD") tranche.paidUSD += receipt.amount;
    else tranche.paidFC += receipt.amount;
  }

  for (const tranche of Object.values(tranches)) {
    if (!tranche.hasFeeConfiguration) continue;
    if (tranche.paidUSD === 0 && tranche.paidFC === 0)
      tranche.status = "Non entamée";
    else if (
      covers(tranche.paidUSD, tranche.requiredUSD) &&
      covers(tranche.paidFC, tranche.requiredFC)
    )
      tranche.status = "Réglée";
    else tranche.status = "Incomplète";
  }

  const hasFeeConfiguration = feeConfigs.length > 0;
  const isGloballyCompliant =
    hasFeeConfiguration &&
    Object.values(tranches)
      .filter((tranche) => tranche.hasFeeConfiguration)
      .every((tranche) => tranche.status === "Réglée");
  return { totals, tranches, hasFeeConfiguration, isGloballyCompliant };
}
