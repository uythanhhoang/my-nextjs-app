import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase_types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client được gắn type Database (sinh từ supabase_types.ts) để mọi truy vấn
// .from("...").select("...") đều có gợi ý cột & kiểm tra kiểu dữ liệu.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
