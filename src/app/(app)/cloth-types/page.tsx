import { Plus } from "lucide-react";
import { BrandIcon } from "@/components/brand-icon";
import { ClothTypeForm } from "@/components/cloth-type-form";
import { DeleteControl } from "@/components/delete-control";
import { PageHeader } from "@/components/page-header";
import { getClothTypes } from "@/lib/data";

export default async function ClothTypesPage() {
  const clothTypes = await getClothTypes();
  return <>
    <PageHeader eyebrow="Pricing foundation" title="Cloth Types" description={`${clothTypes.length} fabric options available for design pricing.`} />
    <details className="create-panel"><summary className="button primary"><Plus size={17} /> Add cloth type</summary><div className="panel-body narrow"><h2>New cloth type</h2><ClothTypeForm /></div></details>
    <div className="cloth-list">{clothTypes.map((clothType) => <article className="cloth-row" key={clothType.id}><div className="cloth-icon"><BrandIcon /></div><div className="cloth-copy"><h2>{clothType.name}</h2><p>{clothType.description || "No description added."}</p></div><details className="edit-popover"><summary className="button secondary small">Edit</summary><div className="popover-card"><ClothTypeForm clothType={clothType} /></div></details><DeleteControl kind="cloth-type" id={clothType.id} /></article>)}</div>
  </>;
}
