import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import { PaymentReceiptForm } from '../components/PaymentReceiptForm'
import { PaymentReceiptFilters } from '../components/PaymentReceiptFilters'
import { PaymentReceiptList } from '../components/PaymentReceiptList'
import { usePaymentsPage } from '../hooks/usePaymentsPage'

function AdminPaiements() {
  const page = usePaymentsPage()
  return <div>
    <PageHeader title="Paiements & Reçus" subtitle="Enregistrez les paiements minerval encaissés à la caisse." />
    <PaymentReceiptForm suggestions={page.matchingStudents} dropdownRef={page.dropdownRef} studentSearch={page.studentSearch} studentId={page.studentId} isDropdownOpen={page.isDropdownOpen} tranche={page.tranche} currency={page.currency} amount={page.amount} cashier={page.cashier} schoolYear={page.schoolYear} reason={page.reason} isSaving={page.isCreatingReceipt} onStudentSearch={value => { page.setStudentSearch(value); page.setIsDropdownOpen(true); if (page.studentId) page.setStudentId('') }} onStudentSelect={suggestion => { page.setStudentId(suggestion.student.id); page.setStudentSearch(suggestion.fullName); page.setIsDropdownOpen(false) }} onDropdownToggle={page.setIsDropdownOpen} onTrancheChange={page.setTranche} onCurrencyChange={page.setCurrency} onAmountChange={page.setAmount} onCashierChange={page.setCashier} onReasonChange={page.setReason} onSubmit={page.submit} />
    <PaymentReceiptFilters search={page.filterSearch} year={page.filterYear} onSearchChange={page.setFilterSearch} onYearChange={page.setFilterYear} />
    <PaymentReceiptList receipts={page.filteredReceipts} students={page.students} />
  </div>
}

export default AdminPaiements
