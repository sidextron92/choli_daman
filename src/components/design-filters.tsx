"use client";

import Link from "next/link";
import { ChevronDown, Filter, Search, X } from "lucide-react";
import { useState } from "react";
import type { ClothType, Karigar } from "@/lib/types";

type FilterValues = {
  q?: string;
  category?: string;
  clothType?: string;
  karigarId?: string;
  showKarigar: boolean;
  sort?: "newest" | "oldest" | "cost-high" | "cost-low";
};

export function DesignFilters({
  values,
  categories,
  clothTypes,
  karigars,
}: {
  values: FilterValues;
  categories: readonly string[];
  clothTypes: ClothType[];
  karigars: Karigar[];
}) {
  const activeFilterCount = [values.category, values.clothType, values.karigarId, values.showKarigar, values.sort && values.sort !== "newest"].filter(Boolean).length;
  const [expanded, setExpanded] = useState(false);
  const clearHref = values.q ? `/designs?q=${encodeURIComponent(values.q)}` : "/designs";

  return (
    <form className="filter-bar design-filter-bar" method="get" onSubmit={() => setExpanded(false)}>
      <div className="filter-toolbar">
        <div className="search-field">
          <Search size={18} />
          <input name="q" defaultValue={values.q} placeholder="Search number, category, cloth or karigar" aria-label="Search designs" />
          <button className="search-submit" type="submit" title="Search" aria-label="Search"><Search size={17} /></button>
        </div>
        <button className={`button secondary filter-trigger${expanded ? " active" : ""}`} type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded} aria-controls="design-filter-options">
          <Filter size={16} /> Filters {activeFilterCount > 0 ? <span className="filter-count">{activeFilterCount}</span> : null}<ChevronDown className="filter-chevron" size={15} />
        </button>
      </div>
      <section className="filter-options" id="design-filter-options" hidden={!expanded} aria-label="Design filters">
        <label><span>Category</span><select name="category" defaultValue={values.category ?? ""}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label><span>Cloth type</span><select name="clothType" defaultValue={values.clothType ?? ""}><option value="">All cloth types</option>{clothTypes.map((cloth) => <option key={cloth.id} value={cloth.id}>{cloth.name}</option>)}</select></label>
        <label><span>Karigar</span><select name="karigarId" defaultValue={values.karigarId ?? ""}><option value="">All karigars</option>{karigars.map((karigar) => <option key={karigar.id} value={karigar.id}>{karigar.name}</option>)}</select></label>
        <label><span>Karigar visible</span><select name="showKarigar" defaultValue={values.showKarigar ? "yes" : "no"}><option value="no">No</option><option value="yes">Yes</option></select></label>
        <label><span>Sort by</span><select name="sort" defaultValue={values.sort ?? "newest"}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="cost-high">Cost: high to low</option><option value="cost-low">Cost: low to high</option></select></label>
        <div className="filter-actions"><Link className="button ghost small" href={clearHref} onClick={() => setExpanded(false)}><X size={15} /> Clear filters</Link><button className="button primary small" type="submit"><Filter size={15} /> Apply filters</button></div>
      </section>
    </form>
  );
}
