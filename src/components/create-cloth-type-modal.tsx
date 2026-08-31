"use client";

import { Plus, X } from "lucide-react";
import { useRef } from "react";

export function CreateClothTypeModal({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return <>
    <button className="button primary floating-add-button" type="button" onClick={() => dialogRef.current?.showModal()}><Plus size={18} /> <span>Add cloth type</span></button>
    <dialog ref={dialogRef} className="design-create-dialog cloth-type-create-dialog">
      <div className="design-create-dialog-header">
        <h2>New cloth type</h2>
        <button className="icon-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close add cloth type form"><X size={21} /></button>
      </div>
      <div className="design-create-dialog-body cloth-type-create-dialog-body">{children}</div>
    </dialog>
  </>;
}
