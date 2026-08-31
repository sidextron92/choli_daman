import Image from "next/image";
import Link from "next/link";
import { Edit3, MessageCircle, UserRound } from "lucide-react";
import { DeleteControl } from "@/components/delete-control";
import { formatCurrency, formatDesignNumber } from "@/lib/format";
import type { Design } from "@/lib/types";

export function DesignCard({ design, editable = true, eager = false, showKarigar = true }: { design: Design; editable?: boolean; eager?: boolean; showKarigar?: boolean }) {
  return <article className="design-card">
    <Link href={`/designs/${design.id}/share`} className="design-image">
      <Image src={`/api/design-images/${design.id}`} alt={formatDesignNumber(design)} fill sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, (max-width: 1400px) 25vw, 20vw" loading={eager ? "eager" : "lazy"} unoptimized={design.design_type === "OPEN_DESIGN"} />
      <span className={`design-badge ${design.design_type === "OPEN_DESIGN" ? "open" : ""}`}>{formatDesignNumber(design, true)}</span>
    </Link>
    <div className="design-card-body">
      <div className="card-title-row"><div><small>{design.category}</small><h3>{formatDesignNumber(design)}</h3></div><strong>{formatCurrency(design.cost)}</strong></div>
      <div className="chips">{design.cloth_types.length ? design.cloth_types.map((cloth) => <span key={cloth.cloth_type_id}>{cloth.cloth_type_name} · {formatCurrency(cloth.sell_price)}</span>) : <span className="subtle">Open pricing</span>}</div>
      {showKarigar ? <p className="karigar-line"><UserRound size={15} /> {design.karigar_name ?? "Unassigned"}</p> : null}
      {editable && <div className="card-actions">
        <Link className="button secondary small" href={`/designs/${design.id}/edit`}><Edit3 size={15} /> Edit</Link>
        <Link className="icon-button" href={`/designs/${design.id}/share`} title="WhatsApp preview"><MessageCircle size={17} /></Link>
        <DeleteControl kind="design" id={design.id} />
      </div>}
    </div>
  </article>;
}
