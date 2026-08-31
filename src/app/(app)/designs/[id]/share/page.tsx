import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, MessageCircle } from "lucide-react";
import { getDesign } from "@/lib/data";
import { formatCurrency, formatDesignNumber, normalizePhone } from "@/lib/format";

export default async function ShareDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = await getDesign(id);
  const lines = [
    `*${formatDesignNumber(design)}*`,
    `Category: ${design.category}`,
    ...design.cloth_types.map((cloth) => `${cloth.cloth_type_name}: ${formatCurrency(cloth.sell_price)}`),
  ];
  const message = lines.join("\n");
  const whatsApp = design.karigar_mobile ? `https://wa.me/${normalizePhone(design.karigar_mobile)}?text=${encodeURIComponent(message)}` : null;
  return <>
    <Link href="/designs" className="back-link"><ArrowLeft size={17} /> Back to designs</Link>
    <section className="share-layout"><div className="share-preview"><div className="share-image"><Image src={`/api/design-images/${design.id}`} alt={formatDesignNumber(design)} fill sizes="(max-width: 800px) 100vw, 540px" preload unoptimized={design.design_type === "OPEN_DESIGN"} /></div><div className="share-caption"><p className="eyebrow">WhatsApp preview</p><h1>{formatDesignNumber(design)}</h1><p>{design.category}</p><div className="share-prices">{design.cloth_types.map((cloth) => <span key={cloth.cloth_type_id}>{cloth.cloth_type_name}<strong>{formatCurrency(cloth.sell_price)}</strong></span>)}</div></div></div>
      <aside className="share-actions"><h2>Ready to share</h2><p>Assigned to <strong>{design.karigar_name ?? "no karigar"}</strong>.</p><pre>{message}</pre>{whatsApp ? <a className="button whatsapp large" href={whatsApp} target="_blank" rel="noreferrer"><MessageCircle size={19} /> Open WhatsApp</a> : <p className="form-message error">Assign a karigar with a mobile number to enable WhatsApp.</p>}<a className="button secondary" href={`/api/design-images/${design.id}?download=1`}><Download size={17} /> Download image</a></aside>
    </section>
  </>;
}
