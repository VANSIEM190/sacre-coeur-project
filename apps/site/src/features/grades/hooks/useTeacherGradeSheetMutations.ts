import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMutateData } from "@sacre-coeur/data-access/hooks/useQuery";
import {
  gradeService,
  type GradeSheetInput,
} from "@sacre-coeur/data-access/services/grade/grade.service";
import { SupabaseErrorHandler } from "@sacre-coeur/school-features/feedback/supabase-error-handler";

export function useTeacherGradeSheetMutations(onSaved: () => void) {
  const queryClient = useQueryClient();
  const saveMutation = useMutateData(
    (input: GradeSheetInput) => gradeService.saveGradeSheet(input),
    {
      onSuccess: async () => {
        onSaved();
        await queryClient.invalidateQueries({ queryKey: ["gradeSheets"] });
        toast.success("Fiche de cotation enregistrée.");
      },
      onError: (error) => SupabaseErrorHandler.handle(error),
    },
  );
  const deleteMutation = useMutateData(
    (sheetId: string) => gradeService.deleteGradeSheet(sheetId),
    {
      onSuccess: async () => {
        onSaved();
        await queryClient.invalidateQueries({ queryKey: ["gradeSheets"] });
        toast.success("Fiche de cotation supprimée.");
      },
      onError: (error) => SupabaseErrorHandler.handle(error),
    },
  );

  return { saveMutation, deleteMutation };
}
