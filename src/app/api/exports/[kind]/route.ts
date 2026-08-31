import { createSessionClient, createAdminClient } from "@/lib/supabase/server";
import { formatDesignNumber } from "@/lib/format";
import type { Design } from "@/lib/types";

function csvValue(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(","))].join("\n");
}

function normalizeDesign(row: Record<string, unknown>): Design {
  return {
    id: String(row.id), image_url: String(row.image_url), cost: Number(row.cost), karigar_id: row.karigar_id ? String(row.karigar_id) : null,
    sequence_number: Number(row.sequence_number), category: String(row.category), design_type: row.design_type === "OPEN_DESIGN" ? "OPEN_DESIGN" : "REGULAR_DESIGN",
    created_at: String(row.created_at), updated_at: String(row.updated_at), karigar_name: row.karigar_name ? String(row.karigar_name) : null,
    karigar_mobile: row.karigar_mobile ? String(row.karigar_mobile) : null,
    cloth_types: Array.isArray(row.cloth_types) ? row.cloth_types.map((item) => { const value = item as Record<string, unknown>; return { cloth_type_id: String(value.cloth_type_id), cloth_type_name: String(value.cloth_type_name), sell_price: Number(value.sell_price) }; }) : [],
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { kind } = await params;
  if (!new Set(["summary", "designs", "karigars"]).has(kind)) return new Response("Not found", { status: 404 });
  const supabase = createAdminClient();
  const [designResult, karigarResult] = await Promise.all([
    supabase.from("designs_with_karigar").select("*").limit(1000),
    supabase.from("karigars").select("*").order("name").limit(1000),
  ]);
  if (designResult.error || karigarResult.error) return new Response("Export unavailable", { status: 500 });
  const designs = (designResult.data ?? []).map((row) => normalizeDesign(row));
  const karigars = karigarResult.data ?? [];
  let rows: Record<string, unknown>[];

  if (kind === "designs") {
    rows = designs.map((design) => ({
      design_number: formatDesignNumber(design), category: design.category,
      cloth_types: design.cloth_types.map((cloth) => `${cloth.cloth_type_name} (${cloth.sell_price})`).join("; "), cost: design.cost,
      sell_price_min: design.cloth_types.length ? Math.min(...design.cloth_types.map((cloth) => cloth.sell_price)) : 0,
      sell_price_max: design.cloth_types.length ? Math.max(...design.cloth_types.map((cloth) => cloth.sell_price)) : 0,
      karigar_name: design.karigar_name ?? "Unassigned", karigar_mobile: design.karigar_mobile ?? "", created_at: design.created_at,
    }));
  } else if (kind === "karigars") {
    rows = karigars.map((karigar) => {
      const assigned = designs.filter((design) => design.karigar_id === karigar.id);
      return { name: karigar.name, mobile_number: karigar.mobile_number, assigned_designs: assigned.length, total_cost: assigned.reduce((sum, design) => sum + design.cost, 0), member_since: karigar.created_at };
    });
  } else {
    const assigned = designs.filter((design) => design.karigar_id);
    rows = [
      { metric: "Total Designs", value: designs.length }, { metric: "Total Karigars", value: karigars.length },
      { metric: "Assigned Designs", value: assigned.length }, { metric: "Unassigned Designs", value: designs.length - assigned.length },
      { metric: "Total Design Cost", value: designs.reduce((sum, design) => sum + design.cost, 0) },
    ];
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${kind}-${date}.csv"`, "Cache-Control": "private, no-store" } });
}
