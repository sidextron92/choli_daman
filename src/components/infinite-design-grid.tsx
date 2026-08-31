"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DesignCard } from "@/components/design-card";
import type { Design, DesignFilters, PaginatedDesigns } from "@/lib/types";

export function InfiniteDesignGrid({
  initialDesigns,
  initialPage,
  initialTotalPages,
  filters,
  showKarigar,
}: {
  initialDesigns: Design[];
  initialPage: number;
  initialTotalPages: number;
  filters: Omit<DesignFilters, "page">;
  showKarigar: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [designs, setDesigns] = useState(initialDesigns);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadMore = useCallback(async () => {
    if (loadingRef.current || page >= totalPages) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page + 1) });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });
      const response = await fetch(`/api/designs?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("The next designs could not be loaded.");
      const result = await response.json() as PaginatedDesigns;
      setDesigns((current) => {
        const existingIds = new Set(current.map((design) => design.id));
        return [...current, ...result.designs.filter((design) => !existingIds.has(design.id))];
      });
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The next designs could not be loaded.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [filters, page, totalPages]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || page >= totalPages || error) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    }, { rootMargin: "600px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, loadMore, page, totalPages]);

  return <>
    <div className="design-grid">
      {designs.map((design, index) => <DesignCard key={design.id} design={design} eager={index < 5} showKarigar={showKarigar} />)}
    </div>
    <div className="infinite-scroll-status" ref={sentinelRef} aria-live="polite">
      {loading ? <><span className="mini-spinner" /> Loading more designs…</> : null}
      {error ? <><span>{error}</span><button className="button secondary small" type="button" onClick={() => void loadMore()}>Try again</button></> : null}
      {!loading && !error && page >= totalPages ? <span>All designs loaded</span> : null}
    </div>
  </>;
}
