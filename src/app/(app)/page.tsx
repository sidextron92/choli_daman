import Link from "next/link";
import { ArrowRight, FileDown, Images, UserCheck, Users, UserX } from "lucide-react";
import { DesignCard } from "@/components/design-card";
import { PageHeader } from "@/components/page-header";
import { getDashboardStats, getRecentDesigns } from "@/lib/data";

export default async function HomePage() {
  const [stats, recent] = await Promise.all([getDashboardStats(), getRecentDesigns()]);
  const cards = [
    { label: "Total designs", value: stats.totalDesigns, icon: Images, tone: "wine" },
    { label: "Karigars", value: stats.totalKarigars, icon: Users, tone: "gold" },
    { label: "Assigned", value: stats.assignedDesigns, icon: UserCheck, tone: "green" },
    { label: "Unassigned", value: stats.unassignedDesigns, icon: UserX, tone: "blue" },
  ];
  return <>
    <PageHeader eyebrow="Operations overview" title="Namaste, welcome back" description="Your design catalogue and workshop partners, at a glance." />
    <section className="stats-grid">{cards.map(({ label, value, icon: Icon, tone }) => <article className={`stat-card ${tone}`} key={label}><div className="stat-icon"><Icon /></div><div><strong>{value.toLocaleString("en-IN")}</strong><span>{label}</span></div></article>)}</section>
    <section className="quick-grid home-quick-grid">
      <Link href="/designs" className="quick-card"><div><span>Catalogue</span><h2>Manage designs</h2><p>Add photography, cloth pricing and karigar assignments.</p></div><ArrowRight /></Link>
      <Link href="/karigars" className="quick-card warm"><div><span>Workshop</span><h2>Manage karigars</h2><p>Maintain contacts and see every assigned design.</p></div><ArrowRight /></Link>
    </section>
    <section className="section-block report-panel"><div><p className="eyebrow">Exports</p><h2>Take the catalogue with you</h2><p>Download clean CSV files for analysis or sharing.</p></div><div className="report-actions">
      <Link className="button secondary" href="/api/exports/designs"><FileDown size={17} /> Designs</Link>
      <Link className="button secondary" href="/api/exports/karigars"><FileDown size={17} /> Karigars</Link>
    </div></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Latest additions</p><h2>Recent designs</h2></div><Link className="text-link" href="/designs">View all <ArrowRight size={16} /></Link></div>
      <div className="design-grid compact home-recent-grid">{recent.map((design, index) => <DesignCard key={design.id} design={design} editable={false} eager={index === 0} />)}</div>
    </section>
  </>;
}
