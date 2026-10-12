import type { useStudentProfile } from "../hooks/useStudentProfile";

type Receipt = ReturnType<typeof useStudentProfile>["studentReceipts"][number];

type PaymentReceiptsSectionProps = {
  receipts: Receipt[];
  onDownloadReceipt: (receiptId: string) => void;
};

export default function PaymentReceiptsSection({
  receipts,
  onDownloadReceipt,
}: PaymentReceiptsSectionProps) {
  return (
    <section className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border space-y-4">
      <h3 className="font-display text-base sm:text-lg font-semibold">
        Reçus de paiement
      </h3>

      {receipts.length === 0 ? (
        <p className="text-sm opacity-60">
          Aucun reçu trouvé pour cette année scolaire.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  Reçu #{receipt.id.slice(0, 8)}
                </p>
                <p className="text-xs opacity-60">
                  Tranche {receipt.tranche} •{" "}
                  {new Date(receipt.paidAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <span className="font-bold text-sacred-red whitespace-nowrap">
                  {receipt.amount} {receipt.currency}
                </span>
                <button
                  onClick={() => void onDownloadReceipt(receipt.id)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  Télécharger
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
