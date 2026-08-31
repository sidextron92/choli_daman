import { Search } from "lucide-react";
import { CreateDesignModal } from "@/components/create-design-modal";
import { DesignFilters } from "@/components/design-filters";
import { DesignForm } from "@/components/design-form";
import { InfiniteDesignGrid } from "@/components/infinite-design-grid";
import { PageHeader } from "@/components/page-header";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { DESIGN_CATEGORIES } from "@/lib/constants";
import { getClothTypes, getDesigns, getKarigars } from "@/lib/data";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function value(input: string | string[] | undefined) { return Array.isArray(input) ? input[0] : input; }

export default async function DesignsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = {
    q: value(raw.q), category: value(raw.category), clothType: value(raw.clothType), karigarId: value(raw.karigarId),
    sort: value(raw.sort) as "newest" | "oldest" | "cost-high" | "cost-low" | undefined,
  };
  const showKarigar = value(raw.showKarigar) === "yes";
  const [result, karigars, clothTypes] = await Promise.all([getDesigns(filters), getKarigars(), getClothTypes()]);
  const filterKey = `${JSON.stringify({ ...filters, showKarigar })}:${result.designs.map((design) => `${design.id}:${design.updated_at}`).join("|")}`;
  return <PullToRefresh>
    <PageHeader title="Designs" description={`${result.total.toLocaleString("en-IN")} designs match your current view.`} />
    <CreateDesignModal><DesignForm karigars={karigars} clothTypes={clothTypes} categories={DESIGN_CATEGORIES} /></CreateDesignModal>
    <DesignFilters values={{ ...filters, showKarigar }} categories={DESIGN_CATEGORIES} karigars={karigars} clothTypes={clothTypes} />
    {result.designs.length ? <InfiniteDesignGrid key={filterKey} initialDesigns={result.designs} initialPage={result.page} initialTotalPages={result.totalPages} filters={filters} showKarigar={showKarigar} /> : <div className="empty-state"><Search /><h2>No designs found</h2><p>Try clearing a filter or add a new design.</p></div>}
  </PullToRefresh>;
}
