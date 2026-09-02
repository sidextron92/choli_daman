"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { DESIGN_BUCKET, DESIGN_CATEGORIES, MAX_IMAGE_BYTES } from "@/lib/constants";
import { storageObjectPath } from "@/lib/format";
import type { ActionState } from "@/lib/types";

const baseSchema = z.object({
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  category: z.enum(DESIGN_CATEGORIES, { message: "Choose a valid category" }),
  karigar_id: z.string().uuid().or(z.literal("")),
  cloth_type_ids: z.array(z.string().uuid()).min(1, "Choose at least one cloth type"),
});

function parseDesignForm(formData: FormData) {
  const clothTypeIds = formData.getAll("cloth_type_ids").map(String);
  const parsed = baseSchema.safeParse({
    cost: formData.get("cost"),
    category: formData.get("category"),
    karigar_id: formData.get("karigar_id") ?? "",
    cloth_type_ids: clothTypeIds,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      state: {
        status: "error" as const,
        message: "Please check the form.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const clothTypes = clothTypeIds.map((id) => ({
    cloth_type_id: id,
    sell_price: Number(formData.get(`price_${id}`)),
  }));
  if (clothTypes.some((item) => !Number.isFinite(item.sell_price) || item.sell_price < 0)) {
    return {
      ok: false as const,
      state: {
        status: "error" as const,
        message: "Every selected cloth type needs a valid non-negative sell price.",
      },
    };
  }
  return { ok: true as const, data: parsed.data, clothTypes };
}

function safeFileName(name: string) {
  return name.toLocaleLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "design-image";
}

function validateImage(file: File, required: boolean): string | null {
  if (!file.size) return required ? "A design image is required." : null;
  if (!file.type.startsWith("image/")) return "Only image files are allowed.";
  if (file.size > MAX_IMAGE_BYTES) return "Image must be smaller than 10 MB.";
  return null;
}

async function uploadImage(file: File) {
  const supabase = createAdminClient();
  const path = `designs/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(DESIGN_BUCKET).upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    cacheControl: "86400",
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(DESIGN_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function createDesignAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const parsed = parseDesignForm(formData);
  if (!parsed.ok) return parsed.state;

  const file = formData.get("image");
  if (!(file instanceof File)) return { status: "error", message: "A design image is required." };
  const imageError = validateImage(file, true);
  if (imageError) return { status: "error", message: imageError };

  const supabase = createAdminClient();
  let uploadedPath: string | null = null;
  let designId: string | null = null;
  try {
    const upload = await uploadImage(file);
    uploadedPath = upload.path;
    const { data: design, error } = await supabase
      .from("designs")
      .insert({
        image_url: upload.publicUrl,
        cost: parsed.data.cost,
        category: parsed.data.category,
        karigar_id: parsed.data.karigar_id || null,
        design_type: "REGULAR_DESIGN",
      })
      .select("id")
      .single();
    if (error || !design) throw new Error(error?.message ?? "Design could not be created");
    designId = design.id;

    const { error: clothError } = await supabase.from("design_cloth_types").insert(
      parsed.clothTypes.map((item) => ({ ...item, design_id: design.id })),
    );
    if (clothError) throw new Error(clothError.message);
  } catch (error) {
    if (designId) await supabase.from("designs").delete().eq("id", designId);
    if (uploadedPath) await supabase.storage.from(DESIGN_BUCKET).remove([uploadedPath]);
    return { status: "error", message: error instanceof Error ? error.message : "Design could not be created." };
  }

  revalidatePath("/");
  revalidatePath("/designs");
  return { status: "success", message: "Design created successfully." };
}

export async function updateDesignAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return { status: "error", message: "Invalid design." };
  const parsed = parseDesignForm(formData);
  if (!parsed.ok) return parsed.state;

  const file = formData.get("image");
  const hasFile = file instanceof File && file.size > 0;
  if (hasFile) {
    const imageError = validateImage(file, false);
    if (imageError) return { status: "error", message: imageError };
  }

  const supabase = createAdminClient();
  const [{ data: previous, error: previousError }, { data: previousCloth, error: clothReadError }] = await Promise.all([
    supabase.from("designs").select("image_url,cost,category,karigar_id").eq("id", id).single(),
    supabase.from("design_cloth_types").select("cloth_type_id,sell_price").eq("design_id", id),
  ]);
  if (previousError || !previous || clothReadError) return { status: "error", message: "Design could not be loaded." };

  let uploadedPath: string | null = null;
  try {
    let imageUrl = previous.image_url;
    if (hasFile && file instanceof File) {
      const upload = await uploadImage(file);
      uploadedPath = upload.path;
      imageUrl = upload.publicUrl;
    }

    const { error: updateError } = await supabase.from("designs").update({
      image_url: imageUrl,
      cost: parsed.data.cost,
      category: parsed.data.category,
      karigar_id: parsed.data.karigar_id || null,
    }).eq("id", id);
    if (updateError) throw new Error(updateError.message);

    const { error: deleteError } = await supabase.from("design_cloth_types").delete().eq("design_id", id);
    if (deleteError) throw new Error(deleteError.message);
    const { error: insertError } = await supabase.from("design_cloth_types").insert(
      parsed.clothTypes.map((item) => ({ ...item, design_id: id })),
    );
    if (insertError) throw new Error(insertError.message);

    if (uploadedPath) {
      const oldPath = storageObjectPath(previous.image_url);
      if (oldPath) await supabase.storage.from(DESIGN_BUCKET).remove([oldPath]);
    }
  } catch (error) {
    await supabase.from("designs").update(previous).eq("id", id);
    await supabase.from("design_cloth_types").delete().eq("design_id", id);
    if (previousCloth?.length) {
      await supabase.from("design_cloth_types").insert(previousCloth.map((item) => ({ ...item, design_id: id })));
    }
    if (uploadedPath) await supabase.storage.from(DESIGN_BUCKET).remove([uploadedPath]);
    return { status: "error", message: error instanceof Error ? error.message : "Design could not be updated." };
  }

  revalidatePath("/");
  revalidatePath("/designs");
  revalidatePath(`/designs/${id}/share`);
  return { status: "success", message: "Design updated successfully." };
}

export async function deleteDesignAction(id: string): Promise<ActionState> {
  await requireUser();
  if (!z.string().uuid().safeParse(id).success) return { status: "error", message: "Invalid design." };
  const supabase = createAdminClient();
  const { data: design, error: readError } = await supabase.from("designs").select("image_url").eq("id", id).single();
  if (readError || !design) return { status: "error", message: "Design was not found." };
  const { error } = await supabase.from("designs").delete().eq("id", id);
  if (error) return { status: "error", message: error.message };
  const path = storageObjectPath(design.image_url);
  if (path) await supabase.storage.from(DESIGN_BUCKET).remove([path]);
  revalidatePath("/");
  revalidatePath("/designs");
  return { status: "success", message: "Design deleted." };
}
