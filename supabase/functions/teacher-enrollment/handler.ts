import type { SupabaseClient } from "@supabase/supabase-js";
import { passwordSchema } from "../../../packages/domain/src/validators/profilSchema.ts";

interface Dependencies {
  client: SupabaseClient;
  siteOrigin: string;
}

const INVALID_ACTIVATION = "Matricule invalide ou déjà utilisé.";
const ACCESS_ID_PATTERN = /^SC-T-[A-F0-9]{32}$/;

/** Public first-use claim; the one-time high-entropy matricule is its proof. */
export function createTeacherEnrollmentHandler({
  client,
  siteOrigin,
}: Dependencies) {
  const allowedOrigin = new URL(siteOrigin).origin;

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

    if (origin !== allowedOrigin)
      return json({ error: "Origine non autorisée." }, 403);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST")
      return json({ error: "Méthode non autorisée." }, 405);

    let input: Record<string, unknown>;
    try {
      const body = await request.text();
      if (body.length > 4096)
        return json({ error: "Données invalides." }, 413);
      const value: unknown = JSON.parse(body);
      if (!value || typeof value !== "object" || Array.isArray(value))
        return json({ error: "Données invalides." }, 400);
      input = value as Record<string, unknown>;
    } catch {
      return json({ error: "Données invalides." }, 400);
    }

    const teacherAccessId =
      typeof input.teacherAccessId === "string"
        ? input.teacherAccessId.trim().toUpperCase()
        : "";
    const password =
      typeof input.password === "string" ? input.password : "";
    if (!ACCESS_ID_PATTERN.test(teacherAccessId) || password.length > 128)
      return json({ error: INVALID_ACTIVATION }, 400);

    const passwordResult = passwordSchema.shape.newPassword.safeParse(password);
    if (!passwordResult.success)
      return json(
        {
          error:
            passwordResult.error.issues[0]?.message ?? "Mot de passe invalide.",
        },
        400,
      );

    let createdUserId: string | null = null;
    try {
      const { data: teacher, error: lookupError } = await client
        .from("enseignants_details")
        .select("id,user_id,fullName,email")
        .eq("teacherAccessId", teacherAccessId)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!teacher || teacher.user_id)
        return json({ error: INVALID_ACTIVATION }, 400);

      const normalizedEmail = teacher.email.trim().toLowerCase();
      if (!normalizedEmail)
        throw new Error("Teacher record has no email address.");

      const { data: authData, error: authError } =
        await client.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: { fullName: teacher.fullName },
        });
      if (authError || !authData.user) {
        if (authError?.code === "email_exists")
          return json({ error: INVALID_ACTIVATION }, 400);
        throw authError ?? new Error("Auth account creation returned no user.");
      }
      createdUserId = authData.user.id;

      if (authData.user.email?.toLowerCase() !== normalizedEmail)
        throw new Error("Created account email does not match teacher record.");

      const { error: profileError } = await client.from("profiles").upsert({
        id: createdUserId,
        email: normalizedEmail,
        role: "teacher",
      });
      if (profileError) throw profileError;

      // The conditional update makes the matricule single-use under concurrent requests.
      const { data: linked, error: linkError } = await client
        .from("enseignants_details")
        .update({ user_id: createdUserId })
        .eq("id", teacher.id)
        .is("user_id", null)
        .select("id")
        .maybeSingle();
      if (linkError) throw linkError;
      if (!linked) throw new Error("Teacher record was already claimed.");

      return json({ success: true, email: normalizedEmail }, 201);
    } catch (error) {
      if (createdUserId) {
        const { error: unlinkError } = await client
          .from("enseignants_details")
          .update({ user_id: null })
          .eq("user_id", createdUserId);
        const { error: profileCleanupError } = await client
          .from("profiles")
          .delete()
          .eq("id", createdUserId);
        const { error: authCleanupError } =
          await client.auth.admin.deleteUser(createdUserId);
        if (unlinkError || profileCleanupError || authCleanupError)
          console.error("[teacher-enrollment] Compensation failed.");
      }
      console.error(
        "[teacher-enrollment] Activation failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return json(
        { error: "Activation impossible. Vérifiez le matricule ou contactez l’administration." },
        500,
      );
    }
  };
}
