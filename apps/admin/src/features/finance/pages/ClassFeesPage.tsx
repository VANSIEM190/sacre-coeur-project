import { PageHeader } from "@sacre-coeur/ui/layouts/dashboard-shell";
import { ClassFeeForm } from "../components/ClassFeeForm";
import { ClassFeeList } from "../components/ClassFeeList";
import { useClassFeesPage } from "../hooks/useClassFeesPage";

function AdminFixationPaiement() {
  const page = useClassFeesPage();
  return (
    <div>
      <PageHeader
        title="Fixation des Frais"
        subtitle="Définissez et bloquez les montants des paiements obligatoires par classe."
      />
      <ClassFeeForm
        classes={page.classes}
        form={page.form}
        schoolYear={page.schoolYear}
        isSaving={page.isFixingFee}
        onFormChange={page.setForm}
        onSubmit={page.submit}
      />
      <ClassFeeList
        configs={page.filteredConfigs}
        years={page.years}
        search={page.filterSearch}
        selectedYear={page.filterYear}
        onSearchChange={page.setFilterSearch}
        onYearChange={page.setFilterYear}
      />
    </div>
  );
}

export default AdminFixationPaiement;
