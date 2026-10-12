import {
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { PaymentTranche } from "@sacre-coeur/domain/types";
import type { useStudentProfile } from "../hooks/useStudentProfile";

type FinancialStatus = ReturnType<typeof useStudentProfile>["financialStatus"];

function TrancheBadge({ status }: { status: string }) {
  if (status.startsWith("Non configur")) {
    return (
      <span className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
        Tarif non défini
      </span>
    );
  }

  if (status === "Réglée") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
        <CheckCircle2 className="size-3.5 shrink-0" /> Réglée
      </div>
    );
  }

  if (status === "Incomplète") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
        <AlertTriangle className="size-3.5 shrink-0" /> Incomplète
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
      <Clock className="size-3.5 shrink-0" /> Non entamée
    </div>
  );
}

export default function PaymentTranchesSection({
  financialStatus,
}: {
  financialStatus: FinancialStatus;
}) {
  return (
    <section aria-labelledby="payment-tranches-title">
      <h3
        id="payment-tranches-title"
        className="font-display text-base sm:text-lg font-semibold mb-3"
      >
        État des tranches (Minerval)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {([1, 2, 3] as const).map((tranche: PaymentTranche) => {
          const info = financialStatus.tranches[tranche];
          return (
            <article
              key={tranche}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border space-y-3"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold opacity-80">
                  Tranche {tranche}
                </span>
                <TrancheBadge status={info.status} />
              </div>
              <div className="space-y-1 pt-2 border-t border-border/60 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="opacity-60 shrink-0">Payé USD :</span>
                  <span className="font-semibold text-right">
                    {info.paidUSD} / {info.requiredUSD} USD
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="opacity-60 shrink-0">Payé FC :</span>
                  <span className="font-semibold text-right">
                    {info.paidFC} / {info.requiredFC} FC
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
