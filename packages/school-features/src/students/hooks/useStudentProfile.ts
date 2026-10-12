import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@sacre-coeur/auth/stores/auth-store";
import {
  useFetchData,
  useMutateData,
} from "@sacre-coeur/data-access/hooks/useQuery";
import { paymentService } from "@sacre-coeur/data-access/services/finance/payment.service";
import { modePaymentService } from "@sacre-coeur/data-access/services/finance/modePayment.service";
import { classService } from "@sacre-coeur/data-access/services/classe/classe.service";
import { settingsService } from "@sacre-coeur/data-access/services/settings/settings.service";
import { inscriptionService } from "@sacre-coeur/data-access/services/student/inscription.service";
import { getErrorMessage } from "@sacre-coeur/data-access/services/core/Supabase.error.handler";
import { getEligibleReenrollmentClasses } from "@sacre-coeur/domain/utils/getEligibleReenrollmentClasses";
import { getCurrentSchoolYear } from "@sacre-coeur/domain/utils/getCurrentSchoolYear";
import { calculateStudentFinances } from "@sacre-coeur/domain/utils/calculateStudentFinances";
import type { EleveDetails, ClassName } from "@sacre-coeur/domain/types";
import { generateStudentReportPdf } from "../../pdf/generateStudentReportPdf";
import { generatePaymentReceiptPdf } from "../../pdf/generatePaymentReceiptPdf";
import { SupabaseErrorHandler } from "../../feedback/supabase-error-handler";

type Feedback = { type: "success" | "error"; text: string } | null;

export function useStudentProfile(student: EleveDetails) {
  const currentSchoolYear = getCurrentSchoolYear();
  const currentUser = useAuthStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReenrollmentOpen, setIsReenrollmentOpen] = useState(false);
  const [eligibleClasses, setEligibleClasses] = useState<ClassName[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<Feedback>(null);
  const paymentsQuery = useFetchData(
    ["payments", "student", student.id, currentSchoolYear, currentUser?.id],
    () => paymentService.getStudentPayment(student.id, currentSchoolYear),
  );
  const configsQuery = useFetchData(["class-fees-configs"], () =>
    modePaymentService.getClassesPayment(),
  );
  const classesQuery = useFetchData(["classes"], () =>
    classService.getAllClasses(),
  );
  const currentClass = (classesQuery.data ?? []).find(
    (schoolClass) =>
      schoolClass.id === (student.classe_id || student.currentClassName) ||
      (schoolClass.nom_classe === student.currentClassName &&
        schoolClass.annee_scolaire === currentSchoolYear),
  );
  const studentReceipts = useMemo(
    () =>
      (paymentsQuery.data ?? []).filter(
        (receipt) =>
          receipt.studentId === student.id &&
          receipt.schoolYear === currentSchoolYear,
      ),
    [paymentsQuery.data, student.id, currentSchoolYear],
  );
  const currentClassConfigs = useMemo(
    () =>
      (configsQuery.data ?? []).filter(
        (config) =>
          config.classId ===
            (currentClass?.id ||
              student.classe_id ||
              student.currentClassName) &&
          config.schoolYear === currentSchoolYear,
      ),
    [
      configsQuery.data,
      currentClass?.id,
      student.classe_id,
      student.currentClassName,
      currentSchoolYear,
    ],
  );
  const financialStatus = useMemo(
    () => calculateStudentFinances(studentReceipts, currentClassConfigs),
    [studentReceipts, currentClassConfigs],
  );
  const reenrollMutation = useMutateData(
    (payload: { eleveId: string; classeId: string; anneeScolaire: string }) =>
      inscriptionService.requestReenrollment(payload),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["students"] });
        await queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        setFeedbackMessage({
          type: "success",
          text: "Demande de réinscription enregistrée avec succès !",
        });
      },
      onError: (error) =>
        setFeedbackMessage({ type: "error", text: getErrorMessage(error) }),
    },
  );
  const handleOpenReenrollmentModal = async () => {
    setIsModalOpen(true);
    setFeedbackMessage(null);
    setSelectedClassId("");
    setEligibleClasses([]);
    setIsLoadingEligibility(true);
    try {
      const isOpen = await settingsService.isReenrollmentOpen();
      setIsReenrollmentOpen(isOpen);
      if (isOpen) {
        const allClasses = await classService.getAllClasses();
        const classesForYear = allClasses.filter(
          (schoolClass) => schoolClass.annee_scolaire === currentSchoolYear,
        );
        const eligible = getEligibleReenrollmentClasses(
          currentClass?.nom_classe ||
            student.nom_classe ||
            student.currentClassName,
          classesForYear,
        );
        setEligibleClasses(eligible);
        if (eligible.length === 1) setSelectedClassId(eligible[0].id);
      }
    } catch (error) {
      setFeedbackMessage({ type: "error", text: getErrorMessage(error) });
      setIsReenrollmentOpen(false);
    } finally {
      setIsLoadingEligibility(false);
    }
  };
  const handleReenrollSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !isReenrollmentOpen ||
      !eligibleClasses.some((schoolClass) => schoolClass.id === selectedClassId)
    )
      return;
    reenrollMutation.mutate({
      eleveId: student.id,
      classeId: selectedClassId,
      anneeScolaire: currentSchoolYear,
    });
  };
  const handleDownloadReport = async () => {
    try {
      await generateStudentReportPdf({
        student: {
          ...student,
          currentClassName:
            currentClass?.nom_classe ||
            student.nom_classe ||
            student.currentClassName,
        },
        schoolYear: currentSchoolYear,
        totals: financialStatus.totals,
        tranches: financialStatus.tranches,
        receipts: studentReceipts,
      });
    } catch (error) {
      SupabaseErrorHandler.handle(error);
    }
  };
  const downloadReceipt = async (receiptId: string) => {
    const receipt = studentReceipts.find((item) => item.id === receiptId);
    if (!receipt) return;
    try {
      await generatePaymentReceiptPdf(receipt);
    } catch (error) {
      SupabaseErrorHandler.handle(error);
    }
  };
  return {
    currentSchoolYear,
    isAdmin: currentUser?.role === "admin",
    className:
      currentClass?.nom_classe ||
      student.nom_classe ||
      student.currentClassName,
    isModalOpen,
    setIsModalOpen,
    isReenrollmentOpen,
    eligibleClasses,
    selectedClassId,
    setSelectedClassId,
    isLoadingEligibility,
    feedbackMessage,
    studentReceipts,
    financialStatus,
    totals: financialStatus.totals,
    reenrollMutation,
    handleOpenReenrollmentModal,
    handleReenrollSubmit,
    handleDownloadReport,
    downloadReceipt,
    isLoading:
      paymentsQuery.isLoading ||
      configsQuery.isLoading ||
      classesQuery.isLoading,
    error: paymentsQuery.error ?? configsQuery.error ?? classesQuery.error,
  };
}
