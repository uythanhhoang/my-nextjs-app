import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client KHÔNG gắn type Database — dùng riêng cho các bảng/view mới
// (match_goals, top_scorers) chưa có trong supabase_types.ts.
// Lý do: dự án quy ước không regenerate supabase_types.ts để tránh phá vỡ
// các component đã dùng kiểu cũ (xem ghi chú trong lib/supabase.ts).
// Cùng project/kết nối Supabase, chỉ khác ở việc bỏ qua type-checking .from().
export const supabaseUntyped = createClient(supabaseUrl, supabaseAnonKey);
