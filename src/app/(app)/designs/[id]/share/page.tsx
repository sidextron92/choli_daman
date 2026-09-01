import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { getDesign } from "@/lib/data";
import { formatCurrency, formatDesignNumber } from "@/lib/format";

export default async function ShareDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = await getDesign(id);
  const lines = [
    `*${formatDesignNumber(design)}*`,
    `Category: ${design.category}`,
    ...design.cloth_types.map((cloth) => `${cloth.cloth_type_name}: ${formatCurrency(cloth.sell_price)}`),
  ];
  const message = lines.join("\n");
  const designNumber = formatDesignNumber(design);
  return <>
    <Link href="/designs" className="back-link"><ArrowLeft size={17} /> Back to designs</Link>
    <section className="share-layout"><div className="share-preview"><div className="share-image"><Image src={`/api/design-images/${design.id}`} alt={designNumber} fill sizes="(max-width: 800px) 100vw, 540px" preload unoptimized={design.design_type === "OPEN_DESIGN"} /><span className="share-design-overlay">{designNumber}</span></div><div className="share-caption"><p className="eyebrow">WhatsApp preview</p><h1>{designNumber}</h1><p>{design.category}</p><div className="share-prices">{design.cloth_types.map((cloth) => <span key={cloth.cloth_type_id}>{cloth.cloth_type_name}<strong>{formatCurrency(cloth.sell_price)}</strong></span>)}</div></div></div>
      <aside className="share-actions"><h2>Ready to share</h2><p>Select WhatsApp and then choose the recipient.</p><pre>{message}</pre><WhatsAppShareButton id={design.id} designNumber={designNumber} message={message} /><a className="button secondary" href={`/api/design-images/${design.id}?download=1`}><Download size={17} /> Download image</a></aside>
    </section>
  </>;
}
