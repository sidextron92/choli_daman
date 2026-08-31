"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the form.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { status: "error", message: "Email or password is incorrect." };

  redirect("/");
}

export async function logoutAction() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
