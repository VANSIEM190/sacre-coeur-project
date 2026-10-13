import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTeacherSchema,
  parseAssignedClassIds,
  serializeAssignedClassIds,
} from "../../../packages/domain/src/teachers.ts";

type TeacherRecord = {
  id: string;
  user_id: string | null;
  fullName: string;
  email: string;
  teacherAccessId: string;
  assignedclasses: string | string[] | null;
  created_at: string;
};

interface Dependencies {
  client: SupabaseClient;
  adminOrigin: string;
}

function createTeacherAccessId() {
  return `SC-T-${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`;
}

const toTeacher = (teacher: TeacherRecord) => ({
  id: teacher.id,
  email: teacher.email,
  role: "teacher" as const,
  fullName: teacher.fullName,
  teacherAccessId: teacher.teacherAccessId,
  assignedclasses: parseAssignedClassIds(teacher.assignedclasses),
  createdAt: teacher.created_at,
});

/** Authenticated admin operations on teacher records; no email invitations. */
export function createTeacherAccountsHandler({
  client,
  adminOrigin,
}: Dependencies) {
  const allowedOrigin = new URL(adminOrigin).origin;

  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin");
    const headers = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
    };
    const json = (body: unknown, status = 200) =>
      Response.json(body, { status, headers });

    if (origin && origin !== allowedOrigin)
      return json({ error: "Origine non autorisée." }, 403);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST")
      return json({ error: "Méthode non autorisée." }, 405);

    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer "))
      return json({ error: "Authentification requise." }, 401);

    try {
      const { data: auth, error: authError } = await client.auth.getUser(
        authorization.slice(7),
      );
      if (authError || !auth.user)
        return json({ error: "Session invalide." }, 401);

      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (profileError || profile?.role !== "admin")
        return json({ error: "Accès administrateur requis." }, 403);

      let input: Record<string, unknown>;
      try {
        const value: unknown = await request.json();
        if (!value || typeof value !== "object" || Array.isArray(value))
          return json({ error: "Commande invalide." }, 400);
        input = value as Record<string, unknown>;
      } catch {
        return json({ error: "JSON invalide." }, 400);
      }

      if (input.action === "create") {
        const parsed = createTeacherSchema.safeParse({
          fullName: input.fullName,
          email: input.email,
          assignedclasses: input.assignedclasses,
        });
        if (!parsed.success)
          return json(
            { error: parsed.error.issues[0]?.message ?? "Données invalides." },
            400,
          );

        const values = {
          ...parsed.data,
          email: parsed.data.email.toLowerCase(),
          assignedclasses: [...new Set(parsed.data.assignedclasses)],
        };
        const { data: classes, error: classesError } = await client
          .from("classes")
          .select("id")
          .in("id", values.assignedclasses);
        if (classesError || classes?.length !== values.assignedclasses.length)
          return json(
            { error: "Une classe sélectionnée est introuvable." },
            400,
          );

        const { data: existing, error: lookupError } = await client
          .from("enseignants_details")
          .select("id")
          .eq("email", values.email)
          .maybeSingle();
        if (lookupError) throw lookupError;
        if (existing)
          return json({ error: "Cet enseignant est déjà enregistré." }, 409);

        const teacherInsert = {
          ...values,
          assignedclasses: serializeAssignedClassIds(values.assignedclasses),
          classe_id: values.assignedclasses[0],
          teacherAccessId: createTeacherAccessId(),
        };
        const { data: teacher, error } = await client
          .from("enseignants_details")
          .insert(teacherInsert)
          .select("*")
          .single();
        if (error || !teacher)
          throw error ?? new Error("Impossible de créer la fiche enseignant.");

        return json({ teacher: toTeacher(teacher as TeacherRecord) }, 201);
      }

      if (!["delete", "assign-classes"].includes(String(input.action)))
        return json({ error: "Action inconnue." }, 400);
      if (
        !createTeacherSchema.shape.assignedclasses.element.safeParse(input.id)
          .success
      )
        return json({ error: "Identifiant enseignant invalide." }, 400);

      const { data: teacher, error: teacherError } = await client
        .from("enseignants_details")
        .select("*")
        .eq("id", input.id)
        .maybeSingle();
      if (teacherError) throw teacherError;
      if (!teacher) return json({ error: "Enseignant introuvable." }, 404);
      const record = teacher as TeacherRecord;

      if (input.action === "delete" && record.user_id === auth.user.id)
        return json(
          {
            error: "Cette commande ne peut pas supprimer votre propre compte.",
          },
          403,
        );

      if (input.action === "assign-classes") {
        const parsedClasses =
          createTeacherSchema.shape.assignedclasses.safeParse(
            input.assignedclasses,
          );
        if (!parsedClasses.success)
          return json({ error: "Liste de classes invalide." }, 400);
        const classIds = [...new Set(parsedClasses.data)];
        const { data: classes, error } = await client
          .from("classes")
          .select("id")
          .in("id", classIds);
        if (error || classes?.length !== classIds.length)
          return json(
            { error: "Une classe sélectionnée est introuvable." },
            400,
          );

        const { data: updated, error: updateError } = await client
          .from("enseignants_details")
          .update({
            assignedclasses: serializeAssignedClassIds(classIds),
            classe_id: classIds[0] ?? null,
          })
          .eq("id", record.id)
          .select("*")
          .single();
        if (updateError || !updated)
          throw (
            updateError ?? new Error("Impossible de mettre à jour les classes.")
          );
        return json({ teacher: toTeacher(updated as TeacherRecord) });
      }

      if (record.user_id) {
        const { data: linkedProfile, error } = await client
          .from("profiles")
          .select("role")
          .eq("id", record.user_id)
          .maybeSingle();
        if (error || linkedProfile?.role !== "teacher")
          return json(
            { error: "Le compte associé ne possède pas le rôle enseignant." },
            409,
          );
      }

      const { error: deleteError } = await client
        .from("enseignants_details")
        .delete()
        .eq("id", record.id);
      if (deleteError) throw deleteError;

      if (record.user_id) {
        const { error } = await client.auth.admin.deleteUser(record.user_id);
        if (error)
          return json(
            {
              error:
                "La fiche a été supprimée mais le compte Auth nécessite une intervention dans Supabase.",
              partial: true,
            },
            502,
          );
      }
      return json({ success: true });
    } catch (error) {
      console.error(
        "[teacher-accounts] Command failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return json(
        {
          error:
            "L’opération enseignant a échoué. Vérifiez la configuration et les relations dans Supabase.",
        },
        500,
      );
    }
  };
}
