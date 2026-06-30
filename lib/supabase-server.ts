// Server-side Supabase client — dùng trong Server Components và lib/queries
// Dùng cùng createClient đơn giản như lib/supabase.ts vì app không có auth.
// Tách file riêng để tránh import nhầm 'use client' component.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase_types";

export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
