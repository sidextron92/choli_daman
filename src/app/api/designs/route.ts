import { getCurrentUser } from "@/lib/auth";
import { getDesigns } from "@/lib/data";
import type { DesignFilters } from "@/lib/types";

const SORTS = new Set<NonNullable<DesignFilters["sort"]>>(["newest", "oldest", "cost-high", "cost-low"]);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const requestedSort = params.get("sort") as DesignFilters["sort"];
  const requestedPage = Number(params.get("page") ?? 1);
  const filters: DesignFilters = {
    q: params.get("q") || undefined,
    category: params.get("category") || undefined,
    clothType: params.get("clothType") || undefined,
    karigarId: params.get("karigarId") || undefined,
    sort: requestedSort && SORTS.has(requestedSort) ? requestedSort : "newest",
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };

  try {
    const result = await getDesigns(filters);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Designs could not be loaded." },
      { status: 500 },
    );
  }
}
