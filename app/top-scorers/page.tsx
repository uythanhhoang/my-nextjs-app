import { supabaseUntyped } from "@/lib/supabase-untyped";
import type { TopScorerRow } from "@/types/top-scorers";
import TopScorersTable from "@/components/TopScorersTable";

export const revalidate = 0;

export default async function TopScorersPage() {
  const { data: scorers, error } = await supabaseUntyped
    .from("top_scorers")
    .select("*")
    .order("goals", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-900 p-8 text-white">
      <h1 className="mb-2 text-3xl font-bold">👟 Vua phá lưới — World Cup 2026</h1>
      <p className="mb-6 text-sm text-slate-400">
        Thống kê bàn thắng từ Vòng 32 đội trở đi.
      </p>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-red-300">
          ❌ Lỗi tải dữ liệu từ Supabase: {error.message}
        </div>
      ) : (
        <TopScorersTable initialScorers={(scorers ?? []) as TopScorerRow[]} />
      )}
    </main>
  );
}
