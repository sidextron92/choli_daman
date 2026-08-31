import Link from "next/link";
import { ArrowLeft, MessageSquare, Phone, UserRound } from "lucide-react";
import { DeleteControl } from "@/components/delete-control";
import { DesignCard } from "@/components/design-card";
import { KarigarForm } from "@/components/karigar-form";
import { getKarigar } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function KarigarProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const karigar = await getKarigar(id);
  return <>
    <Link href="/karigars" className="back-link"><ArrowLeft size={17} /> Back to karigars</Link>
    <section className="profile-hero"><div className="profile-avatar"><UserRound /></div><div className="profile-copy"><p className="eyebrow">Karigar profile</p><h1>{karigar.name}</h1><p>{karigar.mobile_number} · Partner since {formatDate(karigar.created_at)}</p></div><div className="header-actions"><a className="button secondary" href={`tel:${karigar.mobile_number}`}><Phone size={17} /> Call</a><a className="button secondary" href={`sms:${karigar.mobile_number}`}><MessageSquare size={17} /> SMS</a></div></section>
    <div className="profile-columns"><details className="create-panel inline-panel"><summary className="button secondary">Edit details</summary><div className="panel-body narrow"><KarigarForm karigar={karigar} /></div></details><div className="danger-zone"><div><strong>Delete karigar</strong><p>All assigned designs must be removed or reassigned first.</p></div><DeleteControl id={karigar.id} kind="karigar" redirectTo="/karigars" /></div></div>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Assigned work</p><h2>{karigar.assigned_designs.length} designs</h2></div></div>{karigar.assigned_designs.length ? <div className="design-grid">{karigar.assigned_designs.map((design, index) => <DesignCard key={design.id} design={design} eager={index === 0} />)}</div> : <div className="empty-state"><UserRound /><h2>No assigned designs</h2><p>This karigar can now be deleted.</p></div>}</section>
  </>;
}
