import jsPDF from 'jspdf'
import type { PaymentReceipt } from '@sacre-coeur/domain/types'
import { drawSchoolHeader, loadLogoAsBase64 } from './schoolPdfHeader'

/** Copie téléchargeable des données du reçu enregistré, sans appel à une API fictive. */
export async function generatePaymentReceiptPdf(receipt: PaymentReceipt): Promise<void> {
  const document = new jsPDF()
  const margin = 15
  let position = drawSchoolHeader(document, margin, await loadLogoAsBase64())
  document.setFont('helvetica', 'bold')
  document.setFontSize(14)
  document.text(`Reçu de paiement #${receipt.id.slice(0, 8)}`, margin, position)
  position += 12
  document.setFont('helvetica', 'normal')
  document.setFontSize(10)
  const fields = [
    `Élève : ${receipt.studentName || receipt.studentId}`,
    `Année scolaire : ${receipt.schoolYear}`,
    `Tranche : ${receipt.tranche}`,
    `Montant : ${receipt.amount} ${receipt.currency}`,
    `Motif : ${receipt.reason}`,
    `Date de paiement : ${new Date(receipt.paidAt).toLocaleDateString('fr-FR')}`,
    `Caissier : ${receipt.cashierName}`,
  ]
  fields.forEach(field => {
    const lines = document.splitTextToSize(field, 180)
    document.text(lines, margin, position)
    position += lines.length * 5 + 3
  })
  document.save(`Recu_${receipt.id.slice(0, 8)}.pdf`)
}
