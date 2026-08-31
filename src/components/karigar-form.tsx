"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createKarigarAction, updateKarigarAction } from "@/lib/actions/karigars";
import { INITIAL_ACTION_STATE, type Karigar } from "@/lib/types";
import { FormMessage } from "@/components/form-message";

export function KarigarForm({ karigar }: { karigar?: Karigar }) {
  const router = useRouter();
  const action = karigar ? updateKarigarAction : createKarigarAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_ACTION_STATE);
  useEffect(() => { if (state.status === "success") router.refresh(); }, [state.status, router]);

  return (
    <form action={formAction} className="stack-form">
      {karigar && <input type="hidden" name="id" value={karigar.id} />}
      <label className="field"><span>Karigar name</span><input name="name" defaultValue={karigar?.name} required maxLength={100} />
        {state.fieldErrors?.name?.map((e) => <small key={e}>{e}</small>)}</label>
      <label className="field"><span>Mobile number</span><input name="mobile_number" type="tel" defaultValue={karigar?.mobile_number} placeholder="+91-9876543210" required minLength={10} maxLength={15} />
        {state.fieldErrors?.mobile_number?.map((e) => <small key={e}>{e}</small>)}</label>
      {!karigar && <p className="hint">An Open Design will be created automatically.</p>}
      <FormMessage state={state} />
      <button className="button primary" disabled={pending}>{pending ? "Saving…" : karigar ? "Update karigar" : "Add karigar"}</button>
    </form>
  );
}
