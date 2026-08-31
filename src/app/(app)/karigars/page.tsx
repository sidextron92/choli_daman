import Link from "next/link";
import { ArrowRight, Search, UserRound } from "lucide-react";
import { CreateKarigarModal } from "@/components/create-karigar-modal";
import { KarigarForm } from "@/components/karigar-form";
import { PageHeader } from "@/components/page-header";
import { getKarigars } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function KarigarsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const karigars = await getKarigars(q);
  return <>
    <PageHeader title="Karigars" description={`${karigars.length} craftspeople in this view.`} />
    <CreateKarigarModal><KarigarForm /></CreateKarigarModal>
    <form className="karigar-search-bar" method="get"><div className="search-field"><Search size={18} /><input name="q" defaultValue={q} placeholder="Search by name or mobile number" aria-label="Search karigars" /><button className="search-submit" type="submit" title="Search" aria-label="Search"><Search size={17} /></button></div></form>
    {karigars.length ? <div className="people-grid">{karigars.map((karigar) => <Link href={`/karigars/${karigar.id}`} className="person-card" key={karigar.id}><div className="avatar"><UserRound /></div><div><h2>{karigar.name}</h2><p>{karigar.mobile_number}</p><small>Added {formatDate(karigar.created_at)}</small></div><ArrowRight className="person-arrow" /></Link>)}</div> : <div className="empty-state"><UserRound /><h2>No karigars found</h2><p>Add the first workshop partner or clear your search.</p></div>}
  </>;
}
