import Link from "next/link";
import { Edit3, MessageCircle, MoreVertical, UserRound } from "lucide-react";
import { DeleteControl } from "@/components/delete-control";
import { DesignImagePreview } from "@/components/design-image-preview";
import { formatDesignNumber } from "@/lib/format";
import type { Design } from "@/lib/types";

export function DesignCard({ design, editable = true, eager = false, showKarigar = true }: { design: Design; editable?: boolean; eager?: boolean; showKarigar?: boolean }) {
  return <article className="design-card">
    <div className="design-image">
      <DesignImagePreview id={design.id} imageUrl={design.image_url} name={formatDesignNumber(design)} eager={eager} unoptimized={design.design_type === "OPEN_DESIGN"} />
      {editable ? <details className="design-actions-menu">
        <summary aria-label={`Actions for ${formatDesignNumber(design)}`} title="Design actions"><MoreVertical size={19} /></summary>
        <div className="design-actions-popover">
          <Link href={`/designs/${design.id}/edit`}><Edit3 size={15} /> Edit</Link>
          <Link href={`/designs/${design.id}/share`}><MessageCircle size={15} /> WhatsApp preview</Link>
          <DeleteControl kind="design" id={design.id} />
        </div>
      </details> : null}
    </div>
    <div className="design-card-body">
      <div className="card-title-row"><div><small>{design.category}</small><h3>{formatDesignNumber(design)}</h3></div></div>
      {showKarigar ? <p className="karigar-line"><UserRound size={15} /> {design.karigar_name ?? "Unassigned"}</p> : null}
    </div>
  </article>;
}
