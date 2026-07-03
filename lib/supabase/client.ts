import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para o browser (chave pública). Usado apenas para Realtime
 * (inscrição em mudanças). As leituras/escritas de dados vão pelas Server Actions.
 */
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);
