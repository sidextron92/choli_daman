import type { ActionState } from "@/lib/types";

export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;
  return <p className={`form-message ${state.status}`}>{state.message}</p>;
}
