import "server-only";

import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { DESIGNS_PER_PAGE } from "@/lib/constants";
import type {
  ClothType,
  DashboardStats,
  Design,
  DesignClothType,
  DesignFilters,
  Karigar,
  KarigarWithDesigns,
  PaginatedDesigns,
} from "@/lib/types";

function normalizeDesign(row: Record<string, unknown>): Design {
  const clothTypes = Array.isArray(row.cloth_types) ? row.cloth_types : [];
  return {
    id: String(row.id),
    image_url: String(row.image_url),
    cost: Number(row.cost ?? 0),
    karigar_id: row.karigar_id ? String(row.karigar_id) : null,
    sequence_number: Number(row.sequence_number),
    category: String(row.category ?? "S/D"),
    design_type: row.design_type === "OPEN_DESIGN" ? "OPEN_DESIGN" : "REGULAR_DESIGN",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    karigar_name: row.karigar_name ? String(row.karigar_name) : null,
    karigar_mobile: row.karigar_mobile ? String(row.karigar_mobile) : null,
    cloth_types: clothTypes.map((item) => {
      const value = item as Record<string, unknown>;
      return {
        cloth_type_id: String(value.cloth_type_id),
        cloth_type_name: String(value.cloth_type_name),
        sell_price: Number(value.sell_price),
      } satisfies DesignClothType;
    }),
  };
}

function normalizeKarigar(row: Record<string, unknown>): Karigar {
  return {
    id: String(row.id),
    name: String(row.name),
    mobile_number: String(row.mobile_number),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireUser();
  const supabase = createAdminClient();
  const [designs, assigned, karigars] = await Promise.all([
    supabase.from("designs").select("id", { count: "exact", head: true }),
    supabase.from("designs").select("id", { count: "exact", head: true }).not("karigar_id", "is", null),
    supabase.from("karigars").select("id", { count: "exact", head: true }),
  ]);

  const error = designs.error ?? assigned.error ?? karigars.error;
  if (error) throw new Error(error.message);
  const totalDesigns = designs.count ?? 0;
  const assignedDesigns = assigned.count ?? 0;
  return {
    totalDesigns,
    totalKarigars: karigars.count ?? 0,
    assignedDesigns,
    unassignedDesigns: totalDesigns - assignedDesigns,
  };
}

export async function getRecentDesigns(limit = 6) {
  await requireUser();
  const { data, error } = await createAdminClient()
    .from("designs_with_karigar")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeDesign(row));
}

export async function getDesigns(filters: DesignFilters): Promise<PaginatedDesigns> {
  await requireUser();
  const supabase = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * DESIGNS_PER_PAGE;
  const search = filters.q?.trim();

  const [clothFilterResult, searchIds] = await Promise.all([
    filters.clothType
      ? supabase.from("design_cloth_types").select("design_id").eq("cloth_type_id", filters.clothType)
      : Promise.resolve({ data: null, error: null }),
    search ? findDesignIdsForSearch(search) : Promise.resolve<string[] | null>(null),
  ]);
  if (clothFilterResult.error) throw new Error(clothFilterResult.error.message);

  const clothIds = clothFilterResult.data?.map((row) => String(row.design_id)) ?? null;
  let eligibleIds = searchIds;
  if (clothIds) {
    const clothSet = new Set(clothIds);
    eligibleIds = eligibleIds ? eligibleIds.filter((id) => clothSet.has(id)) : clothIds;
  }
  if (eligibleIds && eligibleIds.length === 0) {
    return { designs: [], page: 1, total: 0, totalPages: 1 };
  }

  let query = supabase.from("designs_with_karigar").select("*", { count: "exact" });
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.karigarId) query = query.eq("karigar_id", filters.karigarId);
  if (eligibleIds) query = query.in("id", eligibleIds);

  const sort = filters.sort ?? "newest";
  const sortColumn = sort.startsWith("cost-") ? "cost" : "created_at";
  const ascending = sort === "oldest" || sort === "cost-low";
  const { data, error, count } = await query
    .order(sortColumn, { ascending })
    .order("id", { ascending })
    .range(offset, offset + DESIGNS_PER_PAGE - 1);
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DESIGNS_PER_PAGE));
  return { designs: (data ?? []).map((row) => normalizeDesign(row)), page, total, totalPages };
}

