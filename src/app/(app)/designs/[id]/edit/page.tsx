import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DesignForm } from "@/components/design-form";
import { PageHeader } from "@/components/page-header";
import { DESIGN_CATEGORIES } from "@/lib/constants";
import { getClothTypes, getDesign, getKarigars } from "@/lib/data";
import { formatDesignNumber } from "@/lib/format";

export default async function EditDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [design, karigars, clothTypes] = await Promise.all([getDesign(id), getKarigars(), getClothTypes()]);
  return <><Link href="/designs" className="back-link"><ArrowLeft size={17} /> Back to designs</Link><PageHeader eyebrow="Edit catalogue entry" title={formatDesignNumber(design)} description="Update its photograph, pricing and assignment." /><section className="form-page-card"><DesignForm design={design} karigars={karigars} clothTypes={clothTypes} categories={DESIGN_CATEGORIES} /></section></>;
}
