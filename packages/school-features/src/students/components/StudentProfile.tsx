import { Loader2 } from "lucide-react";
import { PageHeader } from "@sacre-coeur/ui/layouts/dashboard-shell";
import type { EleveDetails } from "@sacre-coeur/domain/types";
import { useStudentProfile } from "../hooks/useStudentProfile";
import PaymentReceiptsSection from "./PaymentReceiptsSection";
import PaymentTranchesSection from "./PaymentTranchesSection";
import ReenrollmentDialog from "./ReenrollmentDialog";
import StudentSummaryCard from "./StudentSummaryCard";

interface StudentProfileProps {
  student: EleveDetails;
}

export default function StudentProfile({ student }: StudentProfileProps) {
  const profile = useStudentProfile(student);

  if (profile.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-sacred-red" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden px-3 sm:px-0">
      <PageHeader
        title="Profil Financier & Scolaire"
        subtitle="Suivi individuel de la scolarité et contrôle d'accès aux résultats."
      />

      <StudentSummaryCard
        student={student}
        currentSchoolYear={profile.currentSchoolYear}
        isAdmin={profile.isAdmin}
        totals={profile.totals}
        onDownloadReport={profile.handleDownloadReport}
        onOpenReenrollment={profile.handleOpenReenrollmentModal}
      />

      <PaymentTranchesSection financialStatus={profile.financialStatus} />

      <PaymentReceiptsSection
        receipts={profile.studentReceipts}
        onDownloadReceipt={profile.downloadReceipt}
      />

      <ReenrollmentDialog
        isOpen={profile.isModalOpen}
        onOpenChange={profile.setIsModalOpen}
        currentSchoolYear={profile.currentSchoolYear}
        isLoadingEligibility={profile.isLoadingEligibility}
        isReenrollmentOpen={profile.isReenrollmentOpen}
        eligibleClasses={profile.eligibleClasses}
        selectedClassId={profile.selectedClassId}
        onSelectedClassChange={profile.setSelectedClassId}
        feedbackMessage={profile.feedbackMessage}
        isSubmitting={profile.reenrollMutation.isPending}
        onSubmit={profile.handleReenrollSubmit}
      />
    </div>
  );
}
