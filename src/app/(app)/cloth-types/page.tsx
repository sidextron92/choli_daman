import { Shirt } from "lucide-react";
import { ClothTypeForm } from "@/components/cloth-type-form";
import { CreateClothTypeModal } from "@/components/create-cloth-type-modal";
import { DeleteControl } from "@/components/delete-control";
import { PageHeader } from "@/components/page-header";
import { getClothTypes } from "@/lib/data";

export default async function ClothTypesPage() {
  const clothTypes = await getClothTypes();
  return <>
    <PageHeader title="Cloth Types" description={`${clothTypes.length} fabric options available for design pricing.`} />
    <CreateClothTypeModal><ClothTypeForm /></CreateClothTypeModal>
    <div className="cloth-list">{clothTypes.map((clothType) => <article className="cloth-row" key={clothType.id}><div className="cloth-icon"><Shirt size={23} /></div><div className="cloth-copy"><h2>{clothType.name}</h2><p>{clothType.description || "No description added."}</p></div><div className="cloth-row-actions"><details className="edit-popover"><summary className="button secondary small">Edit</summary><div className="popover-card"><ClothTypeForm clothType={clothType} /></div></details><DeleteControl kind="cloth-type" id={clothType.id} /></div></article>)}</div>
  </>;
}
