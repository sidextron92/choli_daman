"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";
import { createDesignAction, updateDesignAction } from "@/lib/actions/designs";
import { DEFAULT_DESIGN_CATEGORY } from "@/lib/constants";
import { INITIAL_ACTION_STATE, type ClothType, type Design, type Karigar } from "@/lib/types";
import { FormMessage } from "@/components/form-message";

async function compressImage(file: File) {
  if (file.size <= 5 * 1024 * 1024 || !file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / bitmap.width, 1920 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  bitmap.close();
  return blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file;
}

export function DesignForm({ design, karigars, clothTypes, categories }: {
  design?: Design;
  karigars: Karigar[];
  clothTypes: ClothType[];
  categories: readonly string[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(design ? updateDesignAction : createDesignAction, INITIAL_ACTION_STATE);
  const initialSelected = useMemo(() => new Set(design?.cloth_types.map((item) => item.cloth_type_id) ?? []), [design]);
  const [selected, setSelected] = useState(initialSelected);
  const [preview, setPreview] = useState(design ? `/api/design-images/${design.id}` : "");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { if (state.status === "success") router.refresh(); }, [state.status, router]);
  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  async function handleFile(file?: File) {
    if (!file || !fileRef.current) return;
    setProcessing(true);
    try {
      const processed = await compressImage(file);
      const transfer = new DataTransfer();
      transfer.items.add(processed);
      fileRef.current.files = transfer.files;
      setPreview(URL.createObjectURL(processed));
    } finally { setProcessing(false); }
  }

  return (
    <form action={formAction} className="design-form">
      {design && <input type="hidden" name="id" value={design.id} />}
      <div className="image-field">
        {preview ? <div className="form-image"><Image src={preview} alt="Design preview" fill sizes="320px" unoptimized={preview.startsWith("blob:") || design?.design_type === "OPEN_DESIGN"} /></div> : <div className="image-placeholder"><Camera size={30} /><span>Add a design photograph</span></div>}
        <label className="button secondary upload-button"><Upload size={17} /> {processing ? "Compressing…" : design ? "Replace image" : "Choose image"}
          <input ref={fileRef} name="image" type="file" accept="image/*" capture={false} required={!design} onChange={(event) => handleFile(event.target.files?.[0])} disabled={pending || processing} />
        </label>
        <small className="hint">Images over 5 MB are compressed before upload. Maximum 10 MB.</small>
      </div>

      <div className="form-grid two">
        <label className="field"><span>Cost price</span><input name="cost" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={design?.cost} required /></label>
        <label className="field"><span>Category</span><select name="category" defaultValue={design?.category ?? DEFAULT_DESIGN_CATEGORY} required>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select></label>
      </div>
      <label className="field"><span>Assign to karigar <em>Optional</em></span><select name="karigar_id" defaultValue={design?.karigar_id ?? ""}>
        <option value="">Unassigned</option>
        {karigars.map((karigar) => <option key={karigar.id} value={karigar.id}>{karigar.name} — {karigar.mobile_number}</option>)}
      </select></label>

      <fieldset className="cloth-pricing"><legend>Cloth types and sell prices</legend>
        <div className="cloth-options">
          {clothTypes.map((cloth) => {
            const active = selected.has(cloth.id);
            const current = design?.cloth_types.find((item) => item.cloth_type_id === cloth.id);
            return <div className={`cloth-option ${active ? "selected" : ""}`} key={cloth.id}>
              <label><input type="checkbox" name="cloth_type_ids" value={cloth.id} defaultChecked={active} onChange={(e) => setSelected((previous) => { const next = new Set(previous); if (e.target.checked) next.add(cloth.id); else next.delete(cloth.id); return next; })} /> <span>{cloth.name}</span></label>
              <input aria-label={`${cloth.name} sell price`} name={`price_${cloth.id}`} type="number" inputMode="decimal" min="0" step="0.01" placeholder="Sell ₹" defaultValue={current?.sell_price} disabled={!active} required={active} />
            </div>;
          })}
        </div>
      </fieldset>
      <FormMessage state={state} />
      <button className="button primary large" disabled={pending || processing}>{pending ? "Saving design…" : design ? "Save design" : "Create design"}</button>
    </form>
  );
}
