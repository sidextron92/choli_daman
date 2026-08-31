"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { DESIGN_BUCKET, DEFAULT_DESIGN_CATEGORY } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  mobile_number: z.string().trim().min(10, "Mobile number must have at least 10 digits").max(15, "Mobile number is too long"),
});

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

function openDesignSvg(name: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" rx="48" fill="#edf4fb"/><circle cx="300" cy="230" r="92" fill="#1d5fbf" opacity=".12"/><path d="M230 360c35-45 105-45 140 0" fill="none" stroke="#1d5fbf" stroke-width="18" stroke-linecap="round"/><text x="300" y="470" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700" fill="#172033">${escapeXml(name)}</text><text x="300" y="515" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#1d5fbf">OPEN DESIGN</text></svg>`;
}

async function createOpenDesign(karigar: { id: string; name: string }) {
  const supabase = createAdminClient();
  const path = `open-designs/${karigar.id}-${crypto.randomUUID()}.svg`;
  const { error: uploadError } = await supabase.storage.from(DESIGN_BUCKET).upload(path, openDesignSvg(karigar.name), {
    contentType: "image/svg+xml",
    cacheControl: "86400",
  });
  if (uploadError) throw new Error(uploadError.message);
  const { data: publicData } = supabase.storage.from(DESIGN_BUCKET).getPublicUrl(path);
  const { error: designError } = await supabase.from("designs").insert({
    image_url: publicData.publicUrl,
    cost: 0,
    karigar_id: karigar.id,
    design_type: "OPEN_DESIGN",
    category: DEFAULT_DESIGN_CATEGORY,
  });
  if (designError) {
    await supabase.storage.from(DESIGN_BUCKET).remove([path]);
    throw new Error(designError.message);
  }
}

export async function createKarigarAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = schema.safeParse({ name: formData.get("name"), mobile_number: formData.get("mobile_number") });
  if (!parsed.success) return { status: "error", message: "Please check the form.", fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("karigars").insert(parsed.data).select("id,name").single();
  if (error || !data) {
    const message = error?.code === "23505" ? "A karigar with this mobile number already exists." : error?.message ?? "Karigar could not be created.";
    return { status: "error", message };
  }
  try {
    await createOpenDesign(data);
  } catch (error) {
    await supabase.from("karigars").delete().eq("id", data.id);
    return { status: "error", message: error instanceof Error ? `Open Design could not be created: ${error.message}` : "Open Design could not be created." };
  }
  revalidatePath("/");
  revalidatePath("/karigars");
  revalidatePath("/designs");
  return { status: "success", message: "Karigar added and Open Design created." };
}

export async function updateKarigarAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({ name: formData.get("name"), mobile_number: formData.get("mobile_number") });
  if (!z.string().uuid().safeParse(id).success) return { status: "error", message: "Invalid karigar." };
  if (!parsed.success) return { status: "error", message: "Please check the form.", fieldErrors: parsed.error.flatten().fieldErrors };
  const { error } = await createAdminClient().from("karigars").update(parsed.data).eq("id", id);
  if (error) return { status: "error", message: error.code === "23505" ? "That mobile number is already in use." : error.message };
  revalidatePath("/karigars");
  revalidatePath(`/karigars/${id}`);
  revalidatePath("/designs");
  return { status: "success", message: "Karigar updated." };
}

export async function deleteKarigarAction(id: string): Promise<ActionState> {
  await requireUser();
  if (!z.string().uuid().safeParse(id).success) return { status: "error", message: "Invalid karigar." };
  const supabase = createAdminClient();
  const { count, error: countError } = await supabase.from("designs").select("id", { count: "exact", head: true }).eq("karigar_id", id);
  if (countError) return { status: "error", message: countError.message };
  if ((count ?? 0) > 0) return { status: "error", message: "Delete or reassign every design, including the Open Design, before deleting this karigar." };
  const { error } = await supabase.from("karigars").delete().eq("id", id);
  if (error) return { status: "error", message: error.message };
  revalidatePath("/");
  revalidatePath("/karigars");
  return { status: "success", message: "Karigar deleted." };
}
