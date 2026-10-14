import { createClient } from "@/lib/supabase/server";

export interface Profilo {
  nickname: string | null;
  obiettivoRisparmio: number | null;
}

export async function getProfilo(): Promise<Profilo> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { nickname: null, obiettivoRisparmio: null };

  const { data, error } = await supabase
    .from("stato_utente")
    .select("nickname, obiettivo_risparmio")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;

  return {
    nickname: data?.nickname ?? null,
    obiettivoRisparmio: data?.obiettivo_risparmio
      ? Number(data.obiettivo_risparmio)
      : null,
  };
}
