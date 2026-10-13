import { createClient } from "@supabase/supabase-js";
import { createTeacherAccountsHandler } from "./handler.ts";

const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing server configuration: " + name);
  return value;
};

const client = createClient(
  required("SUPABASE_URL"),
  required("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
Deno.serve(
  createTeacherAccountsHandler({
    client,
    adminOrigin: required("ADMIN_ORIGIN"),
  }),
);
