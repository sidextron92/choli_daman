"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClothTypeAction, updateClothTypeAction } from "@/lib/actions/cloth-types";
import { INITIAL_ACTION_STATE, type ClothType } from "@/lib/types";
import { FormMessage } from "@/components/form-message";

export function ClothTypeForm({ clothType }: { clothType?: ClothType }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(clothType ? updateClothTypeAction : createClothTypeAction, INITIAL_ACTION_STATE);
  useEffect(() => { if (state.status === "success") router.refresh(); }, [state.status, router]);
  return (
    <form action={formAction} className="stack-form compact-form">
      {clothType && <input type="hidden" name="id" value={clothType.id} />}
      <label className="field"><span>Name</span><input name="name" defaultValue={clothType?.name} required maxLength={100} />
        {state.fieldErrors?.name?.map((e) => <small key={e}>{e}</small>)}</label>
      <label className="field"><span>Description</span><textarea name="description" defaultValue={clothType?.description ?? ""} rows={3} maxLength={500} />
        {state.fieldErrors?.description?.map((e) => <small key={e}>{e}</small>)}</label>
      <FormMessage state={state} />
      <button className="button primary" disabled={pending}>{pending ? "Saving…" : clothType ? "Save changes" : "Add cloth type"}</button>
    </form>
  );
}
