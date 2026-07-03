import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a chave `service_role`. Bypassa RLS — use APENAS no
 * servidor (Server Actions / Route Handlers). Nunca importe em componentes client.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

export const AVATARS_BUCKET = "avatars";
