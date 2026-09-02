import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { getDesign } from "@/lib/data";
import { formatDesignNumber } from "@/lib/format";

export default async function ShareDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = await getDesign(id);
  const designNumber = formatDesignNumber(design);
  return <>
    <Link href="/designs" className="back-link"><ArrowLeft size={17} /> Back to designs</Link>
    <WhatsAppShareButton
      id={design.id}
      designNumber={designNumber}
      category={design.category}
    />
  </>;
}