async function findDesignIdsForSearch(search: string): Promise<string[]> {
  const supabase = createAdminClient();
  const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
  const sequenceNumber = Number(search);
  const [categoryResult, karigarResult, clothResult, sequenceResult] = await Promise.all([
    supabase.from("designs").select("id").ilike("category", pattern).limit(1000),
    supabase.from("karigars").select("id").ilike("name", pattern).limit(1000),
    supabase.from("cloth_types").select("id").ilike("name", pattern).limit(1000),
    Number.isInteger(sequenceNumber)
      ? supabase.from("designs").select("id").eq("sequence_number", sequenceNumber)
      : Promise.resolve({ data: null, error: null }),
  ]);
  const firstError = categoryResult.error ?? karigarResult.error ?? clothResult.error ?? sequenceResult.error;
  if (firstError) throw new Error(firstError.message);

  const karigarIds = karigarResult.data?.map((row) => String(row.id)) ?? [];
  const clothTypeIds = clothResult.data?.map((row) => String(row.id)) ?? [];
  const [karigarDesigns, clothDesigns] = await Promise.all([
    karigarIds.length
      ? supabase.from("designs").select("id").in("karigar_id", karigarIds).limit(1000)
      : Promise.resolve({ data: null, error: null }),
    clothTypeIds.length
      ? supabase.from("design_cloth_types").select("design_id").in("cloth_type_id", clothTypeIds).limit(1000)
      : Promise.resolve({ data: null, error: null }),
  ]);
  const relationError = karigarDesigns.error ?? clothDesigns.error;
  if (relationError) throw new Error(relationError.message);

  return [...new Set([
    ...(categoryResult.data ?? []).map((row) => String(row.id)),
    ...(sequenceResult.data ?? []).map((row) => String(row.id)),
    ...(karigarDesigns.data ?? []).map((row) => String(row.id)),
    ...(clothDesigns.data ?? []).map((row) => String(row.design_id)),
  ])];
}

export async function getDesign(id: string) {
  await requireUser();
  const { data, error } = await createAdminClient()
    .from("designs_with_karigar")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) notFound();
  return normalizeDesign(data);
}

export async function getKarigars(search?: string) {
  await requireUser();
  const { data, error } = await createAdminClient()
    .from("karigars")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  let karigars = (data ?? []).map((row) => normalizeKarigar(row));
  const q = search?.trim().toLocaleLowerCase();
  if (q) karigars = karigars.filter((k) => k.name.toLocaleLowerCase().includes(q) || k.mobile_number.includes(q));
  return karigars;
}

export async function getKarigar(id: string): Promise<KarigarWithDesigns> {
  await requireUser();
  const supabase = createAdminClient();
  const [karigarResult, designsResult] = await Promise.all([
    supabase.from("karigars").select("*").eq("id", id).single(),
    supabase.from("designs_with_karigar").select("*").eq("karigar_id", id).order("created_at", { ascending: false }),
  ]);
  if (karigarResult.error || !karigarResult.data) notFound();
  if (designsResult.error) throw new Error(designsResult.error.message);
  return {
    ...normalizeKarigar(karigarResult.data),
    assigned_designs: (designsResult.data ?? []).map((row) => normalizeDesign(row)),
  };
}

export async function getClothTypes(): Promise<ClothType[]> {
  await requireUser();
  const { data, error } = await createAdminClient()
    .from("cloth_types")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}

export async function getAllDesignsForExport() {
  await requireUser();
  const { data, error } = await createAdminClient().from("designs_with_karigar").select("*").limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeDesign(row));
}
