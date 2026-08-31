"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { INITIAL_ACTION_STATE } from "@/lib/types";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, INITIAL_ACTION_STATE);

  return (
    <form action={action} className="auth-form">
      <label className="field">
        <span>Email address</span>
        <input name="email" type="email" autoComplete="email" required autoFocus />
        {state.fieldErrors?.email?.map((error) => <small key={error}>{error}</small>)}
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
        {state.fieldErrors?.password?.map((error) => <small key={error}>{error}</small>)}
      </label>
      {state.status === "error" && <p className="form-message error">{state.message}</p>}
      <button className="button primary large" disabled={pending}>
        <LogIn size={18} /> {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
