"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteDesignAction } from "@/lib/actions/designs";
import { deleteKarigarAction } from "@/lib/actions/karigars";
import { deleteClothTypeAction } from "@/lib/actions/cloth-types";

type Kind = "design" | "karigar" | "cloth-type";

export function DeleteControl({ id, kind, redirectTo }: { id: string; kind: Kind; redirectTo?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const labels: Record<Kind, string> = { design: "design", karigar: "karigar", "cloth-type": "cloth type" };

  function remove() {
    if (!window.confirm(`Permanently delete this ${labels[kind]}?`)) return;
    setError("");
    startTransition(async () => {
      const result = kind === "design" ? await deleteDesignAction(id) : kind === "karigar" ? await deleteKarigarAction(id) : await deleteClothTypeAction(id);
      if (result.status === "error") return setError(result.message);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <div className="delete-control">
      <button type="button" onClick={remove} className="button danger ghost" disabled={pending}><Trash2 size={16} /> {pending ? "Deleting…" : "Delete"}</button>
      {error && <small className="error-text">{error}</small>}
    </div>
  );
}
