import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const { error } = await createAdminClient().from("karigars").select("id", { head: true }).limit(1);
  return Response.json({ status: error ? "degraded" : "ok", database: error ? "unavailable" : "connected" }, { status: error ? 503 : 200 });
}
