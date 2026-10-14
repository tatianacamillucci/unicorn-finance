"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEMO_COOKIE } from "@/lib/demo/mode";

export async function attivaDemo(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };

  const store = await cookies();
  store.set(DEMO_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
  return {};
}

export async function disattivaDemo(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Non autenticato" };

  const store = await cookies();
  store.delete(DEMO_COOKIE);
  revalidatePath("/", "layout");
  return {};
}
