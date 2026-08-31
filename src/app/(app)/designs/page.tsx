import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { DesignCard } from "@/components/design-card";
import { DesignFilters } from "@/components/design-filters";
import { DesignForm } from "@/components/design-form";
import { PageHeader } from "@/components/page-header";
import { DESIGN_CATEGORIES } from "@/lib/constants";
import { getClothTypes, getDesigns, getKarigars } from "@/lib/data";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function value(input: string | string[] | undefined) { return Array.isArray(input) ? input[0] : input; }

export default async function DesignsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = {
    q: value(raw.q), category: value(raw.category), clothType: value(raw.clothType), karigarId: value(raw.karigarId),
    sort: value(raw.sort) as "newest" | "oldest" | "cost-high" | "cost-low" | undefined,
    page: Number(value(raw.page) ?? 1),
  };
  const showKarigar = value(raw.showKarigar) === "yes";
  const [result, karigars, clothTypes] = await Promise.all([getDesigns(filters), getKarigars(), getClothTypes()]);
  const pageHref = (page: number) => { const params = new URLSearchParams(); Object.entries(filters).forEach(([key, val]) => { if (val && key !== "page") params.set(key, String(val)); }); if (showKarigar) params.set("showKarigar", "yes"); params.set("page", String(page)); return `/designs?${params}`; };
  return <>
    <PageHeader eyebrow="Design catalogue" title="Designs" description={`${result.total.toLocaleString("en-IN")} designs match your current view.`} />
    <details className="create-panel design-create-panel"><summary className="button primary floating-add-button"><Plus size={18} /> <span>Add design</span></summary><div className="panel-body"><h2>New design</h2><DesignForm karigars={karigars} clothTypes={clothTypes} categories={DESIGN_CATEGORIES} /></div></details>
    <DesignFilters values={{ ...filters, showKarigar }} categories={DESIGN_CATEGORIES} karigars={karigars} clothTypes={clothTypes} />
    {result.designs.length ? <div className="design-grid">{result.designs.map((design, index) => <DesignCard key={design.id} design={design} eager={index < 5} showKarigar={showKarigar} />)}</div> : <div className="empty-state"><Search /><h2>No designs found</h2><p>Try clearing a filter or add a new design.</p></div>}
    {result.totalPages > 1 && <nav className="pagination" aria-label="Design pages"><Link className={result.page <= 1 ? "disabled" : ""} href={pageHref(result.page - 1)}><ChevronLeft /> Previous</Link><span>Page {result.page} of {result.totalPages}</span><Link className={result.page >= result.totalPages ? "disabled" : ""} href={pageHref(result.page + 1)}>Next <ChevronRight /></Link></nav>}
  </>;
}
