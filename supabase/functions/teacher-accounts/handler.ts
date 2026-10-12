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
  siteUrl: string;
  adminOrigin: string;
}

class ExistingAuthAccountError extends Error {}
const EXISTING_ACCOUNT_MESSAGE =
  "La fiche existe, mais cet e-mail est déjà associé à un compte de connexion. La direction doit vérifier ce compte avant toute association.";

const toTeacher = (teacher: TeacherRecord) => ({
  id: teacher.id,
  email: teacher.email,
  role: "teacher" as const,
  fullName: teacher.fullName,
  teacherAccessId: teacher.teacherAccessId,
  assignedclasses: parseAssignedClassIds(teacher.assignedclasses),
  createdAt: teacher.created_at,
});

/** Authenticated administrative commands over the tables already used by the app. */
export function createTeacherAccountsHandler({
  client,
  siteUrl,
  adminOrigin,
}: Dependencies) {
  const redirectTo = new URL("/auth/invitation", siteUrl).href;
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

      const invite = async (teacher: TeacherRecord): Promise<void> => {
        if (teacher.user_id) {
          const { data: linkedProfile, error: linkedError } = await client
            .from("profiles")
            .select("role")
            .eq("id", teacher.user_id)
            .maybeSingle();
          if (linkedError || linkedProfile?.role !== "teacher")
            throw new Error(
              "Le compte associé ne possède pas le rôle enseignant.",
            );
          const { data: account, error: accountError } =
            await client.auth.admin.getUserById(teacher.user_id);
          if (accountError || !account.user?.email)
            throw new Error("Le compte enseignant associé est indisponible.");
          // Auth is authoritative after the teacher has confirmed an email
          // change. Synchronize the contact sheet before sending a new link.
          const accountEmail = account.user.email.toLowerCase();
          if (accountEmail !== teacher.email.toLowerCase()) {
            const { error: syncError } = await client
              .from("enseignants_details")
              .update({ email: accountEmail })
              .eq("id", teacher.id);
            if (syncError) throw syncError;
            teacher.email = accountEmail;
          }
          const { error } = await client.auth.resetPasswordForEmail(
            accountEmail,
            { redirectTo },
          );
          if (error) throw error;
          return;
        }
        // Supabase creates the Auth account and sends its activation link together.
        // An existing account is rejected by Supabase and is never attached here.
        const { data: invitation, error: invitationError } =
          await client.auth.admin.inviteUserByEmail(teacher.email, {
            redirectTo,
            data: { fullName: teacher.fullName },
          });
        if (invitationError?.code === "email_exists")
          throw new ExistingAuthAccountError(EXISTING_ACCOUNT_MESSAGE, {
            cause: invitationError,
          });
        if (invitationError || !invitation.user)
          throw (
            invitationError ??
            new Error("Unable to create the teacher account.")
          );
        const userId = invitation.user.id;
        if (userId === auth.user.id)
          throw new Error(
            "The invitation resolved to the administrator account.",
          );
        if (
          invitation.user.email?.toLowerCase() !== teacher.email.toLowerCase()
        )
          throw new Error(
            "The invited account does not match the teacher email.",
          );
        try {
          const { error: roleError } = await client
            .from("profiles")
            .upsert({ id: userId, email: teacher.email, role: "teacher" });
          if (roleError) throw roleError;
          const { error: linkError } = await client
            .from("enseignants_details")
            .update({ user_id: userId })
            .eq("id", teacher.id);
          if (linkError) throw linkError;
        } catch (error) {
          const { error: cleanupError } =
            await client.auth.admin.deleteUser(userId);
          if (cleanupError)
            console.error(
              "[teacher-accounts] Invitation cleanup failed:",
              cleanupError.code,
            );
          throw error;
        }
        teacher.user_id = userId;
      };

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
        if (values.assignedclasses.length) {
          const { data: classes, error } = await client
            .from("classes")
            .select("id")
            .in("id", values.assignedclasses);
          if (error || classes?.length !== values.assignedclasses.length)
            return json(
              { error: "Une classe sélectionnée est introuvable." },
              400,
            );
        }
        const { data: existing, error: lookupError } = await client
          .from("enseignants_details")
          .select("id")
          .eq("email", values.email)
          .maybeSingle();
        if (lookupError) throw lookupError;
        if (existing)
          return json({ error: "Cet enseignant est déjà enregistré." }, 409);
        const teacherAccessId =
          "SC-T-" + crypto.randomUUID().slice(0, 5).toUpperCase();
        const teacherInsert = {
          ...values,
          assignedclasses: serializeAssignedClassIds(values.assignedclasses),
          classe_id: values.assignedclasses[0] ?? null,
          teacherAccessId,
        };
        const { data: teacher, error } = await client
          .from("enseignants_details")
          .insert(teacherInsert)
          .select("*")
          .single();
        if (error || !teacher)
          throw error ?? new Error("Impossible de créer l'enseignant.");
        try {
          await invite(teacher as TeacherRecord);
        } catch (invitationError) {
          console.error(
            "[teacher-accounts] Invitation failed:",
            invitationError instanceof Error
              ? invitationError.message
              : "Unknown error",
          );
          if (invitationError instanceof ExistingAuthAccountError) {
            return json(
              { error: EXISTING_ACCOUNT_MESSAGE, partial: true },
              409,
            );
          }
          return json(
            {
              error:
                "La fiche enseignant a été créée, mais l'invitation a échoué. Réessayez depuis la liste des enseignants.",
              partial: true,
            },
            502,
          );
        }
        return json({ teacher: toTeacher(teacher as TeacherRecord) }, 201);
      }

      if (
        !["invite", "delete", "assign-classes"].includes(String(input.action))
      )
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
        if (classIds.length) {
          const { data: classes, error } = await client
            .from("classes")
            .select("id")
            .in("id", classIds);
          if (error || classes?.length !== classIds.length)
            return json(
              { error: "Une classe sélectionnée est introuvable." },
              400,
            );
        }
        const { data: updated, error } = await client
          .from("enseignants_details")
          .update({
            assignedclasses: serializeAssignedClassIds(classIds),
            classe_id: classIds[0] ?? null,
          })
          .eq("id", record.id)
          .select("*")
          .single();
        if (error || !updated)
          throw (
            error ??
            new Error("Impossible de mettre à jour les classes du professeur.")
          );
        return json({ teacher: toTeacher(updated as TeacherRecord) });
      }
      if (input.action === "invite") {
        await invite(record);
        return json({ teacher: toTeacher(record) });
      }
      if (record.user_id) {
        const { data: targetProfile, error } = await client
          .from("profiles")
          .select("role")
          .eq("id", record.user_id)
          .maybeSingle();
        if (error || targetProfile?.role !== "teacher")
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
      if (error instanceof ExistingAuthAccountError)
        return json({ error: EXISTING_ACCOUNT_MESSAGE }, 409);
      return json(
        {
          error:
            "L'opération enseignant a échoué. Vérifiez la configuration et les relations dans Supabase.",
        },
        500,
      );
    }
  };
}
