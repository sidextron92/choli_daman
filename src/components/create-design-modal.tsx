"use client";

import { Plus, X } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

interface DesignModalContextValue {
  close: () => void;
}

export const DesignModalContext = createContext<DesignModalContextValue | null>(null);

export function useDesignModal() {
  const context = useContext(DesignModalContext);
  if (!context) throw new Error("useDesignModal must be used within CreateDesignModal");
  return context;
}

export function CreateDesignModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <DesignModalContext.Provider value={{ close: () => setOpen(false) }}>
      <button className="button primary floating-add-button" type="button" onClick={() => setOpen(true)}><Plus size={18} /> <span>Add design</span></button>
      {open ? (
        <dialog ref={dialogRef} className="design-create-dialog">
          <div className="design-create-dialog-header">
            <h2>New design</h2>
            <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close add design form"><X size={21} /></button>
          </div>
          <div className="design-create-dialog-body">{children}</div>
        </dialog>
      ) : null}
    </DesignModalContext.Provider>
  );
}
