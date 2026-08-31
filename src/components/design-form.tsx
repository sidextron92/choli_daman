"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Images, X } from "lucide-react";
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
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const clothDialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(design ? updateDesignAction : createDesignAction, INITIAL_ACTION_STATE);
  const initialSelected = useMemo(() => new Set(design?.cloth_types.map((item) => item.cloth_type_id) ?? []), [design]);
  const [selected, setSelected] = useState(initialSelected);
  const [preview, setPreview] = useState(design ? `/api/design-images/${design.id}` : "");
  const [processing, setProcessing] = useState(false);
  const [imageSource, setImageSource] = useState<"gallery" | "camera">("gallery");

  useEffect(() => { if (state.status === "success") router.refresh(); }, [state.status, router]);
  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  async function handleFile(file: File | undefined, input: HTMLInputElement | null, source: "gallery" | "camera") {
    if (!file || !input) return;
    setProcessing(true);
    try {
      const processed = await compressImage(file);
      const transfer = new DataTransfer();
      transfer.items.add(processed);
      input.files = transfer.files;
      const otherInput = source === "gallery" ? cameraRef.current : galleryRef.current;
      if (otherInput) otherInput.value = "";
      setImageSource(source);
      setPreview(URL.createObjectURL(processed));
    } finally { setProcessing(false); }
  }

  const selectedCloths = clothTypes.filter((cloth) => selected.has(cloth.id));

  function finishClothSelection() {
    const dialog = clothDialogRef.current;
    const invalidInput = dialog?.querySelector<HTMLInputElement>("input:invalid");
    if (invalidInput) {
      invalidInput.reportValidity();
      invalidInput.focus();
      return;
    }
    dialog?.close();
  }

  return (
    <form action={formAction} className="design-form">
      {design && <input type="hidden" name="id" value={design.id} />}
      <div className="image-field">
        {preview ? <div className="form-image"><Image src={preview} alt="Design preview" fill sizes="320px" unoptimized={preview.startsWith("blob:") || design?.design_type === "OPEN_DESIGN"} /></div> : <div className="image-placeholder"><Camera size={30} /><span>Add a design photograph</span><small className="hint image-upload-hint">Images over 5 MB are compressed before upload. Maximum 10 MB.</small></div>}
        <div className="image-source-actions">
          <label className="button secondary upload-button"><Images size={17} /> {processing && imageSource === "gallery" ? "Compressing…" : "Gallery"}
            <input ref={galleryRef} name={imageSource === "gallery" ? "image" : undefined} type="file" accept="image/*" required={!design && imageSource === "gallery"} onChange={(event) => void handleFile(event.target.files?.[0], galleryRef.current, "gallery")} disabled={pending || processing} />
          </label>
          <label className="button secondary upload-button"><Camera size={17} /> {processing && imageSource === "camera" ? "Compressing…" : "Camera"}
            <input ref={cameraRef} name={imageSource === "camera" ? "image" : undefined} type="file" accept="image/*" capture="environment" required={!design && imageSource === "camera"} onChange={(event) => void handleFile(event.target.files?.[0], cameraRef.current, "camera")} disabled={pending || processing} />
          </label>
        </div>
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

      <div className="cloth-picker-field">
        <button className="button secondary cloth-picker-trigger" type="button" onClick={() => clothDialogRef.current?.showModal()}><Images size={17} /> Select cloth type {selected.size ? <span>{selected.size}</span> : null}</button>
        {selectedCloths.length ? <div className="selected-cloth-pills" aria-label="Selected cloth types">{selectedCloths.map((cloth) => <button key={cloth.id} type="button" onClick={() => setSelected((previous) => { const next = new Set(previous); next.delete(cloth.id); return next; })}>{cloth.name}<X size={13} /></button>)}</div> : <small className="hint">No cloth types selected</small>}
        <dialog ref={clothDialogRef} className="cloth-picker-dialog">
          <div className="cloth-picker-header"><div><p className="eyebrow">Design pricing</p><h2>Select cloth type</h2></div><button className="icon-button" type="button" onClick={() => clothDialogRef.current?.close()} aria-label="Close cloth selector"><X size={20} /></button></div>
          <fieldset className="cloth-pricing"><legend>Cloth types and sell prices</legend>
            <div className="cloth-options">
              {clothTypes.map((cloth) => {
                const active = selected.has(cloth.id);
                const current = design?.cloth_types.find((item) => item.cloth_type_id === cloth.id);
                return <div className={`cloth-option ${active ? "selected" : ""}`} key={cloth.id}>
                  <label><input type="checkbox" name="cloth_type_ids" value={cloth.id} checked={active} onChange={(event) => setSelected((previous) => { const next = new Set(previous); if (event.target.checked) next.add(cloth.id); else next.delete(cloth.id); return next; })} /> <span>{cloth.name}</span></label>
                  <input aria-label={`${cloth.name} sell price`} name={`price_${cloth.id}`} type="number" inputMode="decimal" min="0" step="0.01" placeholder="Sell ₹" defaultValue={current?.sell_price} disabled={!active} required={active} />
                </div>;
              })}
            </div>
          </fieldset>
          <div className="cloth-picker-footer"><button className="button primary large" type="button" onClick={finishClothSelection} disabled={!selected.size}><Check size={17} /> Done</button></div>
        </dialog>
      </div>
      <FormMessage state={state} />
      <button className="button primary large" disabled={pending || processing}>{pending ? "Saving design…" : design ? "Save design" : "Create design"}</button>
    </form>
  );
}
