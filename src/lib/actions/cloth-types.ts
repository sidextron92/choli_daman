"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().trim().max(500, "Description is too long").optional(),
});

function values(formData: FormData) {
  return { name: formData.get("name"), description: formData.get("description") || undefined };
}

export async function createClothTypeAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = schema.safeParse(values(formData));
  if (!parsed.success) return { status: "error", message: "Please check the form.", fieldErrors: parsed.error.flatten().fieldErrors };
  const { error } = await createAdminClient().from("cloth_types").insert({ ...parsed.data, description: parsed.data.description ?? null });
  if (error) return { status: "error", message: error.code === "23505" ? "A cloth type with this name already exists." : error.message };
  revalidatePath("/cloth-types");
  revalidatePath("/designs");
  return { status: "success", message: "Cloth type created." };
}

export async function updateClothTypeAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse(values(formData));
  if (!z.string().uuid().safeParse(id).success) return { status: "error", message: "Invalid cloth type." };
  if (!parsed.success) return { status: "error", message: "Please check the form.", fieldErrors: parsed.error.flatten().fieldErrors };
  const { error } = await createAdminClient().from("cloth_types").update({ ...parsed.data, description: parsed.data.description ?? null }).eq("id", id);
  if (error) return { status: "error", message: error.code === "23505" ? "A cloth type with this name already exists." : error.message };
  revalidatePath("/cloth-types");
  revalidatePath("/designs");
  return { status: "success", message: "Cloth type updated." };
}

export async function deleteClothTypeAction(id: string): Promise<ActionState> {
  await requireUser();
  if (!z.string().uuid().safeParse(id).success) return { status: "error", message: "Invalid cloth type." };
  const supabase = createAdminClient();
  const { count, error: countError } = await supabase.from("design_cloth_types").select("id", { count: "exact", head: true }).eq("cloth_type_id", id);
  if (countError) return { status: "error", message: countError.message };
  if ((count ?? 0) > 0) return { status: "error", message: "This cloth type is used by one or more designs and cannot be deleted." };
  const { error } = await supabase.from("cloth_types").delete().eq("id", id);
  if (error) return { status: "error", message: error.message };
  revalidatePath("/cloth-types");
  revalidatePath("/designs");
  return { status: "success", message: "Cloth type deleted." };
}
